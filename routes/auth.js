const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');
const { verifyToken, SECRET_KEY } = require('../middleware/auth');

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Login va parolni kiriting' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Login yoki parol xato' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Login yoki parol xato' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', verifyToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, full_name, role, is_active FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      console.error("/me failed: User not found for id", req.user.id);
      return res.status(404).json({ success: false, error: 'Foydalanuvchi topilmadi' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("/me Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
