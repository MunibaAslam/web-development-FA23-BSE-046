const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_secret_key_here_change_this';

// Register user
router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    try {
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone || null, 'patient']
        );
        
        const token = jwt.sign({ id: result.insertId, email, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ 
            success: true, 
            message: 'Registration successful!',
            token,
            user: { id: result.insertId, name, email, role: 'patient' }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error logging in' });
    }
});

module.exports = { router };