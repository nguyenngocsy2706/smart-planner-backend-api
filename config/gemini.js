const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const logger = require('../utils/logger');

const DEFAULT_MODEL = 'gemini-2.5-flash';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

if (!process.env.GEMINI_API_KEY) {
    logger.warn('⚠️ GEMINI_API_KEY is missing');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* =========================
   UTIL
========================= */

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const shouldRetry = (err) => {
    const msg = err?.message || '';
    return msg.includes('429') || msg.includes('503');
};

const retryRequest = async (fn, args, modelName) => {
    for (let i = 1; i <= MAX_RETRIES; i++) {
        try {
            return await fn(...args);
        } catch (err) {
            if (!shouldRetry(err) || i === MAX_RETRIES) throw err;
            const delay = BASE_DELAY_MS * Math.pow(2, i - 1);
            logger.warn(`[Retry ${i}/${MAX_RETRIES}] Gemini overloaded (${modelName}) – retry in ${delay}ms`);
            await sleep(delay);
        }
    }
};

/* =========================
   MODEL
========================= */

const getGenerativeModel = (modelName = DEFAULT_MODEL) =>
    genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        },
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
    });

/* =========================
   TEXT
========================= */

const generateText = async (prompt, modelName = DEFAULT_MODEL) => {
    const logic = async () => {
        const model = getGenerativeModel(modelName);
        const res = await model.generateContent(prompt);
        return res.response.text();
    };

    try {
        return await retryRequest(logic, [], modelName);
    } catch (err) {
        logger.error('❌ generateText failed: %o', err);
        throw new Error('Failed to generate text');
    }
};

/* =========================
   STRUCTURED (JSON)
========================= */

const _structuredLogic = async (prompt, schema, modelName) => {
    const model = getGenerativeModel(modelName);

    const result = await model.generateContent({
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
        },
    });

    const response = result.response;
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (part?.json) return part.json;
    if (part?.functionCall?.args) return part.functionCall.args;

    const text = response.text?.();
    if (text) {
        try {
            return JSON.parse(text);
        } catch (err) {
            console.error('❌ JSON parse failed:', text);
            throw err;
        }
    }

    throw new Error('Gemini did not return structured JSON');
};


const generateStructuredContent = async (prompt, schema, modelName = DEFAULT_MODEL) => {
    try {
        return await retryRequest(
            _structuredLogic,
            [prompt, schema, modelName],
            modelName
        );
    } catch (err) {
        logger.error('❌ generateStructuredContent failed: %o', err);
        throw new Error('Failed to generate structured content from Gemini AI');
    }
};

/* =========================
   CHAT
========================= */

const startChatSession = (history = [], modelName = DEFAULT_MODEL) => {
    const model = getGenerativeModel(modelName);
    return model.startChat({ history });
};

/* =========================
   EXPORT
========================= */

module.exports = {
    genAI,
    generateText,
    generateStructuredContent,
    startChatSession,
};
