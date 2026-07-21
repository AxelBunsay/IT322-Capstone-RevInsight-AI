const apiBase = 'http://localhost:5000/api/users';

const signInForm = document.getElementById('signInForm');
const registerForm = document.getElementById('registerForm');
const otpForm = document.getElementById('otpForm');
const otpSection = document.getElementById('otpVerificationSection');
const signInMessage = document.getElementById('signInMessage');
const registerMessage = document.getElementById('registerMessage');
const otpMessage = document.getElementById('otpMessage');

const showMessage = (element, text, isError = true) => {
  if (!element) return;
  element.style.display = 'block';
  element.style.color = isError ? '#b71c1c' : '#166534';
  element.textContent = text;
};

const clearMessage = (element) => {
  if (!element) return;
  element.style.display = 'none';
  element.textContent = '';
};

const splitFullName = (fullname) => {
  const parts = fullname.trim().split(' ').filter(Boolean);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ') || '';
  return { firstName, lastName };
};

if (signInForm) {
  signInForm.id = 'signInForm';
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage(signInMessage);

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showMessage(signInMessage, 'Email and password are required.');
      return;
    }

    try {
      const backendBase = 'http://localhost:5000';
      const response = await fetch(`${backendBase}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (e) {
        throw new Error(`Login response is not valid JSON: ${text}`);
      }

      if (!response.ok) {
        showMessage(signInMessage, data.message || `Login failed. (${response.status})`);
        return;
      }

      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customer', JSON.stringify(data.user));
      showMessage(signInMessage, 'Login successful. Redirecting...', false);
      setTimeout(() => {
        window.location.href = 'userShop.html';
      }, 1000);
    } catch (error) {
      showMessage(signInMessage, error.message || 'Unable to login. Please try again.');
      console.error('Customer login error:', error);
    }
  });
}

if (registerForm) {
  registerForm.id = 'registerForm';
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage(registerMessage);

    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!fullname || !email || !password || !confirmPassword) {
      showMessage(registerMessage, 'All fields are required.');
      return;
    }

    if (password.length < 6) {
      showMessage(registerMessage, 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      showMessage(registerMessage, 'Passwords do not match.');
      return;
    }

    const { firstName, lastName } = splitFullName(fullname);
    if (!firstName || !lastName) {
      showMessage(registerMessage, 'Please enter both first and last name.');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/register-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phoneNumber: phone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(registerMessage, data.message || 'Registration failed.');
        return;
      }

      showMessage(registerMessage, 'OTP sent to your email. Please verify below.', false);
      if (otpSection) {
        otpSection.style.display = 'block';
      }
      document.getElementById('otp-email').value = email;
    } catch (error) {
      showMessage(registerMessage, 'Unable to register. Please try again.');
      console.error('Customer registration error:', error);
    }
  });
}

if (otpForm) {
  otpForm.id = 'otpForm';
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessage(otpMessage);

    const email = document.getElementById('otp-email').value.trim();
    const otp = document.getElementById('otp-code').value.trim();

    if (!email || !otp) {
      showMessage(otpMessage, 'Email and OTP are required.');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage(otpMessage, data.message || 'OTP verification failed.');
        return;
      }

      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customer', JSON.stringify(data.user));
      showMessage(otpMessage, 'Account verified. Redirecting to shop...', false);
      setTimeout(() => {
        window.location.href = 'userShop.html';
      }, 1000);
    } catch (error) {
      showMessage(otpMessage, 'Unable to verify OTP. Please try again.');
      console.error('OTP verification error:', error);
    }
  });
}
