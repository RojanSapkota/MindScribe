// MindScribe Voice Transcription

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Global variables
let recognition = null;
let isRecording = false;
let finalTranscript = '';
let interimTranscript = '';
let currentUser = null;

// DOM elements 
document.addEventListener('DOMContentLoaded', () => {
  const recordBtn = document.getElementById('recordBtn');
  const stopBtn = document.getElementById('stopBtn');
  const transcriptBox = document.getElementById('transcriptBox');
  const controlsContainer = document.getElementById('controlsContainer');
  const recordingIndicator = document.getElementById('recordingIndicator');
  const userInfoSection = document.getElementById('userInfo');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  // Check if user is logged in
  checkAuthStatus();
  
  // Initialize speech recognition
  initializeSpeechRecognition();

  // Button event listeners
  if (recordBtn) {
    recordBtn.addEventListener('click', startRecording);
  }
  
  if (stopBtn) {
    stopBtn.addEventListener('click', stopRecording);
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      window.location.href = 'login.html';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }

  // Check authentication status
  function checkAuthStatus() {
    const userEmail = localStorage.getItem('mindscribe_email');
    const userToken = localStorage.getItem('mindscribe_token');
    
    if (userEmail) {
      // User is logged in
      currentUser = {
        email: userEmail
      };
      
      // Update UI to show logged in state
      updateUIForLoggedInUser();
    } else {
      // User is not logged in
      currentUser = null;
      
      // Update UI to show logged out state
      updateUIForLoggedOutUser();
    }
  }

  // Update UI for logged in user
  function updateUIForLoggedInUser() {
    if (userInfoSection) {
      userInfoSection.innerHTML = `
        <span class="user-email">${currentUser.email}</span>
        <button id="logoutBtn" class="logout-btn">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      `;
      
      // Re-attach event listener to the new button
      document.getElementById('logoutBtn').addEventListener('click', logoutUser);
    }
    
    // Enable recording functionality
    if (recordBtn) recordBtn.disabled = false;
    if (controlsContainer) controlsContainer.classList.remove('disabled');
  }

  // Update UI for logged out user
  function updateUIForLoggedOutUser() {
    if (userInfoSection) {
      userInfoSection.innerHTML = `
        <button id="loginBtn" class="login-btn">
          <i class="fas fa-sign-in-alt"></i> Login
        </button>
      `;
      
      // Re-attach event listener to the new button
      document.getElementById('loginBtn').addEventListener('click', () => {
        window.location.href = 'login.html';
      });
    }
    
    // Disable recording functionality
    if (recordBtn) recordBtn.disabled = true;
    if (controlsContainer) controlsContainer.classList.add('disabled');
    
    // Show message in transcript box
    if (transcriptBox) {
      transcriptBox.innerHTML = `
        <div class="login-required">
          <h3>Login Required</h3>
          <p>Please login to use MindScribe's voice journaling features.</p>
          <button class="btn primary-btn" onclick="window.location.href='login.html'">
            Login / Sign Up
          </button>
        </div>
      `;
    }
  }

  // Logout user
  function logoutUser() {
    // Clear stored user data
    localStorage.removeItem('mindscribe_email');
    localStorage.removeItem('mindscribe_token');
    
    // Reset current user
    currentUser = null;
    
    // Update UI
    updateUIForLoggedOutUser();
    
    // Show message
    showToast('Logged out successfully');
  }

  function initializeSpeechRecognition() {
    // Check browser support
    if ('webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      recognition = new SpeechRecognition();
    } else {
      if (transcriptBox) {
        transcriptBox.textContent = "Your browser doesn't support speech recognition. Please try Chrome or Edge.";
      }
      if (recordBtn) {
        recordBtn.disabled = true;
      }
      return;
    }

    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';    // Recognition event handlers
    recognition.onstart = () => {
      isRecording = true;
      finalTranscript = '';
      
      // Update UI to show recording state
      if (recordBtn) {
        recordBtn.classList.add('recording');
        recordBtn.style.display = 'none';
      }
      
      if (stopBtn) {
        stopBtn.disabled = false;
        stopBtn.style.display = 'flex';
      }
      
      if (controlsContainer) {
        controlsContainer.classList.add('recording');
      }
      
      if (transcriptBox) {
        transcriptBox.innerHTML = '<div class="listening-indicator"><em>Listening...</em></div>';
      }
    };

    recognition.onresult = (event) => {
      interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
        // Update the display
      if (transcriptBox) {
        transcriptBox.innerHTML = `
          <div style="min-height: 100px;">
            ${finalTranscript}
            <span style="color:#999;">${interimTranscript}</span>
          </div>
          <div class="listening-wave" style="text-align: center; margin-top: 15px;">
            <i class="fas fa-wave-square" style="color: var(--primary-color);"></i> Listening...
          </div>
        `;
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);      if (transcriptBox) {
        if (event.error === 'no-speech') {
          transcriptBox.innerHTML = `
            <div class="placeholder-message">
              <i class="fas fa-exclamation-circle" style="color: var(--warning-color); font-size: 1.5rem; margin-bottom: 10px;"></i>
              <p>No speech detected. Please try again.</p>
            </div>
          `;
        } else {
          transcriptBox.innerHTML = `
            <div class="placeholder-message">
              <i class="fas fa-exclamation-triangle" style="color: var(--danger-color); font-size: 1.5rem; margin-bottom: 10px;"></i>
              <p>Error: ${event.error}</p>
              <p>Please try again later.</p>
            </div>
          `;
        }
      }
      stopRecognition();
    };

    recognition.onend = () => {
      stopRecognition();
      
      // Only send if we have actual content
      if (finalTranscript.trim() !== '') {
        sendTranscriptToServer(finalTranscript);
      }
    };
  }

  function startRecording() {
    if (recognition) {
      try {
        recognition.start();
        console.log("Recording started");
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }
  }

  function stopRecording() {
    if (recognition && isRecording) {
      recognition.stop();
      console.log("Recording stopped");
    }
  }
  function stopRecognition() {
    isRecording = false;
    
    // Update UI to show stopped state
    if (recordBtn) {
      recordBtn.classList.remove('recording');
      recordBtn.disabled = false;
      recordBtn.style.display = 'flex';
    }
    
    if (stopBtn) {
      stopBtn.disabled = true;
      stopBtn.style.display = 'none';
    }
    
    if (controlsContainer) {
      controlsContainer.classList.remove('recording');
    }
  }  async function sendTranscriptToServer(transcript) {
    if (transcriptBox) {
      transcriptBox.innerHTML = `
        <div style="text-align: center; padding: 30px 0;">
          <div class="loading"><div></div><div></div><div></div><div></div></div>
          <p style="margin-top: 15px;"><em>Processing your journal entry...</em></p>
        </div>
      `;
    }
      try {
      // Check if user is logged in
      if (!currentUser) {
        if (transcriptBox) {
          transcriptBox.innerHTML = `
            <div class="login-required">
              <h3>Login Required</h3>
              <p>Please login to analyze your journal entries.</p>
              <button class="btn primary-btn" onclick="window.location.href='login.html'">
                Login / Sign Up
              </button>
            </div>
          `;
        }
        return;
      }
      
      // Use the logged in user's email
      const userEmail = currentUser.email;
      
      // Use the full URL to the API server
      const apiUrl = 'http://127.0.0.1:8000/transcribe';
        const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({          user_email: userEmail,
          transcript: transcript,
          timestamp: new Date().toISOString(),
          skip_user_check: false  // Enforce user validation
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
        if (transcriptBox) {
        // Display the analysis from the server
        let emotionsHTML = '';
        if (data.analysis.emotions && data.analysis.emotions.length > 0) {
          data.analysis.emotions.forEach(emotion => {
            emotionsHTML += `<span class="emotion-tag">${emotion}</span>`;
          });
        } else {
          emotionsHTML = '<span class="emotion-tag">Neutral</span>';
        }
        
        let intentionsHTML = '';
        if (data.analysis.intentions && data.analysis.intentions.length > 0) {
          intentionsHTML = '<ul class="intentions-list">';
          data.analysis.intentions.forEach(intention => {
            intentionsHTML += `<li>${intention}</li>`;
          });
          intentionsHTML += '</ul>';
        } else {
          intentionsHTML = '<p class="analysis-content">No specific goals detected</p>';
        }
        
        // Calculate score for the progress bar
        const positivityScore = data.analysis.positivity_score || 5;
        const scorePercentage = (positivityScore / 10) * 100;
        
        const analysisHTML = `
          <div class="analysis">
            <h3>AI Analysis</h3>
            
            <div class="analysis-section">
              <div class="analysis-title">Summary</div>
              <div class="analysis-content">${data.analysis.summary}</div>
            </div>
            
            <div class="analysis-section">
              <div class="analysis-title">Emotions</div>
              <div class="analysis-content">
                ${emotionsHTML}
              </div>
            </div>
            
            ${data.analysis.intentions && data.analysis.intentions.length > 0 ? `
              <div class="analysis-section">
                <div class="analysis-title">Intentions/Goals</div>
                ${intentionsHTML}
              </div>
            ` : ''}
            
            <div class="analysis-section">
              <div class="analysis-title">Reflection Question</div>
              <div class="reflection">${data.analysis.reflection_question}</div>
            </div>
            
            <div class="analysis-section">
              <div class="analysis-title">Positivity</div>
              <div class="score-container">
                <div class="score-number">${positivityScore}</div>
                <div class="score-bar">
                  <div class="score-fill" style="width: ${scorePercentage}%"></div>
                </div>
                <div>10</div>
              </div>
            </div>
          </div>
        `;
        
        transcriptBox.innerHTML = `
          <div class="journal-entry">
            <h3>Your Journal Entry</h3>
            <p>${transcript}</p>
          </div>
          ${analysisHTML}
        `;
      }
    } catch (error) {
      console.error('Error sending transcript:', error);
      if (transcriptBox) {
        let errorMessage = error.message;
        let helpText = '';
        
        // Provide more helpful messages based on common errors
        if (error.message.includes('405')) {
          helpText = 'Make sure the backend server is running at http://localhost:8000';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          helpText = 'Cannot connect to the server. Please check if the backend is running.';
        }
        
        transcriptBox.innerHTML = `
          <div class="placeholder-message">
            <i class="fas fa-exclamation-triangle" style="color: var(--danger-color); font-size: 1.5rem; margin-bottom: 10px;"></i>
            <p>Error: ${errorMessage}</p>
            ${helpText ? `<p>${helpText}</p>` : ''}
            <p>We couldn't process your journal entry.</p>
            
            <div style="margin-top: 20px;">
              <button id="retryButton" style="
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
              ">Try Again</button>
            </div>
            
            <div class="journal-entry" style="text-align: left; margin-top: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
              <h3>Your Journal Entry:</h3>
              <p>${transcript}</p>
            </div>
          </div>
        `;
        
        // Add event listener to retry button
        const retryButton = document.getElementById('retryButton');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            sendTranscriptToServer(transcript);
          });
        }
      }
    }
  }
});

// Helper Functions
// Show a toast notification
function showToast(message, type = 'success') {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
    `;
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.cssText = `
    background-color: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    opacity: 0;
    transform: translateY(-20px);
    transition: all 0.3s ease;
  `;
  
  toast.textContent = message;
  
  // Append toast to container
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    
    // Remove element after animation
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 300);
  }, 3000);
}
