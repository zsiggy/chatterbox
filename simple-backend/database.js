const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./message.db', (err) => {
    if (err) {
        console.error('Error opening database: ', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
})

// Initialize all required tables when the server starts.
// We return a 'Promise' so callers can 'await' this async work.
// A Promise has two outcomes:
//   - resolve(value): operation succeeded
//   - reject(error): operation failed
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // NEW: Users table — stores registered users with hashed passwords.
        // UNIQUE username prevents duplicates at the database level.
        const createUsersSQL = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;

        // EXISTING: Messages table — keep your original schema.
        // Stores messages sent between users by their usernames.
        const createMessagesSQL = `
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_user TEXT NOT NULL,
            to_user TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`;

        // 'db.serialize' ensures the statements run in order.
        // This is useful when table creation needs deterministic sequencing.
        db.serialize(() => {
            db.run(createUsersSQL, (err) => {
                if (err) {
                    console.error('Error creating users table:', err.message);
                    return reject(err); // Reject the Promise with the error so callers know it failed.
                }
            });

            db.run(createMessagesSQL, (err) => {
                if (err) {
                    console.error('Error creating messages table:', err.message);
                    return reject(err);
                }
            });

            // If we reach here, both db.run calls were queued without synchronous errors.
            console.log('Users and messages tables are ready');
            resolve(); // Resolve the Promise to signal success.
        });
    });
}

//ok so now we created the database and the tables

// next im making a function to add a new message to the database
function addMessage(fromUser, toUser, subject, body) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO messages (from_user, to_user, subject, body) VALUES (?, ?, ?, ?)';

        db.run(sql, [fromUser, toUser, subject, body], function(err) {
            if (err) {
                reject(err);
            } else {
                // this.lastID gives us the ID of the message we just created
                resolve({ id: this.lastID}) // but what does this help us with? like we resolved the promise but so what is the stuff in the parenthesis doing
            }
        });
    });
}

// now making the functions to get all messages sent to and by a specific user
function getMessagesForUser(username) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM messages WHERE to_user = ? ORDER BY created_at DESC';

        db.all(sql, [username], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows); // what? what does this mean?
            }
        });
    });
}

function getMessagesFromUser(username) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM messages WHERE from_user = ? ORDER BY created_at DESC';

        db.all(sql, [username], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows); // what? what does this mean?
            }
        });
    });
}

// NEW: Create a user with a hashed password (never store plain text passwords).
// 'password_hash' should be generated using bcrypt.hash(...) in your server code.
function createUser(username, passwordHash) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
        db.run(sql, [username, passwordHash], function(err) {
            if (err) {
                // Common errors include UNIQUE constraint violation if username already exists.
                return reject(err);
            }
            resolve({ id: this.lastID, username });
        });
    });
}

// NEW: Look up a user by username.
// Returns the full row, including 'password_hash' for verifying passwords on login.
function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE username = ?';
        db.get(sql, [username], (err, row) => {
            if (err) return reject(err);
            // If no user is found, 'row' is undefined — normalize to null.
            resolve(row || null);
        });
    });
}

// Export functions so other files (e.g., server.js) can import and use them.
module.exports = {
    initializeDatabase,
    addMessage,
    getMessagesFromUser,
    getMessagesForUser,
    // NEW: user helpers for authentication
    createUser,
    getUserByUsername
};