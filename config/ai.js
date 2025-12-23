const Groq = require("groq-sdk");
const logger = require("../utils/logger");

if (!process.env.GROQ_API_KEY) {
    logger.warn("GROQ_API_KEY is missing");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.1-8b-instant";

/**
 * Generate plain text
 */
const generateText = async (prompt) => {
    try {
        const res = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        return res.choices[0]?.message?.content;
    } catch (err) {
        logger.error("generateText failed: %o", err);
        throw new Error("AI text generation failed");
    }
};

/**
 * Generate structured JSON (schema-enforced by prompt)
 */
const generateStructuredContent = async (prompt) => {
    try {
        const res = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a strict JSON generator. ONLY return valid JSON. No explanation.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.3,
        });

        const text = res.choices[0]?.message?.content;

        return JSON.parse(text);
    } catch (err) {
        logger.error("generateStructuredContent failed: %o", err);
        throw new Error("AI structured generation failed");
    }
};

/**
 * Simple chat (stateless)
 */
const chatWithAI = async (message, history = []) => {
    try {
        const messages = [
            ...history,
            { role: "user", content: message },
        ];

        const res = await groq.chat.completions.create({
            model: MODEL,
            messages,
            temperature: 0.7,
        });

        return {
            reply: res.choices[0].message.content,
            history: [...messages, res.choices[0].message],
        };
    } catch (err) {
        logger.error("chatWithAI failed: %o", err);
        throw new Error("AI chat failed");
    }
};

module.exports = {
    generateText,
    generateStructuredContent,
    chatWithAI,
};
