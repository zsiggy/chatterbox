// This is our simple server file
// We're using Express.js which is a framework that makes it easy to create web servers
// This server adds authentication (sessions) on top of your existing messaging API.
// Explanations are placed where new concepts first appear.

// 1) Import dependencies:
// 'const' declares a binding you don't intend to reassign.
const express = require('express');
const session = require('express-session'); // Session middleware for login persistence
const bcrypt = require('bcrypt'); // Secure password hashing
const cors = require('cors'); // Allow frontend to call backend in dev

// Import database helpers. We will add user helpers (createUser, getUserByUsername)
// and keep your existing message helpers.
const {
  initializeDatabase,
  addMessage,
  getMessagesForUser,
  getMessagesFromUser,
  createUser,
  getUserByUsername
} = require('./database');

// Create the Express app instance and set a port to listen on.
const app = express();
const PORT = 3002;

// This line tells Express to understand JSON data that comes from the frontend
// 2) Body parser: parse incoming JSON so 'req.body' is populated.
app.use(express.json());

// Allow the Vite frontend (default 5173) to talk to this backend with cookies
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// 3) Session middleware: stores a server-managed session per browser via a cookie.
// - secret: used to sign the cookie (use a strong, env-based secret in production)
// - resave/saveUninitialized: recommended values to avoid unnecessary session writes
// - cookie: httpOnly helps against XSS, maxAge controls how long you stay logged in
app.use(session({
  secret: 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  }
}));

// 4) Small auth guard. It allows access only if the user has a session.
function requireAuth(req, res, next) {
  if (req.session && req.session.username) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// 5) Initialize the database at startup. This ensures tables exist before requests hit.
initializeDatabase().then(() => {
  console.log('Database ready!');
}).catch(err => {
  console.error('Database initialization failed:', err);
});

// 6) Health route for quick checks.
app.get('/', (req, res) => {
  res.send('Messaging app backend with SQLite + sessions');
});

// 7) AUTH ROUTES

// POST /signup: register a new user
// Flow: validate -> check exists -> hash password -> create -> start session
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await getUserByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // bcrypt.hash(password, saltRounds) securely hashes the password.
    const hash = await bcrypt.hash(password, 12);
    const user = await createUser(username, hash);

    // Create a session so subsequent requests know who you are without re-login.
    req.session.username = user.username;
    res.status(201).json({ message: 'Signup successful', user: { username: user.username } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /login: start a session for an existing user
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.username = user.username;
    res.json({ message: 'Login successful', user: { username: user.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /logout: destroy the current session
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out' });
  });
});

// GET /me: check who is logged in
app.get('/me', (req, res) => {
  if (req.session && req.session.username) {
    return res.json({ authenticated: true, user: { username: req.session.username } });
  }
  return res.json({ authenticated: false });
});

// List users for composing messages (auth required)
app.get('/users', requireAuth, async (req, res) => {
  try {
    // Simple list of usernames excluding the requester
    const sql = 'SELECT username FROM users WHERE username != ? ORDER BY username ASC';
    const sqlite3 = require('sqlite3').verbose();
    // Reuse the same db instance from database.js by requiring it and accessing db is not exported.
    // Instead, query via helper we don't have; do a quick inline open for simplicity in simple-backend.
    const db = new sqlite3.Database('./message.db');
    db.all(sql, [req.session.username], (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Failed to load users' });
      }
      res.json({ users: rows.map(r => r.username) });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// 8) MESSAGE ROUTES (now session-aware). We use 'requireAuth' and the session username.

// Send a message from the logged-in user to another username
app.post('/api/send-message', requireAuth, async (req, res) => {
  try {
    const { toUser, subject, body } = req.body;
    const fromUser = req.session.username; // source of truth: session

    if (!toUser || !subject || !body) {
      return res.status(400).json({ error: 'toUser, subject, and body are required' });
    }
    if (toUser === fromUser) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    const result = await addMessage(fromUser, toUser, subject, body);
    res.status(201).json({ message: 'Message sent', id: result.id });
  } catch (error) {
    console.error('Error sending message: ', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// Inbox for the logged-in user
app.get('/api/messages/inbox', requireAuth, async (req,res) => {
  try {
    const messages = await getMessagesForUser(req.session.username);
    res.json({ success: true, messages });
  } catch(error) {
    console.error('Error getting messages: ', error);
    res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
});

// Sent items for the logged-in user
app.get('/api/messages/sent', requireAuth, async (req, res) => {
  try {
    const messages = await getMessagesFromUser(req.session.username);
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error getting sent messages:', error);
    res.status(500).json({ success: false, message: 'Failed to get sent messages' });
  }
});

// Start the HTTP server and listen on the chosen port.
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
