const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Initialize database connection and test connectivity
async function initializeDatabase() {
    try {
        await prisma.$connect();
        console.log('Connected to PostgreSQL database via Prisma');
        return Promise.resolve();
    } catch (error) {
        console.error('Error connecting to database:', error);
        return Promise.reject(error);
    }
}

// Function to add a new message to the database
async function addMessage(fromUser, toUser, subject, body) {
    try {
        const message = await prisma.message.create({
            data: {
                fromUser,
                toUser,
                subject,
                body
            }
        });
        return { id: message.id };
    } catch (error) {
        throw error;
    }
}

// Function to get all messages received by a specific user
async function getMessagesForUser(username) {
    try {
        const messages = await prisma.message.findMany({
            where: {
                toUser: username
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return messages;
    } catch (error) {
        throw error;
    }
}

// Function to get all messages sent by a specific user
async function getMessagesFromUser(username) {
    try {
        const messages = await prisma.message.findMany({
            where: {
                fromUser: username
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return messages;
    } catch (error) {
        throw error;
    }
}

// Function to create a user with a hashed password
async function createUser(username, passwordHash) {
    try {
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash
            }
        });
        return { id: user.id, username: user.username };
    } catch (error) {
        throw error;
    }
}

// Function to look up a user by username
async function getUserByUsername(username) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                username
            }
        });
        return user;
    } catch (error) {
        throw error;
    }
}

// Export functions and Prisma client so other files can import and use them
module.exports = {
    prisma,
    initializeDatabase,
    addMessage,
    getMessagesFromUser,
    getMessagesForUser,
    createUser,
    getUserByUsername
};