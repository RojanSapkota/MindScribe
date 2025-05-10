// MindScribe Login and Signup functionality

document.addEventListener('DOMContentLoaded', () => {
  // Form elements
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');
  const otpForm = document.getElementById('otp-form');
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  
  // Navigation links
  const signupLink = document.getElementById('signup-link');
  const signinLink = document.getElementById('signin-link');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const backToLoginLink = document.getElementById('back-to-login');
  const resendOtpLink = document.getElementById('resend-otp');
  
  // Message elements
  const signinMessage = document.getElementById('signin-message');
  const signupMessage = document.getElementById('signup-message');
  const otpMessage = document.getElementById('otp-message');
  const forgotMessage = document.getElementById('forgot-message');
  
  // Password toggle elements
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  
  // OTP inputs
  const otpInputs = document.querySelectorAll('.otp-input');
  
  // API URL
  const API_BASE_URL = 'http://localhost:8000';
  
  // Store email for OTP verification
  let currentEmail = '';
  
  // Form navigation
  signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(signupForm);
  });
  
  signinLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(signinForm);
  });
  
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(forgotPasswordForm);
  });
  
  backToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(signinForm);
  });
  
  // Function to show a specific form
  function showForm(form) {
    // Hide all forms first
    signinForm.classList.remove('active');
    signupForm.classList.remove('active');
    otpForm.classList.remove('active');
    forgotPasswordForm.classList.remove('active');
    
    // Clear all messages
    clearMessages();
    
    // Show the selected form
    form.classList.add('active');
  }
  
  // Toggle password visibility
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      btn.classList.toggle('fa-eye');
      btn.classList.toggle('fa-eye-slash');
    });
  });
  
  // OTP input handling
  otpInputs.forEach((input, index) => {
    // Auto-focus next input
    input.addEventListener('keyup', (e) => {
      if (e.key !== 'Backspace' && index < otpInputs.length - 1 && input.value.length === 1) {
        otpInputs[index + 1].focus();
      }
      
      // When Backspace is pressed, go to previous input
      if (e.key === 'Backspace' && index > 0 && input.value.length === 0) {
        otpInputs[index - 1].focus();
      }
    });
    
    // Allow only digits
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '');
    });
  });
  
  // Form submission handlers
  signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    
    // Validate inputs
    if (!validateEmail(email)) {
      showMessage(signinMessage, 'Please enter a valid email address', 'error');
      return;
    }
    
    // Show loading state
    const submitBtn = signinForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      
      const data = await response.json();
        if (response.ok) {
        showMessage(signinMessage, 'Login successful! Redirecting...', 'success');
        
        // Save user info and token to localStorage
        if (document.getElementById('remember').checked) {
          localStorage.setItem('mindscribe_email', email);
        } else {
          localStorage.removeItem('mindscribe_email');
        }
        
        // Save authentication token (we'll use email as token for now, but in a real app should use JWT)
        localStorage.setItem('mindscribe_token', data.token || email);
        
        // Redirect to main app
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        showMessage(signinMessage, data.detail || 'Invalid credentials', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage(signinMessage, 'Server error. Please try again later.', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
  
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const termsChecked = document.getElementById('terms').checked;
    
    // Validate inputs
    if (name.trim().length < 2) {
      showMessage(signupMessage, 'Please enter your full name', 'error');
      return;
    }
    
    if (!validateEmail(email)) {
      showMessage(signupMessage, 'Please enter a valid email address', 'error');
      return;
    }
    
    if (password.length < 8) {
      showMessage(signupMessage, 'Password must be at least 8 characters long', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showMessage(signupMessage, 'Passwords do not match', 'error');
      return;
    }
    
    if (!termsChecked) {
      showMessage(signupMessage, 'Please agree to the Terms & Conditions', 'error');
      return;
    }
    
    // Show loading state
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/register-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store the email for OTP verification
        currentEmail = email;
        
        // Show OTP form
        showForm(otpForm);
        showMessage(otpMessage, 'A verification code has been sent to your email', 'success');
        
        // Clear OTP inputs
        otpInputs.forEach(input => {
          input.value = '';
        });
        
        // Focus the first OTP input
        otpInputs[0].focus();
      } else {
        showMessage(signupMessage, data.detail || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showMessage(signupMessage, 'Server error. Please try again later.', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
  
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect OTP
    let otp = '';
    otpInputs.forEach(input => {
      otp += input.value;
    });
    
    // Validate OTP
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      showMessage(otpMessage, 'Please enter a valid 6-digit OTP', 'error');
      return;
    }
    
    // Show loading state
    const submitBtn = otpForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: currentEmail,
          otp: otp
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(otpMessage, 'Account created successfully! Redirecting...', 'success');
        
        // Redirect to main app
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1500);
      } else {
        showMessage(otpMessage, data.detail || 'Invalid OTP', 'error');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showMessage(otpMessage, 'Server error. Please try again later.', 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
  
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    
    // Validate email
    if (!validateEmail(email)) {
      showMessage(forgotMessage, 'Please enter a valid email address', 'error');
      return;
    }
    
    // Show loading state
    const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);
    
    // Since the backend doesn't have a forgot password endpoint yet,
    // we'll just simulate the API call
    setTimeout(() => {
      showMessage(forgotMessage, 'Password reset instructions sent to your email!', 'success');
      setButtonLoading(submitBtn, false);
    }, 1500);
  });
  
  resendOtpLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!currentEmail) {
      showMessage(otpMessage, 'Please go back and try signing up again', 'error');
      return;
    }
    
    // Disable the resend link temporarily
    resendOtpLink.style.pointerEvents = 'none';
    resendOtpLink.style.opacity = '0.6';
    
    try {
      const response = await fetch(`${API_BASE_URL}/register-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: currentEmail,
          resend: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showMessage(otpMessage, 'A new verification code has been sent to your email', 'success');
      } else {
        showMessage(otpMessage, data.detail || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showMessage(otpMessage, 'Server error. Please try again later.', 'error');
    } finally {
      // Re-enable the resend link after 60 seconds
      setTimeout(() => {
        resendOtpLink.style.pointerEvents = 'auto';
        resendOtpLink.style.opacity = '1';
      }, 60000);
    }
  });
  
  // Helper functions
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `form-message ${type}`;
  }
  
  function clearMessages() {
    signinMessage.className = 'form-message';
    signinMessage.textContent = '';
    signupMessage.className = 'form-message';
    signupMessage.textContent = '';
    otpMessage.className = 'form-message';
    otpMessage.textContent = '';
    forgotMessage.className = 'form-message';
    forgotMessage.textContent = '';
  }
  
  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      const originalText = button.textContent;
      button.setAttribute('data-original-text', originalText);
      button.innerHTML = '<div class="spinner"></div><span>Please wait...</span>';
      button.classList.add('loading');
      button.disabled = true;
    } else {
      const originalText = button.getAttribute('data-original-text');
      button.innerHTML = originalText;
      button.classList.remove('loading');
      button.disabled = false;
    }
  }
  
  // Check if user email is saved (for "Remember me" functionality)
  const savedEmail = localStorage.getItem('mindscribe_email');
  if (savedEmail) {
    document.getElementById('signin-email').value = savedEmail;
    document.getElementById('remember').checked = true;
  }
});
