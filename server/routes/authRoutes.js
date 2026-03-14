const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/setup');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'voyager-super-secret';

// Prepared statements for better performance and security
const insertUser = db.prepare('INSERT INTO users (id, username, passwordHash) VALUES (?, ?, ?)');
const findUserByName = db.prepare('SELECT * FROM users WHERE username = ?');

router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    
    // Check if user exists
    const existingUser = findUserByName.get(username);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const id = Date.now().toString();

    // Insert user into database
    insertUser.run(id, username, passwordHash);
    
    const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id, username } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Fetch user from database
    const user = findUserByName.get(username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare hashed passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
