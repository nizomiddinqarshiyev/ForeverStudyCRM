const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'edu_crm_super_secret_key_2026';

function verifyToken(req, res, next) {
  let token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token kiritilmagan' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("verifyToken failed:", error.message);
    return res.status(403).json({ success: false, error: 'Token yaroqsiz yoki muddati otgan' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Faqat admin ruxsatiga ega' });
  }
}

module.exports = { verifyToken, requireAdmin, SECRET_KEY };
