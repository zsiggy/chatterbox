// Main Application Controller for Simple Messaging App
// This file coordinates all the other modules and handles the main app logic

// ===== APPLICATION STATE =====

// Track which tab is currently active
let currentTab = 'inbox';

// Track if the app has been initialized
let appInitialized = false;

// Track authentication state globally
//window.isAuthenticated = false;

// ===== TAB NAVIGATION =====

/**
 * Shows a specific tab and hides all others
 * @param {string} tabName - The name of the tab to show ('inbox', 'sent', 'compose')
 */
function showTab(tabName) {
    // Update the current tab
    currentTab = tabName;
    
    // Get all tab buttons and content sections
    const tabButtons = {
        'inbox': document.getElementById('inbox-tab'),
        'sent': document.getElementById('sent-tab'),
        'compose': document.getElementById('compose-tab')
    };
    
    const tabContents = {
        'inbox': document.getElementById('inbox-content'),
        'sent': document.getElementById('sent-content'),
        'compose': document.getElementById('compose-content')
    };
    
    // Update tab button styles
    Object.keys(tabButtons).forEach(tab => {
        const button = tabButtons[tab];
        const content = tabContents[tab];
        
        if (tab === tabName) {
            // Active tab styling
            button.className = 'flex-1 py-3 px-4 text-center font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50';
            content.classList.remove('hidden');
            content.classList.add('fade-in');
        } else {
            // Inactive tab styling
            button.className = 'flex-1 py-3 px-4 text-center font-medium text-gray-500 hover:text-gray-700';
            content.classList.add('hidden');
        }
    });
    
    // Load content for the active tab
    loadTabContent(tabName);
}

/**
 * Loads the appropriate content for the active tab
 * @param {string} tabName - The name of the tab to load content for
 */
async function loadTabContent(tabName) {
    try {
        switch (tabName) {
            case 'inbox':
                await window.loadInboxMessages();
                break;
                
            case 'sent':
                await window.loadSentMessages();
                break;
                
            case 'compose':
                await loadComposeContent();
                break;
                
            default:
                console.warn(`Unknown tab: ${tabName}`);
        }
    } catch (error) {
        console.error(`Error loading ${tabName} content:`, error);
        window.showAlert(`Failed to load ${tabName} content.`, 'error');
    }
}

/**
 * Loads the compose tab content (user list)
 */
async function loadComposeContent() {
    try {
        // Load the list of users for the dropdown
        await window.loadUsers();
        
        // Focus on the "To" field for better UX
        const toUserField = document.getElementById('to-user');
        if (toUserField) {
            toUserField.focus();
        }
        
    } catch (error) {
        console.error('Error loading compose content:', error);
        window.showAlert('Failed to load user list.', 'error');
    }
}

// ===== APP INITIALIZATION =====

/**
 * Initializes the main application
 * This function is called after a user successfully logs in
 */
