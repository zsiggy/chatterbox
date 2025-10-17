// Messages Module for Simple Messaging App
// This file handles all message-related functionality: sending, receiving, and displaying messages

// ===== MESSAGE FUNCTIONS =====

/**
 * Sends a message to another user
 * @param {string} toUser - The username to send the message to
 * @param {string} subject - The subject of the message
 * @param {string} body - The body/content of the message
 * @returns {Promise} - Promise that resolves when message is sent
 */
async function sendMessage(toUser, subject, body) {
    try {
        // Show loading state (optional - could add spinner)
        const sendButton = document.querySelector('#compose-form button[type="submit"]');
        const originalText = sendButton.textContent;
        sendButton.textContent = 'Sending...';
        sendButton.disabled = true;
        
        // Send the message to the backend
        const response = await window.apiRequest('/api/send-message', {
            method: 'POST',
            body: JSON.stringify({
                toUser: toUser,
                subject: subject,
                body: body
            })
        });
        
        // If we get here, message was sent successfully
        window.showAlert('Message sent successfully!', 'success');
        
        // Clear the form
        document.getElementById('compose-form').reset();
        
        // Refresh the sent messages list
        await loadSentMessages();
        
        return response;
        
    } catch (error) {
        // Handle sending errors
        console.error('Error sending message:', error);
        window.showAlert(error.message || 'Failed to send message. Please try again.', 'error');
        throw error;
        
    } finally {
        // Always restore the button state
        const sendButton = document.querySelector('#compose-form button[type="submit"]');
        sendButton.textContent = 'Send Message';
        sendButton.disabled = false;
    }
}

/**
 * Loads all messages received by the current user (inbox)
 * @returns {Promise<Array>} - Array of received messages
 */
