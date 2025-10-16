// Authentication Module for Simple Messaging App
// This file handles all user authentication: login, signup, logout, and session management

// ===== CONFIGURATION =====

// Base URL for our backend API
// This tells JavaScript where to send requests
const API_BASE_URL = 'http://localhost:3002';

// ===== UTILITY FUNCTIONS =====

/**
 * Shows an alert message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of alert ('success', 'error', 'warning', 'info')
 */
function showAlert(message, type = 'info') {
    // Get the alert container from HTML
    const alertContainer = document.getElementById('alert-container');
    
    // Create a new alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mb-4`;
    
    // Add the message and a close button
    alertDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg font-bold hover:text-gray-600">
                ×
            </button>
        </div>
    `;
    
    // Add the alert to the page
    alertContainer.appendChild(alertDiv);
    
    // Automatically remove the alert after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

/**
 * Makes an HTTP request to the backend
 * @param {string} url - The endpoint to call
 * @param {Object} options - Request options (method, body, etc.)
 * @returns {Promise} - The response from the server
 */
async function apiRequest(url, options = {}) {
    // Default options for all requests
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // This is CRUCIAL for session cookies
    };
    
    // Merge default options with provided options
    const requestOptions = { ...defaultOptions, ...options };
    
    try {
        // Make the request
        const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);
        
        // Parse the JSON response
        const data = await response.json();
        
        // If the response is not ok (status 200-299), throw an error
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        // Handle network errors or parsing errors
        console.error('API request failed:', error);
        throw error;
    }
}

/**
 * Updates the UI to show the user is logged in
 * @param {string} username - The username of the logged-in user
 */
function showLoggedInState(username) {
    // Show the user info in the navigation
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    
    usernameDisplay.textContent = `Welcome, ${username}!`;
    userInfo.classList.remove('hidden');
    
    // Hide the login/signup forms
    const authSection = document.getElementById('auth-section');
    authSection.classList.add('hidden');
    
    // Show the main app interface
    const appSection = document.getElementById('app-section');
    appSection.classList.remove('hidden');
    
    // Add animation
    appSection.classList.add('fade-in');
}

/**
 * Updates the UI to show the user is logged out
 */
function showLoggedOutState() {
    // Hide the user info in the navigation
    const userInfo = document.getElementById('user-info');
    userInfo.classList.add('hidden');
    
    // Show the login/signup forms
    const authSection = document.getElementById('auth-section');
    authSection.classList.remove('hidden');
    
    // Hide the main app interface
    const appSection = document.getElementById('app-section');
    appSection.classList.add('hidden');
    
    // Reset forms
    resetAuthForms();
}

/**
 * Resets all authentication forms to their initial state
 */
function resetAuthForms() {
    // Clear all form inputs
    document.getElementById('login-form-element').reset();
    document.getElementById('signup-form-element').reset();
    
    // Show login form by default
    showLoginForm();
}

/**
 * Shows the login form and hides the signup form
 */
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    
    // Add animation
    loginForm.classList.add('slide-in');
}

/**
 * Shows the signup form and hides the login form
 */
function showSignupForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    
    // Add animation
    signupForm.classList.add('slide-in');
}

// ===== AUTHENTICATION FUNCTIONS =====

/**
 * Handles user login
 * @param {string} username - The username to login with
 * @param {string} password - The password to login with
 */
async function login(username, password) {
    try {
        // Show loading state (optional - you could add a spinner here)
        
        // Send login request to backend
        const response = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        
        // If we get here, login was successful
        showAlert('Login successful!', 'success');
        showLoggedInState(username);
        
        // Trigger app initialization (this will be called from app.js)
        if (window.initializeApp) {
            window.initializeApp();
        }
        
    } catch (error) {
        // Handle login errors
        console.error('Login failed:', error);
        showAlert(error.message || 'Login failed. Please try again.', 'error');
    }
}

/**
 * Handles user signup
 * @param {string} username - The username to register with
 * @param {string} password - The password to register with
 */
async function signup(username, password) {
    try {
        // Show loading state (optional)
        
        // Send signup request to backend
        const response = await apiRequest('/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        
        // If we get here, signup was successful
        showAlert('Account created successfully! You are now logged in.', 'success');
        showLoggedInState(username);
        
        // Trigger app initialization
        if (window.initializeApp) {
            window.initializeApp();
        }
        
    } catch (error) {
        // Handle signup errors
        console.error('Signup failed:', error);
        showAlert(error.message || 'Signup failed. Please try again.', 'error');
    }
}

/**
 * Handles user logout
 */
async function logout() {
    try {
        // Send logout request to backend
        await apiRequest('/logout', {
            method: 'POST',
        });
        
        // Show success message
        showAlert('You have been logged out.', 'info');
        
        // Update UI to logged out state
        showLoggedOutState();
        
    } catch (error) {
        // Even if logout fails on server, we should still log out locally
        console.error('Logout error:', error);
        showAlert('Logged out locally.', 'warning');
        showLoggedOutState();
    }
}

/**
 * Checks if the user is currently logged in
 * This is called when the page loads to restore the user's session
 */
async function checkAuthStatus() {
    try {
        // Ask the backend if we're logged in
        const response = await apiRequest('/me');
        
        if (response.authenticated && response.user) {
            // User is logged in, show the logged in state
            showLoggedInState(response.user.username);
            return true;
        } else {
            // User is not logged in
            showLoggedOutState();
            return false;
        }
        
    } catch (error) {
        // If we can't check auth status, assume not logged in
        console.error('Auth check failed:', error);
        showLoggedOutState();
        return false;
    }
}

// ===== EVENT LISTENERS =====

/**
 * Sets up all the event listeners for authentication
 * This function is called when the page loads
 */
function setupAuthEventListeners() {
    // Login form submission
    const loginForm = document.getElementById('login-form-element');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the form from submitting normally
        
        // Get the form data
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        // Basic validation
        if (!username || !password) {
            showAlert('Please fill in all fields.', 'error');
            return;
        }
        
        // Call the login function
        await login(username, password);
    });
    
    // Signup form submission
    const signupForm = document.getElementById('signup-form-element');
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the form from submitting normally
        
        // Get the form data
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;
        
        // Basic validation
        if (!username || !password) {
            showAlert('Please fill in all fields.', 'error');
            return;
        }
        
        if (username.length < 3) {
            showAlert('Username must be at least 3 characters long.', 'error');
            return;
        }
        
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long.', 'error');
            return;
        }
        
        // Call the signup function
        await signup(username, password);
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', async () => {
        await logout();
    });
    
    // Toggle between login and signup forms
    const showSignupBtn = document.getElementById('show-signup');
    const showLoginBtn = document.getElementById('show-login');
    
    showSignupBtn.addEventListener('click', showSignupForm);
    showLoginBtn.addEventListener('click', showLoginForm);
}

// ===== INITIALIZATION =====

/**
 * Initializes the authentication system
 * This is called when the page loads
 */
async function initializeAuth() {
    // Set up event listeners
    setupAuthEventListeners();
    
    // Check if user is already logged in
    await checkAuthStatus();
}

// Make functions available globally (so other files can use them)
window.login = login;
window.logout = logout;
window.checkAuthStatus = checkAuthStatus;
window.showAlert = showAlert;
window.apiRequest = apiRequest;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeAuth);