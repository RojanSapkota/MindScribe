// Global variables
let recognition = null;
let isRecording = false;
let finalTranscript = '';
let interimTranscript = '';
let currentUser = localStorage.getItem('Useremail'); // Use the correct key

// Use API_BASE_URL from mobile-home.js

// DOM Elements
const recordingModal = document.getElementById('recordingModal');
const closeRecordModalBtn = document.getElementById('closeRecordModal');
const startRecordBtn = document.getElementById('startRecordBtn');
const stopRecordBtn = document.getElementById('stopRecordBtn');
const saveTranscriptBtn = document.getElementById('saveTranscriptBtn');
const recordingAnimation = document.getElementById('recordingAnimation');
const interimTranscriptElement = document.getElementById('interimTranscript');
const finalTranscriptElement = document.getElementById('finalTranscript');
// Using newEntryBtn from mobile-home.js instead of redeclaring

// Initialize speech recognition
function initializeSpeechRecognition() {
  // Check if the browser supports speech recognition
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Your browser does not support speech recognition');
    alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
    return;
  }

  // Create a new recognition instance
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  // Configure recognition settings
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  // Set up event handlers
  recognition.onstart = () => {
    isRecording = true;
    stopRecordBtn.disabled = false;
    startRecordBtn.disabled = true;
    recordingAnimation.classList.add('recording-active');
    showRecordingToast();
  };

  recognition.onend = () => {
    isRecording = false;
    stopRecordBtn.disabled = true;
    startRecordBtn.disabled = false;
    saveTranscriptBtn.disabled = finalTranscript.trim() === '';
    recordingAnimation.classList.remove('recording-active');
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript + ' ';
        finalTranscript += transcript + ' ';
      } else {
        interim += transcript;
      }
    }

    if (interim) interimTranscriptElement.textContent = interim;
    if (final) finalTranscriptElement.textContent = finalTranscript;
    // Enable save button if there is any transcript
    saveTranscriptBtn.disabled = finalTranscript.trim() === '';
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    stopRecording();
    alert('Speech recognition error: ' + event.error);
  };
}

// Start the recording process
function startRecording() {
  // Reset transcripts
  finalTranscript = '';
  interimTranscript = '';
  finalTranscriptElement.textContent = '';
  interimTranscriptElement.textContent = '';
  saveTranscriptBtn.disabled = true;

  // Check if user is logged in
  if (!currentUser) {
    showAuthModal();
    return;
  }

  try {
    recognition.start();
  } catch (error) {
    console.error('Error starting recognition:', error);
    alert('Could not start recording. Please try again.');
  }
}

