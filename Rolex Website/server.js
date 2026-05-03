// server.js - Simple Express Backend for Rolex Website
const express = require('express');
const cors = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage (simple, no database)
const users = [];
const sessions = {};

// Helper Functions
const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const findUserByEmail = (email) => {
    return users.find(user => user.email === email);
};

// ========== API ROUTES ==========

// Home route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Rolex API Server',
        status: 'running',
        endpoints: ['/api/signup', '/api/login', '/api/verify', '/api/logout']
    });
});

// SIGNUP - Create new account
app.post('/api/signup', (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ 
            error: 'All fields are required' 
        });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ 
            error: 'Password must be at least 6 characters' 
        });
    }
    
    // Check if user exists
    if (findUserByEmail(email)) {
        return res.status(409).json({ 
            error: 'An account with this email already exists' 
        });
    }
    
    // Create user (in real app, password would be hashed)
    const newUser = {
        id: Date.now().toString(),
        firstName,
        lastName,
        email,
        password, // NOTE: In production, use bcrypt to hash passwords!
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Generate token
    const token = generateToken();
    sessions[token] = newUser.id;
    
    console.log(`✅ New user registered: ${email}`);
    
    res.status(201).json({
        message: 'Account created successfully',
        user: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email
        },
        token
    });
});

// LOGIN - Authenticate user
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
        return res.status(400).json({ 
            error: 'Email and password are required' 
        });
    }
    
    // Find user
    const user = findUserByEmail(email);
    
    if (!user) {
        return res.status(401).json({ 
            error: 'No account found with this email' 
        });
    }
    
    // Check password (in real app, compare hashed passwords)
    if (user.password !== password) {
        return res.status(401).json({ 
            error: 'Incorrect password' 
        });
    }
    
    // Generate token
    const token = generateToken();
    sessions[token] = user.id;
    
    console.log(`✅ User logged in: ${email}`);
    
    res.json({
        message: 'Login successful',
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        },
        token
    });
});

// VERIFY - Check if token is valid
app.get('/api/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'No token provided' 
        });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = sessions[token];
    
    if (!userId) {
        return res.status(401).json({ 
            error: 'Invalid or expired token' 
        });
    }
    
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(401).json({ 
            error: 'User not found' 
        });
    }
    
    res.json({
        valid: true,
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        }
    });
});

// LOGOUT - End session
app.post('/api/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        delete sessions[token];
    }
    
    res.json({ 
        message: 'Logged out successfully' 
    });
});

// GET USER INFO
app.get('/api/user/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
        return res.status(404).json({ 
            error: 'User not found' 
        });
    }
    
    res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║     ROLEX API Server Running          ║
    ║     http://localhost:${PORT}             ║
    ╚═══════════════════════════════════════╝
    
    Available Endpoints:
    • POST /api/signup  - Create account
    • POST /api/login   - Authenticate
    • GET  /api/verify  - Verify token
    • POST /api/logout  - End session
    `);
});