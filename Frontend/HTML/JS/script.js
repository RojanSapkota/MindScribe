document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userName = localStorage.getItem('userName');
  const userEmail = localStorage.getItem('userEmail');
  const api_server = 'https://mindscribe.rojan.hackclub.app';
  
  // Redirect to login page if not logged in
  if (!isLoggedIn) {
    alert('Please log in to access this page.');
    window.location.href = 'login.html';
    return;
  }

  // Add user info to the header if you want
  const appHeader = document.querySelector('.app-header');
  if (appHeader) {
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
      <span class="user-email">👋 Welcome, <b>${userEmail}</b></span><br>
      <span class="user-history"><a href="history.html" class="btn">View History</a></span>
      <button id="logoutBtn" class="btn-icon">
        <i class="fas fa-sign-out-alt"></i>
      </button>
    `;
    appHeader.appendChild(userInfo);
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      window.location.href = 'login.html';
    });
  }

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const photo = document.getElementById('photo');
  const results = document.getElementById('results');
  const fileUpload = document.getElementById('fileUpload');
  const startCameraButton = document.getElementById('startCameraButton');
  const captureButton = document.getElementById('captureButton');
  const previewContainer = document.getElementById('previewContainer');
  const closePreviewButton = document.getElementById('closePreviewButton');
  const progressBar = document.getElementById('progressBar');
  const themeSwitch = document.getElementById('themeSwitch');
  const tooltip = document.getElementById('tooltip');
  
  let darkMode = localStorage.getItem('darkMode') === 'true';
    
    // Initialize dark mode from localStorage
    if (darkMode) {
      document.body.classList.add('dark-theme');
      themeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      themeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
  themeSwitch.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-theme', darkMode);
    themeSwitch.innerHTML = darkMode ? 
      '<i class="fas fa-sun"></i>' : 
      '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', darkMode);
  });

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

  
  // Start camera when user clicks "Take a Photo"
  startCameraButton.addEventListener('click', function() {
    // Improved video constraints for better mobile compatibility
    const constraints = { 
      video: { 
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        video.srcObject = stream;
        video.style.display = 'block';
        photo.style.display = 'none';
        previewContainer.style.display = 'block';
        captureButton.style.display = 'block';
        
        // Wait for video to be ready before allowing capture
        video.onloadedmetadata = function() {
          video.play();
          animateProgressBar(1000);
        };
      })
      .catch(err => {
        console.error("Error accessing camera: ", err);
        showTooltip(startCameraButton, "Camera access denied. Please check permissions.");
      });
  });

  // Close preview
  closePreviewButton.addEventListener('click', function() {
    previewContainer.style.display = 'none';
    
    // Stop camera if it's running
    if (video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
    
    // Clear results when preview is closed
    results.style.display = 'none';
    results.innerHTML = '';
    
    // Reset photo
    photo.src = '';
  });

  // Handle file upload
  fileUpload.addEventListener('change', uploadFile);
  
  // Drag and drop support
  const uploadLabel = document.querySelector('.upload-label');
  
  uploadLabel.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadLabel.classList.add('dragover');
  });
  
  uploadLabel.addEventListener('dragleave', () => {
    uploadLabel.classList.remove('dragover');
  });
  
  uploadLabel.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadLabel.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
      fileUpload.files = e.dataTransfer.files;
      uploadFile();
    }
  });

  // Capture Image & Upload
  captureButton.addEventListener('click', takePicture);

  function takePicture() {
    // Set canvas dimensions to match the actual video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    if (!videoWidth || !videoHeight) {
      showTooltip(captureButton, "Video stream not ready. Please try again.");
      return;
    }
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Draw the current video frame to the canvas
    const context = canvas.getContext('2d');
    
    // Fix for mobile orientation
    context.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    canvas.toBlob(async function(blob) {
      if (!blob) {
        showTooltip(captureButton, "Failed to capture image. Please try again.");
        return;
      }
      
      const file = new File([blob], "captured_image.png", { type: "image/png" });
      photo.src = URL.createObjectURL(blob);
      photo.style.display = 'block';
      video.style.display = 'none';
      captureButton.style.display = 'none';

      // Stop camera stream after capture
      const stream = video.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }

      await analyzeFood(file);
    }, 'image/png', 0.9); // Added quality parameter for better compression
  }

  // Handle Image Upload
  function uploadFile() {
    const file = fileUpload.files[0];
    if (!file) {
      showTooltip(uploadLabel, "Please select an image to upload!");
      return;
    }

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      showTooltip(uploadLabel, "Please upload a valid image file (JPEG or PNG).");
      return;
    }

    if (file.size > maxSize) {
      showTooltip(uploadLabel, "File size must be less than 5MB.");
      return;
    }

    photo.src = URL.createObjectURL(file);
    photo.style.display = 'block';
    video.style.display = 'none';
    previewContainer.style.display = 'block';
    
    analyzeFood(file);
  }

  // Send Image File to API
  async function analyzeFood(file) {
    results.style.display = 'block';
    results.innerHTML = `
      <div class="analysis-loading">
        <div class="spinner"></div>
        <p>Analyzing your meal...</p>
        <small>This may take a few moments</small>
      </div>
    `;
    
    animateProgressBar(3000);

    const formData = new FormData();

    formData.append('user_email', userEmail);
    formData.append('timestamp', new Date().toLocaleString());
    formData.append('file', file);

    try {
      const response = await fetch(`${api_server}/analyze-food`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      //console.log('Data received:', data); 
      displayResults(data);

    } catch (error) {
      //console.error('Error:', error);
      results.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3>Analysis Failed</h3>
          <p>We couldn't analyze your image. Please try again with a clearer photo.</p>
          <button class="btn btn-secondary" style="margin-top: 20px;" onclick="location.reload()">
            Try Again
          </button>
        </div>
      `;
    }
  }

  // Get health score color
  function getHealthScoreColor(score) {
    if (score >= 8) return '#48BB78'; // Good - green
    if (score >= 5) return '#F6AD55'; // Moderate - orange
    return '#F56565'; // Poor - red
  }

  // Display Results
  function displayResults(data) {
    // Check if foods array exists and has items
    if (!data.foods || data.foods.length === 0) {
      results.innerHTML = `
        <div class="results-header">
          <h2>No Food Detected</h2>
          <p>We couldn't identify any food items in this image. Please try a clearer photo.</p>
        </div>
      `;
      return;
    }
  
    // Calculate total calories
    const totalCalories = data.overall_calories;
    // Get health score from the result (not inside foods)
    const healthScore = data.overall_health_score;
  
    let html = `
      <div class="results-header">
        <h2>Analysis Results</h2>
        <div class="health-stats">
          <div class="stat-item score">
            <p>HEALTH SCORE</p>
            <div class="value">${healthScore}/10</div>
          </div>
          <div class="stat-item calories">
            <p>TOTAL CALORIES</p>
            <div class="value">${totalCalories}</div>
          </div>
        </div>
      </div>
      <div class="food-list">
    `;
  
    // Loop through foods array and display each item
    data.foods.forEach(food => {
      const healthWidth = `${food.health_score * 10}%`;
      
      html += `
        <div class="food-item">
          <div class="food-details">
            <div class="food-name">${food.name}</div>
            <div class="food-ingredients">${food.ingredients.join(', ')}</div>
            <div class="food-macros">
              <div class="macro protein">
                <div class="macro-icon">P</div>
                ${food.protein}
              </div>
              <div class="macro carbs">
                <div class="macro-icon">C</div>
                ${food.carbs}
              </div>
              <div class="macro fats">
                <div class="macro-icon">F</div>
                ${food.fats}
              </div>
            </div>
            <div class="food-health">
              Health: ${food.health_score}/10
              <div class="health-bar">
                <div class="health-progress" style="width: ${healthWidth}; background: ${getHealthScoreColor(food.health_score)}"></div>
              </div>
            </div>
          </div>
          <div class="food-calories">${parseFloat(food.estimated_calories).toFixed(0)} kcal</div>
        </div>
      `;
    });
  
    html += `</div>`;
    results.innerHTML = html;
  }
});