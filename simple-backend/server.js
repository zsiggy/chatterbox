const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');

const {
  initializeDatabase,
  addMessage,
  getMessagesForUser,
  getMessagesFromUser,
  createUser,
  getUserByUsername
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3002;

// CRITICAL: Parse JSON before other middleware
app.use(express.json());

// FIXED: Proper CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://chatterbox-dance.vercel.app',
  'https://chatterbox-dance.vercel.app/', // with trailing slash
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // CRITICAL: Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

// FIXED: Session configuration for production
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'chatterbox.sid', // Custom cookie name
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CRITICAL for cross-domain
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
  },
  proxy: true // CRITICAL for Heroku
}));

// Trust proxy (CRITICAL for Heroku)
app.set('trust proxy', 1);

// Auth middleware
function requireAuth(req, res, next) {
  console.log('Auth check - Session:', req.session);
  console.log('Auth check - Username:', req.session?.username);
  
  if (req.session && req.session.username) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
}

// FIXED: Initialize database BEFORE starting server
let dbReady = false;

initializeDatabase()
  .then(() => {
    console.log('✓ Database initialized successfully');
    dbReady = true;
  })
  .catch(err => {
    console.error('✗ Database initialization failed:', err);
    process.exit(1);
  });

// Middleware to check if DB is ready
app.use((req, res, next) => {
  if (!dbReady && req.path !== '/') {
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Chatterbox API is running',
    dbReady,
    session: req.session ? 'active' : 'none'
  });
});

// AUTH ROUTES

// POST /signup
app.post('/signup', async (req, res) => {
  console.log('Signup request received:', { username: req.body?.username });
  
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create user
    const hash = await bcrypt.hash(password, 12);
    const user = await createUser(username, hash);

    // FIXED: Properly set session and save
    req.session.username = user.username;
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }
      
      console.log('Signup successful, session created:', req.session);
      res.status(201).json({ 
        message: 'Signup successful', 
        user: { username: user.username },
        authenticated: true
      });
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  console.log('Login request received:', { username: req.body?.username });
  
  try {
    const { username, password } = req.body;
    
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // FIXED: Properly set session and save
    req.session.username = user.username;
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }
      
      console.log('Login successful, session created:', req.session);
      res.json({ 
        message: 'Login successful', 
        user: { username: user.username },
        authenticated: true
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /logout
app.post('/logout', (req, res) => {
  console.log('Logout request received');
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.json({ message: 'Logged out' });
  });
});

// GET /me - Check authentication status
app.get('/me', (req, res) => {
  console.log('Auth status check - Session:', req.session);
  
  if (req.session && req.session.username) {
    return res.json({ 
      authenticated: true, 
      user: { username: req.session.username } 
    });
  }
  return res.json({ authenticated: false });
});

// GET /users - List all users except current user
app.get('/users', requireAuth, async (req, res) => {
  try {
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./message.db');
    
    const sql = 'SELECT username FROM users WHERE username != ? ORDER BY username ASC';
    
    db.all(sql, [req.session.username], (err, rows) => {
      db.close();
      
      if (err) {
        console.error('Error loading users:', err);
        return res.status(500).json({ error: 'Failed to load users' });
      }
      
      res.json({ users: rows.map(r => r.username) });
    });
  } catch (err) {
    console.error('Error in /users:', err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// MESSAGE ROUTES

// POST /api/send-message
app.post('/api/send-message', requireAuth, async (req, res) => {
  try {
    const { toUser, subject, body } = req.body;
    const fromUser = req.session.username;

    if (!toUser || !subject || !body) {
      return res.status(400).json({ error: 'toUser, subject, and body are required' });
    }
    
    if (toUser === fromUser) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const result = await addMessage(fromUser, toUser, subject, body);
    res.status(201).json({ message: 'Message sent', id: result.id });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messages/inbox
app.get('/api/messages/inbox', requireAuth, async (req, res) => {
  try {
    const messages = await getMessagesForUser(req.session.username);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error getting inbox:', error);
    res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
});

// GET /api/messages/sent
app.get('/api/messages/sent', requireAuth, async (req, res) => {
  try {
    const messages = await getMessagesFromUser(req.session.username);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error getting sent messages:', error);
    res.status(500).json({ success: false, message: 'Failed to get sent messages' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`!Server running on port ${PORT}`);
  console.log(`!Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`!Secure cookies: ${process.env.NODE_ENV === 'production'}`);
});