// Stop the recording process
function stopRecording() {
  if (isRecording) {
    try {
      recognition.stop();
      simulateHapticFeedback(100);
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }
}

// Save the transcript to the backend
async function saveTranscript() {
  if (finalTranscript.trim() === '') {
    alert('No transcript to save.');
    return;
  }

  // Check if user is logged in
  if (!currentUser) {
    showAuthModal();
    return;
  }

  showLoader('Analyzing your thoughts...');

  try {
    const formData = new FormData();
    formData.append('user_email', currentUser);
    formData.append('transcript', finalTranscript.trim());
    formData.append('timestamp', new Date().toISOString());

    const response = await fetch('http://127.0.0.1:8000/transcribe', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to save transcript');
    }

    const data = await response.json();
    hideLoader();
    // Show success and analysis
    showAnalysisResults(data);
    closeRecordingModal();
  } catch (error) {
    hideLoader();
    console.error('Error saving transcript:', error);
    alert('Error: ' + error.message);
  }
}

// Show analysis results in a modal
function showAnalysisResults(analysis) {
  // Create analysis modal dynamically
  const modalHtml = `
    <div class="modal" id="analysisModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Journal Analysis</h3>
          <button class="close-modal" onclick="closeAnalysisModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="analysis-item">
            <h4>Summary</h4>
            <p>${analysis.summary}</p>
          </div>
          <div class="analysis-item">
            <h4>Detected Mood</h4>
            <p class="mood-badge">${analysis.mood}</p>
            <div class="sentiment-meter">
              <div class="sentiment-scale">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>
              <div class="sentiment-indicator" style="left: ${((analysis.sentiment_score + 10) / 20) * 100}%;"></div>
            </div>
          </div>
          <div class="analysis-item">
            <h4>Key Topics</h4>
            <div class="topics-container">
              ${analysis.key_topics.map(topic => `<span class="topic-badge">${topic}</span>`).join('')}
            </div>
          </div>
          <div class="analysis-item">
            <h4>Insights</h4>
            <ul>
              ${analysis.insights.map(insight => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
          <div class="analysis-item">
            <h4>Suggestions</h4>
            <ul>
              ${analysis.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
          </div>
          <button class="action-button ripple" onclick="closeAnalysisModal()">
            <i class="fas fa-check"></i> Done
          </button>
        </div>
      </div>
    </div>
  `;

  // Insert the modal into the document
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Add CSS for the analysis modal
  const style = document.createElement('style');
  style.textContent = `
    .analysis-item {
      margin-bottom: 20px;
    }
    .mood-badge {
      display: inline-block;
      background: var(--primary);
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: 600;
    }
    .sentiment-meter {
      position: relative;
      height: 30px;
      width: 100%;
      background: #f1f5f9;
      border-radius: 10px;
      margin-top: 10px;
    }
    .sentiment-scale {
      display: flex;
      justify-content: space-between;
      padding: 0 5px;
      font-size: 12px;
      color: #666;
    }
    .sentiment-indicator {
      position: absolute;
      top: 5px;
      width: 12px;
      height: 12px;
      background: var(--primary);
      border-radius: 50%;
      transform: translateX(-50%);
    }
    .topics-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .topic-badge {
      background: #e0e7ff;
      color: var(--primary-dark);
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 13px;
    }
    #analysisModal .modal-content {
      max-width: 500px;
      margin: 10vh auto;
      border-radius: 15px;
      transform: translateY(50px);
      max-height: 80vh;
    }
    body.dark-mode #analysisModal .modal-content {
      background: #1e293b;
      color: white;
    }
    body.dark-mode .sentiment-meter {
      background: #334155;
    }
    body.dark-mode .topic-badge {
      background: #334155;
      color: #e0e7ff;
    }
  `;
  document.head.appendChild(style);

  // Show the modal
  setTimeout(() => {
    const modal = document.getElementById('analysisModal');
    modal.classList.add('active');
  }, 100);
}

// Close the analysis modal
window.closeAnalysisModal = function() {
  const modal = document.getElementById('analysisModal');
  modal.classList.remove('active');
  setTimeout(() => {
    modal.remove();
  }, 300);
};

// Show auth modal when needed
function showAuthModal() {
  alert('Please log in to use this feature.');
  // Redirect to login page or show login modal
  window.location.href = 'login.html';
}

// Show a recording toast notification
function showRecordingToast() {
  const toast = document.createElement('div');
  toast.className = 'toast-notification recording-toast';
  toast.innerHTML = '<i class="fas fa-microphone"></i> Recording...';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

// Open the recording modal
function openRecordingModal() {
  recordingModal.classList.add('active');
  initializeSpeechRecognition();
}

// Close the recording modal
function closeRecordingModal() {
  stopRecording();
  recordingModal.classList.remove('active');
}

// Event listeners
if (newEntryBtn) {
  newEntryBtn.addEventListener('click', openRecordingModal);
}

if (closeRecordModalBtn) {
  closeRecordModalBtn.addEventListener('click', closeRecordingModal);
}

if (startRecordBtn) {
  startRecordBtn.addEventListener('click', startRecording);
}

if (stopRecordBtn) {
  stopRecordBtn.addEventListener('click', stopRecording);
}

if (saveTranscriptBtn) {
  saveTranscriptBtn.addEventListener('click', saveTranscript);
}

// Export functions for main script
window.voiceRecording = {
  openRecordingModal,
  closeRecordingModal,
  startRecording,
  stopRecording,
  saveTranscript
};
