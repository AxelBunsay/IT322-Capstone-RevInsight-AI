// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Show error message
function showError(message) {
    // Remove existing error if any
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #fee2e2;
        border: 1px solid #fca5a5;
        color: #991b1b;
        padding: 12px 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    errorDiv.innerHTML = `<span>⚠️</span> <span>${message}</span>`;
    loginForm.parentNode.insertBefore(errorDiv, loginForm);
}

// Show success message
function showSuccess(message) {
    const loginForm = document.getElementById('loginForm');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        background: #dcfce7;
        border: 1px solid #86efac;
        color: #166534;
        padding: 12px 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    successDiv.innerHTML = `<span>✓</span> <span>${message}</span>`;
    loginForm.parentNode.insertBefore(successDiv, loginForm);
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
        const apiBase = 'http://localhost:5000';
        const response = await fetch(`${apiBase}/api/mechanics/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const text = await response.text();
        let data = {};
        try {
            data = text ? JSON.parse(text) : {};
        } catch (parseError) {
            throw new Error(`Login response is not valid JSON: ${text}`);
        }

        if (response.ok && data.token) {
            // Store token and mechanic data
            localStorage.setItem('mechanicToken', data.token);
            localStorage.setItem('mechanic', JSON.stringify(data.mechanic));

            showSuccess('Login successful! Redirecting...');

            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'mechanicDashboard.html';
            }, 1500);
        } else {
            showError(data.message || `Login failed. (${response.status})`);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'An error occurred. Please check your connection and try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