async function initializeApp() {
    if (appInitialized) {
        console.log('App already initialized');
        return;
    }
    
    try {
        console.log('Initializing app...');
        
        // Set up tab navigation
        setupTabNavigation();
        
        // Load initial content (inbox by default)
        await loadTabContent('inbox');
        
        // Mark as initialized
        appInitialized = true;
        
        console.log('App initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        window.showAlert('Failed to initialize application.', 'error');
    }
}

/**
 * Resets the app state (called when user logs out)
 */
function resetApp() {
    appInitialized = false;
    currentTab = 'inbox';
    window.isAuthenticated = false; // Clear authentication flag
    
    // Clear any loaded content
    document.getElementById('inbox-messages').innerHTML = '';
    document.getElementById('sent-messages').innerHTML = '';
    document.getElementById('to-user').innerHTML = '<option value="">Select a user...</option>';
    
    // Reset form
    document.getElementById('compose-form').reset();
}

// ===== EVENT LISTENERS =====

/**
 * Sets up tab navigation event listeners
 */
function setupTabNavigation() {
    // Get all tab buttons
    const inboxTab = document.getElementById('inbox-tab');
    const sentTab = document.getElementById('sent-tab');
    const composeTab = document.getElementById('compose-tab');
    
    // Add click event listeners
    inboxTab.addEventListener('click', () => showTab('inbox'));
    sentTab.addEventListener('click', () => showTab('sent'));
    composeTab.addEventListener('click', () => showTab('compose'));
    
    console.log('Tab navigation set up');
}

// ===== KEYBOARD SHORTCUTS =====

/**
 * Sets up keyboard shortcuts for better UX
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only handle shortcuts when user is logged in and not typing in an input
        if (!appInitialized || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Check for Ctrl/Cmd + number shortcuts
        if ((e.ctrlKey || e.metaKey)) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    showTab('inbox');
                    break;
                case '2':
                    e.preventDefault();
                    showTab('sent');
                    break;
                case '3':
                    e.preventDefault();
                    showTab('compose');
                    break;
            }
        }
    });
    
    console.log('Keyboard shortcuts set up');
}

// ===== AUTO-REFRESH FUNCTIONALITY =====

/**
 * Sets up automatic refresh of inbox messages
 * This helps users see new messages without manually refreshing
 */
function setupAutoRefresh() {
    // Refresh inbox every 30 seconds if user is on inbox tab and authenticated
    setInterval(() => {
        //if (appInitialized && currentTab === 'inbox') {
        if (appInitialized && currentTab === 'inbox' && window.isAuthenticated) {
            // Silently refresh inbox (don't show loading spinner)
            window.loadInboxMessages().catch(error => {
                console.error('Auto-refresh failed:', error);
                // If we get 401, set authentication flag to false
                if (error.message.includes('Not authenticated')) {
                    window.isAuthenticated = false;
                }
                // Don't show error to user for auto-refresh failures
            });
        }
    }, 30000); // 30 seconds
    
    console.log('Auto-refresh set up with auth checks');
}

// ===== MESSAGE NOTIFICATIONS =====

/**
 * Shows a notification when new messages arrive
 * @param {number} messageCount - Number of new messages
 */
function showMessageNotification(messageCount) {
    if (messageCount > 0) {
        // Update the inbox tab to show notification
        const inboxTab = document.getElementById('inbox-tab');
        const currentText = inboxTab.textContent.trim();
        
        // Remove existing notification if any
        const cleanText = currentText.replace(/\s*\(\d+\)$/, '');
        
        // Add new notification
        inboxTab.textContent = `${cleanText} (${messageCount})`;
        
        // Show browser notification if supported and permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message', {
                body: `You have ${messageCount} new message${messageCount > 1 ? 's' : ''}`,
                icon: '/favicon.ico' // You could add a favicon later
            });
        }
    }
}

/**
 * Requests notification permission from the user
 */
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            } else {
                console.log('Notification permission denied');
            }
        });
    }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Gets the current active tab
 * @returns {string} - The name of the current tab
 */
function getCurrentTab() {
    return currentTab;
}

/**
 * Refreshes the current tab's content
 */
async function refreshCurrentTab() {
    if (appInitialized) {
        await loadTabContent(currentTab);
    }
}

/**
 * Shows a welcome message for new users
 */
function showWelcomeMessage() {
    // Check if this is the user's first time (you could use localStorage for this)
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    if (!hasSeenWelcome) {
        window.showAlert('Welcome to your Chatterbox! Login or signup to send your first message.', 'info');
        localStorage.setItem('hasSeenWelcome', 'true');
    }
}

// ===== GLOBAL EVENT HANDLERS =====

/**
 * Handles window focus events (when user switches back to the tab)
 * DISABLED: This was causing 401 error loops when session cookies weren't working
 */
function handleWindowFocus() {
    //    if (appInitialized) {
        // Refresh current tab when user returns to the app
       // refreshCurrentTab();
    //}
    // DISABLED: Removed auto-refresh on window focus to prevent 401 error loops
    // The 30-second interval auto-refresh is sufficient for keeping data fresh
    console.log('Window focus detected - auto-refresh disabled to prevent auth loops');
}

/**
 * Handles window blur events (when user switches away from the tab)
 */
function handleWindowBlur() {
    // Could pause auto-refresh or other background activities here
    console.log('App lost focus');
}

// ===== INITIALIZATION =====

/**
 * Sets up the main application when the page loads
 */
function setupApp() {
    console.log('Setting up main application...');
    
    // Set up event listeners
    setupTabNavigation();
    setupKeyboardShortcuts();
    
    // Set up auto-refresh
    setupAutoRefresh();
    
    // Request notification permission
    requestNotificationPermission();
    
    // Set up window event listeners
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    
    // Show welcome message
    showWelcomeMessage();
    
    console.log('Main application setup complete');
}

// ===== EXPORT FUNCTIONS =====

// Make functions available globally
window.initializeApp = initializeApp;
window.resetApp = resetApp;
window.showTab = showTab;
window.getCurrentTab = getCurrentTab;
window.refreshCurrentTab = refreshCurrentTab;
window.showMessageNotification = showMessageNotification;

// Override the logout function to reset app state
const originalLogout = window.logout;
window.logout = async function() {
    await originalLogout();
    resetApp();
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', setupApp);