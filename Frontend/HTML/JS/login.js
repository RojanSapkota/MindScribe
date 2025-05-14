document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const passwordInput = document.getElementById('signupPassword');
  const strengthProgress = document.getElementById('strengthProgress');
  const strengthText = document.getElementById('strengthText');
  const themeSwitch = document.getElementById('themeSwitch');
  const progressBar = document.getElementById('progressBar');
  const tooltip = document.getElementById('tooltip');
  const loginTab = document.getElementById('login-tab');
  const signupTab = document.getElementById('signup-tab');
  const api_server = 'https://hackclubapi.rojansapkota.com.np';
  
  let darkMode = localStorage.getItem('darkMode') === 'true';
  
  // Initialize dark mode from localStorage
  if (darkMode) {
    document.body.classList.add('dark-theme');
    themeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
  }
  
  // Theme switch
  themeSwitch.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-theme', darkMode);
    themeSwitch.innerHTML = darkMode ? 
      '<i class="fas fa-sun"></i>' : 
      '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', darkMode);
  });
  
  // Tab switching functionality
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      
      // Update active tab button
      tabBtns.forEach(tabBtn => {
        tabBtn.classList.remove('active');
      });
      btn.classList.add('active');
      
      // Show the relevant tab content
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      document.getElementById(`${tabName}-tab`).style.display = 'block';
      
      // Animate progress bar
      animateProgressBar(500);
    });
  });
  
  // Toggle password visibility
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      const icon = this.querySelector('i');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
  
  // Password strength meter
  if (passwordInput) {
    passwordInput.addEventListener('input', checkPasswordStrength);
  }
  
  function checkPasswordStrength() {
    const password = passwordInput.value;
    let strength = 0;
    
    // Check length
    if (password.length >= 8) strength += 25;
    
    // Check for lowercase letters
    if (/[a-z]/.test(password)) strength += 25;
    
    // Check for uppercase letters
    if (/[A-Z]/.test(password)) strength += 25;
    
    // Check for numbers or special characters
    if (/[0-9!@#$%^&*()]/.test(password)) strength += 25;
    
    // Update UI
    strengthProgress.style.width = `${strength}%`;
    
    // Set color based on strength
    if (strength <= 25) {
      strengthProgress.style.backgroundColor = '#F56565';
      strengthText.textContent = 'Weak';
      strengthText.style.color = '#F56565';
    } else if (strength <= 50) {
      strengthProgress.style.backgroundColor = '#F6AD55';
      strengthText.textContent = 'Fair';
      strengthText.style.color = '#F6AD55';
    } else if (strength <= 75) {
      strengthProgress.style.backgroundColor = '#68D391';
      strengthText.textContent = 'Good';
      strengthText.style.color = '#68D391';
    } else {
      strengthProgress.style.backgroundColor = '#48BB78';
      strengthText.textContent = 'Strong';
      strengthText.style.color = '#48BB78';
    }
  }
  
  // Progress bar animation
  function animateProgressBar(duration = 3000) {
    progressBar.style.width = '0%';
    let start = null;
    
    function step(timestamp) {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration * 100, 100);
      progressBar.style.width = `${progress}%`;
      
      if (progress < 100) {
        window.requestAnimationFrame(step);
      }
    }
    
    window.requestAnimationFrame(step);
  }
  
  // Show tooltip
  function showTooltip(element, text) {
    const rect = element.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
    tooltip.style.opacity = '1';
    
    setTimeout(() => {
      tooltip.style.opacity = '0';
    }, 2000);
  }
  
  // Handle form submissions with animations
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const loginBtn = this.querySelector('.login-btn');
      
      // Add loading class for button animation
      loginBtn.classList.add('loading');
      
      // Animation while "logging in"
      animateProgressBar(1500);
      
      // Make the API call to the FastAPI login endpoint
      fetch(`${api_server}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })
      .then(response => response.json())
      .then(data => {
        // Remove loading class
        loginBtn.classList.remove('loading');
        
        if (data.message === 'Login successful') {
          
          // Add success animation
          loginBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
          loginBtn.style.backgroundColor = 'var(--success)';
          
          setTimeout(() => {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', email);

            // Redirect to mobile page after login
            window.location.href = 'mobile.html';
          }, 1000);
        } else {
          // Handle the case where login is not successful
          loginBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
          loginBtn.style.backgroundColor = 'var(--danger)';
          
          setTimeout(() => {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            loginBtn.style.backgroundColor = 'var(--primary)';
            alert('Invalid email or password');
          }, 1000);
        }
      })
      .catch(error => {
        // Remove loading class
        loginBtn.classList.remove('loading');
        loginBtn.innerHTML = '<i class="fas fa-times"></i> Error';
        loginBtn.style.backgroundColor = 'var(--danger)';
        
        setTimeout(() => {
          loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
          loginBtn.style.backgroundColor = 'var(--primary)';
        }, 1000);
        
        console.error('Error during login:', error);
        alert('There was an error with the login process.');
      });
    });
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value.trim();
      const agreeTerms = document.getElementById('agreeTerms').checked;
      const signupBtn = this.querySelector('.login-btn');
      
      // Add loading class for button animation
      signupBtn.classList.add('loading');
  
      // Animation while "signing up"
      animateProgressBar(1500);
  
      // Simple form validation
      if (!name || !email || !password) {
        signupBtn.classList.remove('loading');
        alert('Please fill in all fields.');
        return;
      }
      
      if (!agreeTerms) {
        signupBtn.classList.remove('loading');
        alert('You must agree to the Terms and Privacy Policy');
        return;
      }
  
      try {
        // Making API call to FastAPI backend - Step 1: Request OTP
        const response = await fetch(`${api_server}/register-init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            name, 
            email, 
            password
          })
        });
  
        const data = await response.json();
        
        // Remove loading class
        signupBtn.classList.remove('loading');
  
        if (response.ok) {
          // Add success animation
          signupBtn.innerHTML = '<i class="fas fa-check"></i> Code Sent!';
          signupBtn.style.backgroundColor = 'var(--success)';
          
          setTimeout(() => {
            // Show OTP verification screen
            showOtpVerificationScreen(email);
            
            // Reset button style after transition
            signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            signupBtn.style.backgroundColor = 'var(--primary)';
            
            // If test OTP included in response, show it in development
            if (data.otp) {
              // Optionally show the OTP on screen for testing
              document.getElementById('testOtp').textContent = `Test OTP: ${data.otp}`;
              document.getElementById('testOtp').style.display = 'block';
            }
          }, 1000);
        } else {
          // Show error message
          signupBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
          signupBtn.style.backgroundColor = 'var(--danger)';
          
          setTimeout(() => {
            signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            signupBtn.style.backgroundColor = 'var(--primary)';
            alert(data.detail || 'Signup failed. Please try again.');
          }, 1000);
        }
  
      } catch (error) {
        // Remove loading class
        signupBtn.classList.remove('loading');
        signupBtn.innerHTML = '<i class="fas fa-times"></i> Error';
        signupBtn.style.backgroundColor = 'var(--danger)';
        
        setTimeout(() => {
          signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
          signupBtn.style.backgroundColor = 'var(--primary)';
        }, 1000);
        
        console.error('Error during signup:', error);
        alert('An error occurred. Please try again later.');
      }
    });
  }

  // OTP verification form
  const otpVerificationForm = document.getElementById('otpVerificationForm');
  if (otpVerificationForm) {
    otpVerificationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const email = document.getElementById('otpEmail').value;
      const otp = document.getElementById('otpInput').value;
      const verifyBtn = this.querySelector('.login-btn');
      
      // Add loading class for button animation
      verifyBtn.classList.add('loading');
      
      if (!otp || otp.length < 6) {
        verifyBtn.classList.remove('loading');
        alert('Please enter a valid OTP code');
        return;
      }
      
      try {
        // Animation during verification
        animateProgressBar(1500);
        
        // Making API call to verify OTP
        const response = await fetch(`${api_server}/verify-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, otp })
        });
        
        const data = await response.json();
        
        // Remove loading class
        verifyBtn.classList.remove('loading');
        
        if (response.ok) {
          // Add success animation
          verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verified!';
          verifyBtn.style.backgroundColor = 'var(--success)';
          
          setTimeout(() => {
            // Store user info in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', email);
            
            // Show success message
            showRegistrationSuccess();
            
            // Reset button style after transition
            verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify & Create Account';
            verifyBtn.style.backgroundColor = 'var(--primary)';
            
            // Redirect to mobile page after 2 seconds
            setTimeout(() => {
              window.location.href = 'mobile.html';
            }, 2000);
          }, 1000);
        } else {
          // Show error message
          verifyBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
          verifyBtn.style.backgroundColor = 'var(--danger)';
          
          setTimeout(() => {
            verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify & Create Account';
            verifyBtn.style.backgroundColor = 'var(--primary)';
            alert(data.detail || 'OTP verification failed. Please try again.');
          }, 1000);
        }
      } catch (error) {
        // Remove loading class
        verifyBtn.classList.remove('loading');
        verifyBtn.innerHTML = '<i class="fas fa-times"></i> Error';
        verifyBtn.style.backgroundColor = 'var(--danger)';
        
        setTimeout(() => {
          verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verify & Create Account';
          verifyBtn.style.backgroundColor = 'var(--primary)';
        }, 1000);
        
        console.error('Error during OTP verification:', error);
        alert('An error occurred. Please try again later.');
      }
    });
  }
  
  // Show the OTP verification screen
  function showOtpVerificationScreen(email) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.style.display = 'none';
    });
    
    // Update active tab state
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show OTP screen
    document.getElementById('otp-tab').style.display = 'block';
    
    // Set the email in the hidden field
    document.getElementById('otpEmail').value = email;
    
    // Set the email message
    document.getElementById('otpEmailDisplay').textContent = email;
  }
  
  // Show registration success screen
  function showRegistrationSuccess() {
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.style.display = 'none';
    });
    
    document.getElementById('success-tab').style.display = 'block';
    document.getElementById('successMessage').style.display = 'block';
  }
  
  // Resend OTP button
  const resendOtpBtn = document.getElementById('resendOtp');
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async function() {
      const email = document.getElementById('otpEmail').value;
      
      if (!email) {
        alert('Email address is missing. Please start registration again.');
        return;
      }
      
      this.disabled = true;
      this.textContent = 'Sending...';
      
      try {
        // Resend OTP request
        const response = await fetch(`${api_server}/register-init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            name: email,
            password: password
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('OTP has been resent to your email');
          
          // If test OTP included in response, show it in development
          if (data.otp) {
            document.getElementById('testOtp').textContent = `Test OTP: ${data.otp}`;
            document.getElementById('testOtp').style.display = 'block';
          }
        } else {
          alert(data.detail || 'Failed to resend OTP. Please try again.');
        }
      } catch (error) {
        console.error('Error resending OTP:', error);
        alert('An error occurred. Please try again later.');
      } finally {
        // Re-enable button after 60 seconds
        setTimeout(() => {
          resendOtpBtn.disabled = false;
          resendOtpBtn.textContent = 'Resend OTP';
        }, 60000); // 60 seconds cooldown
      }
    });
  }
  
  // Add ripple effect to all buttons
  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('mousedown', function(e) {
      const x = e.clientX - e.target.getBoundingClientRect().left;
      const y = e.clientY - e.target.getBoundingClientRect().top;
      
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  // Initialize
  animateProgressBar(1000);
});