async function loadInboxMessages() {
    try {
        // Show loading state
        const inboxContainer = document.getElementById('inbox-messages');
        inboxContainer.innerHTML = '<div class="text-center py-8"><div class="loading-spinner mx-auto"></div><p class="mt-2 text-gray-600">Loading messages...</p></div>';
        
        // Fetch messages from backend
        const response = await window.apiRequest('/api/messages/inbox');
        
        // Clear loading state
        inboxContainer.innerHTML = '';
        
        if (response.success && response.messages) {
            // Display the messages
            displayInboxMessages(response.messages);
            return response.messages;
        } else {
            // No messages or error
            inboxContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                    <p class="text-gray-600">Your inbox is empty. Send a message to get started!</p>
                </div>
            `;
            return [];
        }
        
    } catch (error) {
        console.error('Error loading inbox messages:', error);
        
        // Check if it's an authentication error
        if (error.message.includes('Not authenticated')) {
            console.log('Authentication failed - logging out user');
            window.isAuthenticated = false;
            window.showAlert('Your session has expired. Please log in again.', 'error');
            
            // Clear the inbox and logout
            const inboxContainer = document.getElementById('inbox-messages');
            inboxContainer.innerHTML = '';
            
            // Call logout to clear session and return to login screen
            setTimeout(() => {
                window.logout();
            }, 1500);
            
            throw error;
        }
        
        // Show error state for non-auth errors
        const inboxContainer = document.getElementById('inbox-messages');
        inboxContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Error loading messages</h3>
                <p class="text-gray-600">Failed to load your messages. Please refresh the page.</p>
                <button onclick="window.location.reload()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                    Refresh Page
                </button>
            </div>
        `;
        
        window.showAlert('Failed to load inbox messages.', 'error');
        throw error;
    }
}

/**
 * Loads all messages sent by the current user
 * @returns {Promise<Array>} - Array of sent messages
 */
async function loadSentMessages() {
    try {
        // Show loading state
        const sentContainer = document.getElementById('sent-messages');
        sentContainer.innerHTML = '<div class="text-center py-8"><div class="loading-spinner mx-auto"></div><p class="mt-2 text-gray-600">Loading sent messages...</p></div>';
        
        // Fetch sent messages from backend
        const response = await window.apiRequest('/api/messages/sent');
        
        // Clear loading state
        sentContainer.innerHTML = '';
        
        if (response.success && response.messages) {
            // Display the sent messages
            displaySentMessages(response.messages);
            return response.messages;
        } else {
            // No sent messages
            sentContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📤</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No sent messages</h3>
                    <p class="text-gray-600">You haven't sent any messages yet.</p>
                </div>
            `;
            return [];
        }
        
    } catch (error) {
        console.error('Error loading sent messages:', error);
        
        // Check if it's an authentication error
        if (error.message.includes('Not authenticated')) {
            console.log('Authentication failed - logging out user');
            window.isAuthenticated = false;
            window.showAlert('Your session has expired. Please log in again.', 'error');
            
            // Clear the sent messages and logout
            const sentContainer = document.getElementById('sent-messages');
            sentContainer.innerHTML = '';
            
            // Call logout to clear session and return to login screen
            setTimeout(() => {
                window.logout();
            }, 1500);
            
            throw error;
        }
        
        // Show error state for non-auth errors
        const sentContainer = document.getElementById('sent-messages');
        sentContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Error loading sent messages</h3>
                <p class="text-gray-600">Failed to load your sent messages. Please refresh the page.</p>
                <button onclick="window.location.reload()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                    Refresh Page
                </button>
            </div>
        `;
        
        window.showAlert('Failed to load sent messages.', 'error');
        throw error;
    }
}

/**
 * Loads the list of all users for the compose message dropdown
 * @returns {Promise<Array>} - Array of usernames
 */
async function loadUsers() {
    try {
        // Fetch users from backend
        const response = await window.apiRequest('/users');
        
        if (response.users) {
            // Populate the dropdown
            populateUserDropdown(response.users);
            return response.users;
        } else {
            console.warn('No users found');
            return [];
        }
        
    } catch (error) {
        console.error('Error loading users:', error);
        
        // Check if it's an authentication error
        if (error.message.includes('Not authenticated')) {
            console.log('Authentication failed during user list load - logging out user');
            window.isAuthenticated = false;
            window.showAlert('Your session has expired. Please log in again.', 'error');
            
            // Call logout to clear session and return to login screen
            setTimeout(() => {
                window.logout();
            }, 1500);
            
            throw error;
        }
        
        window.showAlert('Failed to load users list.', 'error');
        throw error;
    }
}

// ===== DISPLAY FUNCTIONS =====

/**
 * Displays inbox messages in the UI
 * @param {Array} messages - Array of message objects
 */
function displayInboxMessages(messages) {
    const inboxContainer = document.getElementById('inbox-messages');
    
    if (!messages || messages.length === 0) {
        inboxContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p class="text-gray-600">Your inbox is empty. Send a message to get started!</p>
            </div>
        `;
        return;
    }
    
    // Create HTML for each message
    const messagesHTML = messages.map(message => createMessageCard(message, 'inbox')).join('');
    inboxContainer.innerHTML = messagesHTML;
}

/**
 * Displays sent messages in the UI
 * @param {Array} messages - Array of message objects
 */
function displaySentMessages(messages) {
    const sentContainer = document.getElementById('sent-messages');
    
    if (!messages || messages.length === 0) {
        sentContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📤</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No sent messages</h3>
                <p class="text-gray-600">You haven't sent any messages yet.</p>
            </div>
        `;
        return;
    }
    
    // Create HTML for each message
    const messagesHTML = messages.map(message => createMessageCard(message, 'sent')).join('');
    sentContainer.innerHTML = messagesHTML;
}

/**
 * Creates HTML for a single message card
 * @param {Object} message - Message object with id, fromUser, toUser, subject, body, createdAt
 * @param {string} type - Either 'inbox' or 'sent'
 * @returns {string} - HTML string for the message card
 */
function createMessageCard(message, type) {
    // Format the timestamp
    const timestamp = formatTimestamp(message.createdAt);
    
    // Determine the sender/receiver based on message type
    const otherUser = type === 'inbox' ? message.fromUser : message.toUser;
    const userLabel = type === 'inbox' ? 'From' : 'To';
    
    // Create a unique ID for this message card
    const messageId = `message-${message.id}`;
    
    return `
        <div id="${messageId}" class="message-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <h3 class="message-subject text-lg font-semibold mb-1">${escapeHtml(message.subject)}</h3>
                    <p class="text-sm text-gray-600">
                        <span class="font-medium">${userLabel}:</span> 
                        <span class="text-blue-600 font-medium">${escapeHtml(otherUser)}</span>
                    </p>
                </div>
                <div class="text-right">
                    <p class="message-timestamp text-xs text-gray-500">${timestamp}</p>
                </div>
            </div>
            
            <div class="message-body text-gray-700 leading-relaxed">
                ${formatMessageBody(message.body)}
            </div>
            
            <div class="mt-3 pt-3 border-t border-gray-100">
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">Message ID: ${message.id}</span>
                    <button onclick="replyToMessage('${messageId}', '${escapeHtml(otherUser)}')" 
                            class="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        Reply
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Populates the user dropdown in the compose form
 * @param {Array} users - Array of usernames
 */
function populateUserDropdown(users) {
    const dropdown = document.getElementById('to-user');
    
    // Clear existing options (except the first "Select a user..." option)
    dropdown.innerHTML = '<option value="">Select a user...</option>';
    
    // Add each user as an option
    users.forEach(username => {
        const option = document.createElement('option');
        option.value = username;
        option.textContent = username;
        dropdown.appendChild(option);
    });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Formats a timestamp for display
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} - Formatted timestamp
 */
function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        
        // Check if it's today
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        if (isToday) {
            // Show time only if it's today
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            // Show date if it's not today
            return date.toLocaleDateString();
        }
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'Unknown time';
    }
}

/**
 * Formats message body for display (handles line breaks)
 * @param {string} body - Raw message body
 * @returns {string} - Formatted HTML
 */
function formatMessageBody(body) {
    if (!body) return '';
    
    // Escape HTML and convert line breaks to <br> tags
    const escaped = escapeHtml(body);
    return escaped.replace(/\n/g, '<br>');
}

/**
 * Escapes HTML characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handles reply to a message
 * @param {string} messageId - The ID of the message card
 * @param {string} recipient - The username to reply to
 */
function replyToMessage(messageId, recipient) {
    // Switch to compose tab
    window.showTab('compose');
    
    // Pre-fill the recipient field
    const toUserField = document.getElementById('to-user');
    if (toUserField) {
        toUserField.value = recipient;
    }
    
    // Focus on the subject field for better UX
    const subjectField = document.getElementById('message-subject');
    if (subjectField) {
        subjectField.focus();
    }
    
    // Show a brief confirmation
    window.showAlert(`Reply to ${recipient}`, 'info');
}

// ===== EVENT LISTENERS =====

/**
 * Sets up event listeners for message-related functionality
 */
function setupMessageEventListeners() {
    // Compose form submission
    const composeForm = document.getElementById('compose-form');
    composeForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent form from submitting normally
        
        // Get form data
        const toUser = document.getElementById('to-user').value.trim();
        const subject = document.getElementById('message-subject').value.trim();
        const body = document.getElementById('message-body').value.trim();
        
        // Validation
        if (!toUser || !subject || !body) {
            window.showAlert('Please fill in all fields.', 'error');
            return;
        }
        
        if (subject.length > 100) {
            window.showAlert('Subject must be 100 characters or less.', 'error');
            return;
        }
        
        if (body.length > 1000) {
            window.showAlert('Message body must be 1000 characters or less.', 'error');
            return;
        }
        
        // Send the message
        try {
            await sendMessage(toUser, subject, body);
        } catch (error) {
            // Error is already handled in sendMessage function
            console.error('Failed to send message:', error);
        }
    });
}

// ===== INITIALIZATION =====

/**
 * Initializes the messages module
 */
function initializeMessages() {
    setupMessageEventListeners();
}

// Make functions available globally
window.sendMessage = sendMessage;
window.loadInboxMessages = loadInboxMessages;
window.loadSentMessages = loadSentMessages;
window.loadUsers = loadUsers;
window.replyToMessage = replyToMessage;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeMessages);