// Authentication Module for Simple Messaging App

// FIXED: Use environment variable or production URL
const API_BASE_URL = 'https://your-chatterbox-api-c610f4eea4e1.herokuapp.com';
//const API_BASE_URL = 'http://localhost:3002';

// UTILITY FUNCTIONS

function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} mb-4`;
  
  alertDiv.innerHTML = `
    <div class="flex justify-between items-center">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg font-bold hover:text-gray-600">
        ×
      </button>
    </div>
  `;
  
  alertContainer.appendChild(alertDiv);
  
  setTimeout(() => {
    if (alertDiv.parentElement) {
      alertDiv.remove();
    }
  }, 5000);
}

// FIXED: API request with proper error handling
async function apiRequest(url, options = {}) {
  console.log('Making API request to:', `${API_BASE_URL}${url}`);
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL for cookies
  };
  
  const requestOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, requestOptions);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    // Try to parse JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      throw new Error('Invalid response from server');
    }
    
    console.log('Response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Provide more helpful error messages
    if (error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    
    throw error;
  }
}

function showLoggedInState(username) {
  console.log('Showing logged in state for:', username);
  
  const userInfo = document.getElementById('user-info');
  const usernameDisplay = document.getElementById('username-display');
  
  usernameDisplay.textContent = `Welcome, ${username}!`;
  userInfo.classList.remove('hidden');
  
  const authSection = document.getElementById('auth-section');
  authSection.classList.add('hidden');
  
  const appSection = document.getElementById('app-section');
  appSection.classList.remove('hidden');
  appSection.classList.add('fade-in');
}

function showLoggedOutState() {
  console.log('Showing logged out state');
  
  const userInfo = document.getElementById('user-info');
  userInfo.classList.add('hidden');
  
  const authSection = document.getElementById('auth-section');
  authSection.classList.remove('hidden');
  
  const appSection = document.getElementById('app-section');
  appSection.classList.add('hidden');
  
  resetAuthForms();
}

function resetAuthForms() {
  document.getElementById('login-form-element').reset();
  document.getElementById('signup-form-element').reset();
  showLoginForm();
}

function showLoginForm() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
  loginForm.classList.add('slide-in');
}

function showSignupForm() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  
  loginForm.classList.add('hidden');
  signupForm.classList.remove('hidden');
  signupForm.classList.add('slide-in');
}

// AUTHENTICATION FUNCTIONS

async function login(username, password) {
  console.log('Attempting login for:', username);
  
  try {
    const response = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    console.log('Login response:', response);
    
    // Check if response indicates success
    if (response.authenticated || response.user) {
      showAlert('Login successful!', 'success');
      showLoggedInState(username);
      
      // Set global authentication flag
      window.isAuthenticated = true;
      
      // Verify session is working before initializing app
      await verifySessionAndInitialize();
      
      return true;
    } else {
      throw new Error('Login failed: Invalid response from server');
    }
    
  } catch (error) {
    console.error('Login failed:', error);
    
    if (error.message.includes('Invalid credentials')) {
      showAlert('Invalid username or password. Please try again.', 'error');
    } else if (error.message.includes('connect')) {
      showAlert('Unable to connect to server. Please check your internet connection.', 'error');
    } else {
      showAlert(error.message || 'Login failed. Please try again.', 'error');
    }
    
    return false;
  }
}

async function signup(username, password) {
  console.log('Attempting signup for:', username);
  
  try {
    const response = await apiRequest('/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    console.log('Signup response:', response);
    
    // Check if response indicates success
    if (response.user || response.authenticated) {
      showAlert('Account created successfully! You are now logged in.', 'success');
      showLoggedInState(username);
      
      // Set global authentication flag
      window.isAuthenticated = true;
      
      // Verify session is working before initializing app
      await verifySessionAndInitialize();
      
      return true;
    } else {
      throw new Error('Signup failed: Invalid response from server');
    }
    
  } catch (error) {
    console.error('Signup failed:', error);
    
    if (error.message.includes('already taken')) {
      showAlert('This username is already taken. Please choose a different username.', 'error');
    } else if (error.message.includes('3 characters')) {
      showAlert('Username must be at least 3 characters long.', 'error');
    } else if (error.message.includes('6 characters')) {
      showAlert('Password must be at least 6 characters long.', 'error');
    } else if (error.message.includes('connect')) {
      showAlert('Unable to connect to server. Please check your internet connection.', 'error');
    } else {
      showAlert(error.message || 'Signup failed. Please try again.', 'error');
    }
    
    return false;
  }
}

async function logout() {
  console.log('Attempting logout');
  
  // Clear global authentication flag
  window.isAuthenticated = false;
  
  try {
    await apiRequest('/logout', {
      method: 'POST',
    });
    
    showAlert('You have been logged out.', 'info');
    showLoggedOutState();
    
  } catch (error) {
    console.error('Logout error:', error);
    showAlert('Logged out locally.', 'warning');
    showLoggedOutState();
  }
}

// FIXED: Better auth status check with retry
async function checkAuthStatus() {
  console.log('Checking auth status...');
  console.log('API_BASE_URL:', API_BASE_URL);
  
  try {
    const response = await apiRequest('/me');
    console.log('Auth status response:', response);
    
    if (response.authenticated && response.user && response.user.username) {
      console.log('User is authenticated:', response.user.username);
      showLoggedInState(response.user.username);
      
      // Set global authentication flag
      window.isAuthenticated = true;
      
      // Initialize app after confirming auth
      setTimeout(() => {
        if (window.initializeApp) {
          window.initializeApp();
        }
      }, 100);
      
      return true;
    } else {
      console.log('User is not authenticated');
      window.isAuthenticated = false;
      showLoggedOutState();
      return false;
    }
    
  } catch (error) {
    console.error('Auth check failed:', error);
    window.isAuthenticated = false;
    showLoggedOutState();
    return false;
  }
}

// EVENT LISTENERS

function setupAuthEventListeners() {
  console.log('Setting up auth event listeners');
  
  // Login form
  const loginForm = document.getElementById('login-form-element');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!username || !password) {
      showAlert('Please fill in all fields.', 'error');
      return;
    }
    
    await login(username, password);
  });
  
  // Signup form
  const signupForm = document.getElementById('signup-form-element');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    
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
    
    await signup(username, password);
  });
  
  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', logout);
  
  // Toggle forms
  const showSignupBtn = document.getElementById('show-signup');
  const showLoginBtn = document.getElementById('show-login');
  
  showSignupBtn.addEventListener('click', showSignupForm);
  showLoginBtn.addEventListener('click', showLoginForm);
}

// INITIALIZATION

async function initializeAuth() {
  console.log('Initializing authentication system...');
  
  setupAuthEventListeners();
  console.log('Auth event listeners set up');
  
  // Check auth status on page load
  await checkAuthStatus();
  console.log('Auth initialization complete');
}

// Session verification function
async function verifySessionAndInitialize() {
  try {
    console.log('Verifying session before app initialization...');
    
    // Test the session by calling /me endpoint
    const response = await apiRequest('/me');
    
    if (response.authenticated && response.user) {
      console.log('Session verified successfully');
      
      // Initialize app after confirming session works
      setTimeout(() => {
        if (window.initializeApp) {
          window.initializeApp();
        }
      }, 100);
      
      return true;
    } else {
      throw new Error('Session verification failed');
    }
    
  } catch (error) {
    console.error('Session verification failed:', error);
    window.isAuthenticated = false;
    
    showAlert('Session verification failed. Please log in again.', 'error');
    
    // Return to login state
    setTimeout(() => {
      showLoggedOutState();
    }, 1500);
    
    return false;
  }
}

// Export functions globally
window.login = login;
window.logout = logout;
window.checkAuthStatus = checkAuthStatus;
window.verifySessionAndInitialize = verifySessionAndInitialize;
window.showAlert = showAlert;
window.apiRequest = apiRequest;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeAuth);