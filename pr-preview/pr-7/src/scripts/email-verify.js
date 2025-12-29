const PROXY_URL = 'https://script.google.com/macros/s/AKfycbyNO5Xfv4tnlAGBZdpoPoKgkQY08xVZflcordP7e-t7cnleKFxOHUpSNCPAwxLnyHhf3Q/exec';

async function loadAllowedUsers() {
  const response = await fetch(PROXY_URL);
  if (!response.ok) throw new Error('Failed to load users');
  return await response.json(); // [{name, email}, ...]
}

// Function to verify if an email is in the allowed list and return user data
async function verifyEmail(email) {
  try {
    const allowedUsers = await loadAllowedUsers();
    const userData = allowedUsers.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    return userData || null; // Return user data if found, null otherwise
  } catch (error) {
    console.error('Email verification failed:', error);
    throw error;
  }
}

// Function to check if user is logged in
function isUserLoggedIn() {
  return sessionStorage.getItem('userEmail') !== null;
}

// Function to get logged in user email
function getLoggedInEmail() {
  return sessionStorage.getItem('userEmail');
}

// Function to get logged in user name
function getLoggedInName() {
  return sessionStorage.getItem('userName');
}

// Function to logout user
function logoutUser() {
  sessionStorage.removeItem('userEmail');
  sessionStorage.removeItem('userName');
  window.location.href = '/pr-preview/pr-7/src/pages/blog-input/_email-input/index.html';
}