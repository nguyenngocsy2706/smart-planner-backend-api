const crypto = require('crypto');
// Tạo chuỗi 32 bytes (256 bits)
const secureKey = crypto.randomBytes(32).toString('base64');
console.log(secureKey);