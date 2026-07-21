// Admin Login JavaScript
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.querySelector('input[name="remember"]').checked;

        // Validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Disable button during submission
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        // Call backend API via explicit backend origin so Live Server or other hosts still work
        const apiBase = 'http://localhost:5000';
        fetch(`${apiBase}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        })
        .then(async res => {
            const text = await res.text();
            let body = {};
            try {
                body = text ? JSON.parse(text) : {};
            } catch (parseError) {
                throw new Error(`Login response is not valid JSON: ${text}`);
            }

            if (!res.ok) throw new Error(body.message || `Login failed (${res.status})`);

            // Save admin token and email
            if (rememberMe) {
                localStorage.setItem('rememberEmail', email);
            } else {
                localStorage.removeItem('rememberEmail');
            }

            localStorage.setItem('adminToken', body.token);
            localStorage.setItem('adminEmail', body.admin?.username || email);

            showSuccess('Login successful! Redirecting...');
            setTimeout(() => { window.location.href = 'adminDashboard.html'; }, 800);
        })
        .catch(err => {
            showError(err.message || 'Invalid email or password');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
    });

    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.querySelector('input[name="remember"]').checked = true;
    }

    // Forgot password
    document.querySelector('.forgot-password').addEventListener('click', function (e) {
        e.preventDefault();
        alert('Password reset link would be sent to your email');
    });
});

// Admin username can be a simple string, not necessarily an email address.
function isValidEmail(email) {
    return true;
}

function showError(message) {
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        document.querySelector('form').insertBefore(errorDiv, document.querySelector('form').firstChild);
    }
    errorDiv.textContent = message;
    errorDiv.classList.add('show');

    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

function showSuccess(message) {
    let successDiv = document.querySelector('.success-message');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        document.querySelector('form').insertBefore(successDiv, document.querySelector('form').firstChild);
    }
    successDiv.textContent = message;
    successDiv.classList.add('show');
}
