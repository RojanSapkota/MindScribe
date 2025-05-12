document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const api_server = 'http://127.0.0.1:8000';
  
  // Redirect to login page if not logged in
  if (!isLoggedIn) {
    alert('Please log in to access this app.');
    window.location.href = 'login.html';
    return;
  }
  
  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.mobile-view');
  const logoutBtn = document.getElementById('logoutBtn');
  const startCameraButton = document.getElementById('startCameraButton');
  const captureButton = document.getElementById('captureButton');
  const closePreviewButton = document.getElementById('closePreviewButton');
  const previewContainer = document.getElementById('previewContainer');
  const video = document.getElementById('video');
  const photo = document.getElementById('photo');
  const canvas = document.getElementById('canvas');
  const fileUpload = document.getElementById('fileUpload');
  const results = document.getElementById('results');
  const tooltip = document.getElementById('tooltip');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const viewSettings = document.getElementById('viewSettings');
  const backToProfileBtn = document.getElementById('backToProfileBtn');
  const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
  const logFoodButton = document.getElementById('logFoodButton');
  const logFoodContainer = document.getElementById('logFoodContainer');
  const foodDescription = document.getElementById('foodDescription');
  const submitFoodLog = document.getElementById('submitFoodLog');
  const cancelFoodLog = document.getElementById('cancelFoodLog');
  const speechToTextBtn = document.getElementById('speechToTextBtn');
  const speechStatus = document.getElementById('speechStatus');
  
  // Set user info
  document.getElementById('welcomeUserEmail').textContent = userEmail || 'User';
  document.getElementById('profileUserEmail').textContent = userEmail || 'User';
  document.getElementById('memberSince').textContent = new Date().getFullYear();
  
  // Dark mode init - moved to settings
  let darkMode = localStorage.getItem('darkMode') === 'true';
  
  // Initialize dark mode from localStorage
  if (darkMode) {
    document.body.classList.add('dark-theme');
  }
  
  // Initialize dark mode toggle in settings
  if (darkModeToggle) {
    darkModeToggle.checked = darkMode;
    
    darkModeToggle.addEventListener('change', function() {
      darkMode = this.checked;
      document.body.classList.toggle('dark-theme', darkMode);
      localStorage.setItem('darkMode', darkMode);
    });
  }
  
  // Enhanced scan button effect
  const scanButton = document.querySelector('.nav-item-scan');
  if (scanButton) {
    scanButton.addEventListener('click', function() {
      // Add a ripple effect when clicked
      const wrapper = this.querySelector('.scan-button-wrapper');
      const ripple = document.createElement('span');
      ripple.className = 'scan-ripple';
      wrapper.appendChild(ripple);
      
      // Clean up ripple after animation
      setTimeout(() => {
        ripple.remove();
      }, 700);
      
      // Continue with the normal tab switch
      const viewId = this.getAttribute('data-view');
      switchTab(viewId);
    });
  }
  
  // Bottom navigation functionality
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const viewId = this.getAttribute('data-view');
      switchTab(viewId);
    });
  });
  
  // Tab switching function
  window.switchTab = function(viewId) {
    // No longer redirect activity view since we have a placeholder now
    
    // Update active nav item
    navItems.forEach(nav => {
      nav.classList.toggle('active', nav.getAttribute('data-view') === viewId);
    });
    
    // Show the selected view and hide others
    views.forEach(view => {
      if (view.id === viewId) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    });
    
    // Handle history view with optimized loading
    if (viewId === 'communityView') {
      // Check if cached data exists and display it immediately
      const cachedHistoryData = localStorage.getItem('historyData');
      
      if (cachedHistoryData) {
        try {
          // Parse the cached data
          const cachedData = JSON.parse(cachedHistoryData);
          const now = Date.now();
          const cacheAge = now - cachedData.timestamp;
          
          // If cache is fresh (less than 15 minutes old)
          if (cacheAge < 15 * 60 * 1000) {
            // Use cached data
            historyData = cachedData.data;
            
            // Display the cached data
            if (historyData && historyData.length > 0) {
              applyFiltersAndSort();
            } else {
              showEmptyHistoryState();
            }
            
            // Show a little message that data is from cache
            showCachedDataNotification();
            return;
          }
        } catch (e) {
          console.error('Error parsing cached history data', e);
        }
      }
      
      // If no fresh cache, load the data from server
      loadHistoryData();
    }
    
    // Handle terms and privacy tab switching when terms view is active
    if (viewId === 'termsView') {
      initializeTermsAndPrivacy();
    }
  };
  
  // Settings page functionality
  if (viewSettings) {
    viewSettings.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab('settingsView');
    });
  }
  
  if (backToProfileBtn) {
    backToProfileBtn.addEventListener('click', function() {
      switchTab('profileView');
    });
  }
  
  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      window.location.href = 'login.html';
    });
  }
  
  // Show tooltip function
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
  
  // Camera functionality
  if (startCameraButton) {
    startCameraButton.addEventListener('click', function() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera access is not supported in this browser or context. Please use a modern browser (Chrome, Edge, Safari) and run the app over HTTPS or localhost.');
        return;
      }
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
          };
        })
        .catch(err => {
          console.error("Error accessing camera: ", err);
          showTooltip(startCameraButton, "Camera access denied. Please check permissions.");
        });
    });
  }
  
  // Close preview
  if (closePreviewButton) {
    closePreviewButton.addEventListener('click', function() {
      previewContainer.style.display = 'none';
      
      // Stop camera if it's running
      if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
      }
      
      // Clear results when preview is closed
      if (results) {
        results.style.display = 'none';
        results.innerHTML = '';
      }
      
      // Reset photo
      if (photo) {
        photo.src = '';
      }
    });
  }
  
  // Capture Image
  if (captureButton) {
    captureButton.addEventListener('click', takePicture);
  }

  function takePicture() {
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
    }, 'image/png', 0.9);
  }
  
  // Handle file upload
  if (fileUpload) {
    fileUpload.addEventListener('change', uploadFile);
  }
  
  function uploadFile() {
    const file = fileUpload.files[0];
    if (!file) {
      showTooltip(fileUpload.parentElement, "Please select an image to upload!");
      return;
    }

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      showTooltip(fileUpload.parentElement, "Please upload a valid image file (JPEG or PNG).");
      return;
    }

    if (file.size > maxSize) {
      showTooltip(fileUpload.parentElement, "File size must be less than 5MB.");
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
        <div class="spinner-container">
          <div class="spinner"></div>
          <div class="percentage">0%</div>
        </div>
        <p>Analyzing your meal...</p>
        <small>This may take a few moments</small>
      </div>
    `;

    const formData = new FormData();
    formData.append('user_email', userEmail);
    formData.append('timestamp', new Date().toLocaleString());
    formData.append('file', file);

    try {
      // Start the percentage animation
      let percentage = 0;
      const percentageEl = document.querySelector('.percentage');
      const percentageInterval = setInterval(() => {
        // Increment percentage slower as it gets higher to simulate actual processing
        if (percentage < 70) {
          percentage += 2;
        } else if (percentage < 90) {
          percentage += 1;
        } else if (percentage < 99) {
          percentage += 0.5;
        }
        
        if (percentage > 99) {
          percentage = 99;
          clearInterval(percentageInterval);
        }
        
        percentageEl.textContent = `${Math.floor(percentage)}%`;
      }, 150);

      const response = await fetch(`${api_server}/analyze-food`, {
        method: 'POST',
        body: formData
      });

      // Clear the interval once we get a response
      clearInterval(percentageInterval);
      percentageEl.textContent = '100%';

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      displayResults(data);
      
      // Update stats in home view if available
      updateHomeStats();

    } catch (error) {
      console.error('Error:', error);
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
  
  // Log Food functionality
  if (logFoodButton) {
    logFoodButton.addEventListener('click', function() {
      logFoodContainer.style.display = 'block';
      // Hide camera/upload options when logging food
      document.querySelector('.scan-buttons').style.display = 'none';
    });
  }
  
  if (cancelFoodLog) {
    cancelFoodLog.addEventListener('click', function() {
      logFoodContainer.style.display = 'none';
      foodDescription.value = ''; // Clear the text area
      document.querySelector('.scan-buttons').style.display = 'flex';
      stopSpeechToText(); // Make sure to stop any ongoing speech recognition
    });
  }
  
  if (submitFoodLog) {
    submitFoodLog.addEventListener('click', function() {
      const foodText = foodDescription.value.trim();
      
      if (!foodText) {
        showTooltip(foodDescription, "Please enter a food description");
        return;
      }
      
      // Hide food logging UI and show results
      logFoodContainer.style.display = 'none';
      analyzeFoodByText(foodText);
    });
  }
  
  // Speech to Text functionality
  let recognition;
  let isListening = false;

  // Initialize speech recognition if browser supports it
  function initSpeechRecognition() {
    // Check if browser supports the Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // Initialize SpeechRecognition object
      recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      
      // Configure speech recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Store the previous content when starting a new speech recognition session
      let previousContent = '';
      
      // Event listeners for results
      recognition.onresult = function(event) {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        // Update textarea with the previous content plus the new transcribed speech
        foodDescription.value = previousContent + " " + transcript;
      };
      
      // Handle start of speech recognition
      recognition.onstart = function() {
        // Save current content before starting a new recognition session
        previousContent = foodDescription.value.trim();
      };
      
      // Handle end of speech recognition
      recognition.onend = function() {
        stopSpeechToText();
      };
      
      // Handle errors
      recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        stopSpeechToText();
        showTooltip(speechToTextBtn, `Error: ${event.error}. Try again.`);
      };
      
      return true;
    } else {
      // Browser doesn't support speech recognition
      return false;
    }
  }
  
  // Start listening for speech
  function startSpeechToText() {
    if (isListening) return;
    
    if (!recognition && !initSpeechRecognition()) {
      showTooltip(speechToTextBtn, "Your browser doesn't support speech recognition");
      return;
    }
    
    try {
      // Start speech recognition
      recognition.start();
      isListening = true;
      
      // Update UI to show listening state
      speechToTextBtn.classList.add('active');
      speechStatus.style.display = 'flex';
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      showTooltip(speechToTextBtn, "Couldn't start speech recognition");
    }
  }
  
  // Stop listening for speech
  function stopSpeechToText() {
    if (!isListening || !recognition) return;
    
    try {
      // Stop speech recognition
      recognition.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
    
    // Update UI to show not listening state
    isListening = false;
    speechToTextBtn.classList.remove('active');
    speechStatus.style.display = 'none';
  }
  
  // Toggle speech recognition on button click
  if (speechToTextBtn) {
    speechToTextBtn.addEventListener('click', function() {
      if (isListening) {
        stopSpeechToText();
      } else {
        startSpeechToText();
      }
    });
  }
  
  // Function to analyze food by text description
  async function analyzeFoodByText(foodText) {
    results.style.display = 'block';
    results.innerHTML = `
      <div class="analysis-loading">
        <div class="spinner-container">
          <div class="spinner"></div>
          <div class="percentage">0%</div>
        </div>
        <p>Analyzing your meal...</p>
        <small>This may take a few moments</small>
      </div>
    `;

    const formData = new FormData();
    formData.append('user_email', userEmail);
    formData.append('food_text', foodText);
    formData.append('timestamp', new Date().toLocaleString());

    try {
      // Start the percentage animation
      let percentage = 0;
      const percentageEl = document.querySelector('.percentage');
      const percentageInterval = setInterval(() => {
        // Increment percentage slower as it gets higher to simulate actual processing
        if (percentage < 70) {
          percentage += 2;
        } else if (percentage < 90) {
          percentage += 1;
        } else if (percentage < 99) {
          percentage += 0.5;
        }
        
        if (percentage > 99) {
          percentage = 99;
          clearInterval(percentageInterval);
        }
        
        percentageEl.textContent = `${Math.floor(percentage)}%`;
      }, 150);

      const response = await fetch(`${api_server}/log-food`, {
        method: 'POST',
        body: formData
      });

      // Clear the interval once we get a response
      clearInterval(percentageInterval);
      percentageEl.textContent = '100%';

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      displayResults(data);
      
      // Show the scan buttons again after displaying results
      document.querySelector('.scan-buttons').style.display = 'flex';
      
      // Update stats in home view if available
      updateHomeStats();

    } catch (error) {
      console.error('Error:', error);
      results.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3>Analysis Failed</h3>
          <p>We couldn't analyze your food description. Please try again with more details.</p>
          <button class="btn btn-secondary" style="margin-top: 20px;" onclick="document.querySelector('.scan-buttons').style.display = 'flex'; document.getElementById('logFoodContainer').style.display = 'none'; document.getElementById('results').style.display = 'none';">
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
    // Get health score from the result
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
  
  // History functionality
  let historyData = [];
  let filteredData = [];
  let currentPage = 1;
  const itemsPerPage = 5;
  
  // Load history data from API
  async function loadHistoryData(showLoadingIndicator = true) {
    const historyContainer = document.getElementById('historyContainer');
    const emptyHistory = document.getElementById('emptyHistory');
    const paginationContainer = document.getElementById('pagination');
    const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    
    if (!historyContainer) return;
    
    // Show loading state if requested
    if (showLoadingIndicator) {
      if (refreshHistoryBtn) refreshHistoryBtn.classList.add('loading');
      historyContainer.innerHTML = '<div class="loading">Loading your food history...</div>';
      if (emptyHistory) emptyHistory.style.display = 'none';
    }
    
    try {
      // Create FormData for the request
      const formData = new FormData();
      formData.append('user_email', userEmail);
    
      // Fetch history data from API
      const response = await fetch(`${api_server}/food-history`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if food_history exists and has items before proceeding
      if (!data.food_history || data.food_history.length === 0) {
        historyData = [];
        showEmptyHistoryState();
        
        // Update home stats with empty data
        updateHomeStats(0, 0);
      } else {
        // Transform API data to match expected frontend format
        historyData = data.food_history.map(entry => {
          return {
            date: entry.timestamp,
            healthScore: entry.overall_health_score,
            totalCalories: parseNutrient(entry.overall_calories),
            items: entry.foods.map(food => {
              return {
                name: food.name,
                ingredients: Array.isArray(food.ingredients) ? food.ingredients.join(', ') : 'No ingredients data',
                calories: parseNutrient(food.estimated_calories),
                carbs: parseNutrient(food.carbs),
                protein: parseNutrient(food.protein),
                fat: parseNutrient(food.fats)
              };
            })
          };
        });
        
        // Update home stats
        const totalMeals = historyData.length;
        const avgHealthScore = historyData.reduce((sum, entry) => sum + entry.healthScore, 0) / totalMeals;
        updateHomeStats(totalMeals, avgHealthScore.toFixed(1));
        
        // Cache the history data
        localStorage.setItem('historyData', JSON.stringify({
          data: historyData,
          timestamp: Date.now()
        }));
        
        // Apply initial filters and sort
        applyFiltersAndSort();
      }
      
    } catch (error) {
      console.error('Error loading history data:', error);
      showErrorHistoryState();
      
      // Update home stats with error state
      updateHomeStats('--', '--');
    } finally {
      // Remove loading state
      if (refreshHistoryBtn) refreshHistoryBtn.classList.remove('loading');
    }
  }
  
  // Helper function to parse nutrient values
  function parseNutrient(value) {
    if (typeof value === 'string') {
      // Extract the first number found in the string (handles cases like "165 kcal")
      const match = value.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 0;
    }
    return parseFloat(value) || 0;
  }
  
  // Helper function to show empty history state
  function showEmptyHistoryState() {
    const historyContainer = document.getElementById('historyContainer');
    const emptyHistory = document.getElementById('emptyHistory');
    const paginationContainer = document.getElementById('pagination');
    
    if (historyContainer) historyContainer.innerHTML = '';
    if (emptyHistory) emptyHistory.style.display = 'block';
    if (paginationContainer) paginationContainer.style.display = 'none';
  }
  
  // Helper function to show error history state
  function showErrorHistoryState() {
    const historyContainer = document.getElementById('historyContainer');
    const emptyHistory = document.getElementById('emptyHistory');
    const paginationContainer = document.getElementById('pagination');
    
    if (historyContainer) historyContainer.innerHTML = '';
    if (emptyHistory) {
      emptyHistory.style.display = 'block';
      emptyHistory.innerHTML = `
        <div class="empty-history-content">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error loading history</h3>
          <p>We couldn't load your food history. Please try again later.</p>
        </div>
      `;
    }
    if (paginationContainer) paginationContainer.style.display = 'none';
  }
  
  // Show notification that data is from cache
  function showCachedDataNotification() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.textContent = "Showing cached data. Refresh for latest updates.";
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
      tooltip.style.bottom = '80px';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';
      
      setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => {
          tooltip.style.visibility = 'hidden';
        }, 300);
      }, 300);
    }
  }
  
  // Apply filters and sorting to history data
  function applyFiltersAndSort() {
    const searchInput = document.getElementById('searchInput');
    const sortBySelect = document.getElementById('sortBy');
    const filterHealthScore = document.getElementById('filterHealthScore');
    const historyContainer = document.getElementById('historyContainer');
    const emptyHistory = document.getElementById('emptyHistory');
    const paginationContainer = document.getElementById('pagination');
    
    if (!searchInput || !sortBySelect || !filterHealthScore || !historyContainer) return;
    
    // Get search text
    const searchText = searchInput.value.toLowerCase().trim();
    
    // Apply health score filter and search text filter
    filteredData = historyData.filter(entry => {
      // Health score filter
      const healthScoreValue = parseFloat(entry.healthScore);
      const filterValue = filterHealthScore.value === "all" ? 0 : parseFloat(filterHealthScore.value);
      
      const matchesHealthScore = filterHealthScore.value === "all" || healthScoreValue >= filterValue;
      
      // Search text filter
      const matchesSearch = searchText === '' || 
                          entry.items.some(item => 
                            item.name.toLowerCase().includes(searchText) ||
                            (item.ingredients && item.ingredients.toLowerCase().includes(searchText))
                          );
      
      return matchesHealthScore && matchesSearch;
    });
    
    // Apply sorting
    const sortBy = sortBySelect.value;
    
    if (sortBy === 'date-desc') {
      filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'date-asc') {
      filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'calories-desc') {
      filteredData.sort((a, b) => b.totalCalories - a.totalCalories);
    } else if (sortBy === 'calories-asc') {
      filteredData.sort((a, b) => a.totalCalories - b.totalCalories);
    } else if (sortBy === 'health-desc') {
      filteredData.sort((a, b) => b.healthScore - a.healthScore);
    } else if (sortBy === 'health-asc') {
      filteredData.sort((a, b) => a.healthScore - b.healthScore);
    }
    
    // Reset to first page when filters change
    currentPage = 1;
    
    // Create history cards with the filtered and sorted data
    createHistoryCards(filteredData);
  }
  
  // Create history cards for the mobile view
  function createHistoryCards(data) {
    const historyContainer = document.getElementById('historyContainer');
    const emptyHistory = document.getElementById('emptyHistory');
    const paginationContainer = document.getElementById('pagination');
    
    if (!historyContainer || !emptyHistory) return;
    
    if (data.length === 0) {
      historyContainer.innerHTML = '';
      emptyHistory.style.display = 'block';
      if (paginationContainer) paginationContainer.style.display = 'none';
      return;
    }
    
    emptyHistory.style.display = 'none';
    historyContainer.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);
    const paginatedData = data.slice(startIndex, endIndex);
    
    // Create history cards for current page
    paginatedData.forEach((entry, index) => {
      const { date, time } = formatDate(entry.date);
      const healthDisplay = getHealthScoreDisplay(entry.healthScore);
      
      const card = document.createElement('div');
      card.className = 'history-card';
      card.setAttribute('data-entry-id', entry.id || index); // Use entry ID if available or index
      card.setAttribute('data-entry-date', entry.date);
      
      card.innerHTML = `
        <div class="history-card-header">
          <div>
            <div class="history-date">${date}</div>
            <div class="history-time">${time}</div>
            <div class="history-summary">
              <div class="history-summary-item calories-summary">
                <i class="fas fa-fire"></i>
                ${Math.round(entry.totalCalories)} cal
              </div>
              <div class="history-summary-item health-summary" style="color: ${healthDisplay.color}">
                <i class="${healthDisplay.icon}"></i>
                ${entry.healthScore}/10
              </div>
            </div>
          </div>
          <div class="history-actions">
            <button class="history-actions-btn">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <div class="history-dropdown">
              <div class="history-dropdown-item delete">
                <i class="fas fa-trash"></i> Delete
              </div>
            </div>
          </div>
          <button class="toggle-btn">
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>
        <div class="history-card-body">
          ${createFoodItems(entry.items)}
        </div>
      `;
      
      historyContainer.appendChild(card);
      
      // Add event listener to toggle button
      const toggleBtn = card.querySelector('.toggle-btn');
      toggleBtn.addEventListener('click', () => {
        card.classList.toggle('expanded');
        const icon = toggleBtn.querySelector('i');
        if (card.classList.contains('expanded')) {
          icon.className = 'fas fa-chevron-up';
        } else {
          icon.className = 'fas fa-chevron-down';
        }
      });

      // Add event listener for actions button
      const actionsBtn = card.querySelector('.history-actions-btn');
      const dropdown = card.querySelector('.history-dropdown');
      
      actionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
        
        // Close other open dropdowns
        document.querySelectorAll('.history-dropdown.show').forEach(el => {
          if (el !== dropdown) el.classList.remove('show');
        });
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
      
      // Add event listener for delete action
      const deleteBtn = card.querySelector('.history-dropdown-item.delete');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.remove('show');
        
        // Show delete confirmation modal
        showDeleteConfirmation(entry, card);
      });
    });
    
    // Create pagination if needed
    if (paginationContainer) {
      createPagination(data.length, paginationContainer);
    }
  }
  
  // Function to show delete confirmation modal
  function showDeleteConfirmation(entry, cardElement) {
    const modal = document.createElement('div');
    modal.className = 'delete-confirm-modal';
    
    const date = formatDate(entry.date).date;
    
    modal.innerHTML = `
      <div class="delete-confirm-content">
        <div class="delete-confirm-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Delete Food Entry</h3>
        </div>
        <div class="delete-confirm-body">
          <p>Are you sure you want to delete this food entry from ${date}?</p>
          <div class="delete-confirm-actions">
            <button class="delete-confirm-cancel">Cancel</button>
            <button class="delete-confirm-delete">Delete</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle cancel button
    const cancelBtn = modal.querySelector('.delete-confirm-cancel');
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Handle delete button
    const deleteBtn = modal.querySelector('.delete-confirm-delete');
    deleteBtn.addEventListener('click', async () => {
      // Close the modal
      document.body.removeChild(modal);
      
      // Show loading state on the card
      cardElement.classList.add('deleting');
      cardElement.style.opacity = '0.5';
      
      try {
        // Call API to delete the entry
        await deleteHistoryEntry(entry);
        
        // Remove from local array too
        const entryIndex = historyData.findIndex(item => 
          item.date === entry.date && item.totalCalories === entry.totalCalories
        );
        
        if (entryIndex !== -1) {
          historyData.splice(entryIndex, 1);
          
          // Also remove from filtered data if present
          const filteredIndex = filteredData.findIndex(item => 
            item.date === entry.date && item.totalCalories === entry.totalCalories
          );
          
          if (filteredIndex !== -1) {
            filteredData.splice(filteredIndex, 1);
          }
          
          // Update the UI
          applyFiltersAndSort();
          
          // Update cached data
          localStorage.setItem('historyData', JSON.stringify({
            data: historyData,
            timestamp: Date.now()
          }));
          
          // Update home stats
          if (historyData.length > 0) {
            const totalMeals = historyData.length;
            const avgHealthScore = historyData.reduce((sum, entry) => sum + entry.healthScore, 0) / totalMeals;
            updateHomeStats(totalMeals, avgHealthScore.toFixed(1));
          } else {
            updateHomeStats(0, '--');
          }
          
          // Show success message
          showTooltip(document.querySelector('.mobile-header'), "Entry deleted successfully");
        }
      } catch (error) {
        console.error('Error deleting entry:', error);
        // Restore card appearance
        cardElement.classList.remove('deleting');
        cardElement.style.opacity = '1';
        // Show error message
        showTooltip(document.querySelector('.mobile-header'), "Failed to delete entry");
      }
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
  
  // Function to delete history entry via API
  async function deleteHistoryEntry(entry) {
    const formData = new FormData();
    formData.append('user_email', userEmail);
    formData.append('timestamp', entry.date);
    
    const response = await fetch(`${api_server}/delete-food-history`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }
    
    return response.json();
  }
  
  // Format date for display
  function formatDate(dateString) {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  }
  
  // Get health score color and icon
  function getHealthScoreDisplay(score) {
    let color, icon;
    
    if (score >= 8) {
      color = "var(--accent)";
      icon = "fas fa-heart";
    } else if (score >= 5) {
      color = "var(--primary)";
      icon = "fas fa-check-circle";
    } else {
      color = "var(--secondary)";
      icon = "fas fa-exclamation-circle";
    }
    
    return { color, icon };
  }
  
  // Create food items for history cards - improved function
  function createFoodItems(items) {
    return items.map(item => {
      // Create macro pills
      const macros = [
        { name: 'Carbs', value: `${Math.round(item.carbs)}g`, color: 'rgba(251, 146, 60, 0.1)', textColor: '#fb923c' },
        { name: 'Protein', value: `${Math.round(item.protein)}g`, color: 'rgba(93, 95, 239, 0.1)', textColor: 'var(--primary)' },
        { name: 'Fat', value: `${Math.round(item.fat)}g`, color: 'rgba(249, 115, 22, 0.1)', textColor: '#f97316' }
      ];
      
      const macroPills = macros.map(macro => 
        `<span class="history-food-macro" style="background-color: ${macro.color}; color: ${macro.textColor}">
          ${macro.name}: ${macro.value}
         </span>`
      ).join('');
      
      return `
        <div class="history-food-item">
          <div class="history-food-name">${item.name}</div>
          <div class="history-food-ingredients">${item.ingredients || 'No ingredients data'}</div>
          <div class="history-food-macros">
            ${macroPills}
          </div>
          <div class="calories-summary history-summary-item">
            <i class="fas fa-fire"></i>
            ${Math.round(item.calories)} cal
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Create pagination for history
  function createPagination(totalItems, container) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
      container.style.display = 'none';
      return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        applyFiltersAndSort();
      }
    });
    container.appendChild(prevBtn);
    
    // Page buttons
    const maxPageButtons = 3; // Show fewer page buttons on mobile
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        applyFiltersAndSort();
      });
      container.appendChild(pageBtn);
    }
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        applyFiltersAndSort();
      }
    });
    container.appendChild(nextBtn);
  }
  
  // Update home view stats
  function updateHomeStats(mealCount, avgHealth) {
    const mealCountEl = document.getElementById('mealCount');
    const avgHealthEl = document.getElementById('avgHealthScore');
    
    if (mealCountEl) mealCountEl.textContent = mealCount;
    if (avgHealthEl) avgHealthEl.textContent = avgHealth;
  }
  
  // Add event listeners for history filters
  const searchInput = document.getElementById('searchInput');
  const sortBySelect = document.getElementById('sortBy');
  const filterHealthScore = document.getElementById('filterHealthScore');
  
  if (searchInput) {
    searchInput.addEventListener('input', applyFiltersAndSort);
  }
  
  if (sortBySelect) {
    sortBySelect.addEventListener('change', applyFiltersAndSort);
  }
  
  if (filterHealthScore) {
    filterHealthScore.addEventListener('change', applyFiltersAndSort);
  }
  
  // Add refresh button event listener for history
  if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener('click', function() {
      loadHistoryData(true); // Pass true to show loading indicator
    });
  }
  
  // Initialize the app
  updateHomeStats('--', '--');
  
  // Load history data from cache initially (if available)
  const cachedHistoryData = localStorage.getItem('historyData');
  if (cachedHistoryData) {
    try {
      const cachedData = JSON.parse(cachedHistoryData);
      historyData = cachedData.data;
      
      // Update stats from cached data if we're on history view
      if (historyData && historyData.length > 0) {
        const totalMeals = historyData.length;
        const avgHealthScore = historyData.reduce((sum, entry) => sum + entry.healthScore, 0) / totalMeals;
        updateHomeStats(totalMeals, avgHealthScore.toFixed(1));
      }
    } catch (e) {
      console.error('Error parsing cached history data', e);
      
      // If error parsing cache, clear it
      localStorage.removeItem('historyData');
      
      // Load fresh data if we're viewing the history tab
      if (!document.getElementById('communityView').classList.contains('hidden')) {
        loadHistoryData();
      }
    }
  } else if (!document.getElementById('communityView').classList.contains('hidden')) {
    // Only load from API if we're viewing the history tab and no cache exists
    loadHistoryData();
  }
  
  // Initialize the dark mode toggle in settings when the page loads
  if (darkModeToggle) {
    darkModeToggle.checked = darkMode;
  }

  const viewTermsandPrivacy = document.getElementById('viewTermsandPrivacy');
  if (viewTermsandPrivacy) {
    viewTermsandPrivacy.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'termsandprivacy.html';
    });
  }

  // Terms and Privacy functionality
  function initializeTermsAndPrivacy() {
    const termsTabBtns = document.querySelectorAll('#termsView .tab-btn');
    const termsTabContents = document.querySelectorAll('#termsView .tab-content');
    
    termsTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        
        // Update active tab button
        termsTabBtns.forEach(tabBtn => {
          tabBtn.classList.remove('active');
        });
        btn.classList.add('active');
        
        // Show the relevant tab content
        termsTabContents.forEach(content => {
          content.style.display = 'none';
        });
        document.getElementById(`${tabName}-tab`).style.display = 'block';
        
        // Scroll to top of content
        document.querySelector('#termsView .mobile-content').scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    });
  }

  // Link to Terms and Privacy in profile view
  const viewTermsAndPrivacy = document.getElementById('viewTermsAndPrivacy');
  if (viewTermsAndPrivacy) {
    viewTermsAndPrivacy.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab('termsView');
    });
  }
  
  // Add Terms and Privacy link in settings page
  const viewTermsAndPrivacySettings = document.getElementById('viewTermsAndPrivacySettings');
  if (viewTermsAndPrivacySettings) {
    viewTermsAndPrivacySettings.addEventListener('click', function() {
      switchTab('termsView');
    });
  }

  // Initialize fullscreen toggle
  const fullscreenToggle = document.getElementById('fullscreenToggle');
  if (fullscreenToggle) {
    let fullscreenEnabled = localStorage.getItem('fullscreenEnabled') === 'true';
    fullscreenToggle.checked = fullscreenEnabled;
  }
  
  // Add-to-home-screen instructions
  const addToHomeScreenBtn = document.getElementById('addToHomeScreen');
  if (addToHomeScreenBtn) {
    addToHomeScreenBtn.addEventListener('click', function() {
      showAddToHomeScreenInstructions();
    });
  }
  
  function showAddToHomeScreenInstructions() {
    // Check if already in standalone mode
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                              (window.navigator.standalone) || 
                              document.referrer.includes('android-app://');
    
    if (isInStandaloneMode) {
      alert('You are already using the app in standalone mode!');
      return;
    }
    
    // Create modal for instructions
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions;
    let iconClass;
    
    if (isIOS) {
      instructions = `
        <h2>Add to iOS Home Screen</h2>
        <ol>
          <li>Tap the Share icon <i class="fas fa-share-square"></i> at the bottom of the screen</li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Tap "Add" in the top-right corner</li>
        </ol>
      `;
      iconClass = 'fa-apple';
    } else if (isAndroid) {
      instructions = `
        <h2>Add to Android Home Screen</h2>
        <ol>
          <li>Tap the menu icon <i class="fas fa-ellipsis-v"></i> in your browser</li>
          <li>Tap "Add to Home screen" or "Install app"</li>
          <li>Follow the on-screen instructions</li>
        </ol>
      `;
      iconClass = 'fa-android';
    } else {
      instructions = `
        <h2>Add to Home Screen</h2>
        <p>Open this website on your mobile device to add it to your home screen.</p>
      `;
      iconClass = 'fa-mobile-alt';
    }
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <i class="fab ${iconClass} modal-icon"></i>
          <button class="modal-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          ${instructions}
          <p>Once added, the app will open in fullscreen mode without browser controls!</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle close button
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', function() {
      document.body.removeChild(modal);
    });
    
    // Close when clicking outside the modal
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }
  
  // Initialize terms and privacy tab switching
  function initializeTermsAndPrivacy() {
    const termsTab = document.getElementById('termsTab');
    const privacyTab = document.getElementById('privacyTab');
    
    if (termsTab && privacyTab) {
      termsTab.addEventListener('click', function() {
        document.getElementById('terms-tab').style.display = 'block';
        document.getElementById('privacy-tab').style.display = 'none';
        termsTab.classList.add('active');
        privacyTab.classList.remove('active');
      });
      
      privacyTab.addEventListener('click', function() {
        document.getElementById('privacy-tab').style.display = 'block';
        document.getElementById('terms-tab').style.display = 'none';
        privacyTab.classList.add('active');
        termsTab.classList.remove('active');
      });
    }
  }
  
  // Exercise Wizard Functionality
  initializeExerciseWizard();
  
  // Other exercise-related event listeners
  const findExercisesBtn = document.getElementById('findExercisesBtn');
  if (findExercisesBtn) {
    findExercisesBtn.addEventListener('click', findExercises);
  }
  
  const exerciseSearchInput = document.getElementById('exerciseSearchInput');
  if (exerciseSearchInput) {
    exerciseSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        // Go to next step when Enter is pressed in the search box
        goToStep(2);
      }
    });
  }

  // Fetch and display sentiment (mood) on home page using /mood-breakdown
  async function fetchAndDisplaySentiment() {
    const sentimentSpan = document.getElementById('sentimentValue');
    if (!userEmail || !sentimentSpan) return;
    try {
      // Fetch mood breakdown for the user
      const res = await fetch(`${api_server}/mood-breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: userEmail })
      });
      if (!res.ok) throw new Error('Failed to fetch mood breakdown');
      const data = await res.json();
      const moodData = data.mood_data || [];
      if (moodData.length === 0) {
        sentimentSpan.textContent = '--';
        return;
      }
      // Get the latest mood (first entry)
      const latestMood = moodData[0].mood;
      sentimentSpan.textContent = latestMood || '--';
    } catch (err) {
      console.error('Error fetching mood:', err);
      sentimentSpan.textContent = '--';
    }
  }
  fetchAndDisplaySentiment();
});

function initializeExerciseWizard() {
  // Start search button
  const startSearchBtn = document.getElementById('startSearchBtn');
  if (startSearchBtn) {
    startSearchBtn.addEventListener('click', function() {
      goToStep(2);
    });
  }
  
  // Navigation buttons
  const wizardBtns = document.querySelectorAll('.wizard-btn');
  wizardBtns.forEach(btn => {
    if (btn.classList.contains('back') || btn.classList.contains('next')) {
      btn.addEventListener('click', function() {
        const step = parseInt(this.getAttribute('data-step'));
        goToStep(step);
      });
    }
  });
  
  // Exercise type selection
  const typeOptions = document.querySelectorAll('#typeOptions .option-item');
  typeOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Deselect all options
      typeOptions.forEach(opt => opt.classList.remove('selected'));
      // Select this option
      this.classList.add('selected');
      // Update hidden input
      document.getElementById('exerciseType').value = this.getAttribute('data-value');
    });
  });
  
  // Muscle selection
  const muscleOptions = document.querySelectorAll('.muscle-option');
  muscleOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Deselect all options
      muscleOptions.forEach(opt => opt.classList.remove('selected'));
      // Select this option
      this.classList.add('selected');
      // Update hidden input
      document.getElementById('exerciseMuscle').value = this.getAttribute('data-value');
    });
  });
  
  // Difficulty selection
  const difficultyOptions = document.querySelectorAll('.difficulty-option');
  difficultyOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Deselect all options
      difficultyOptions.forEach(opt => opt.classList.remove('selected'));
      // Select this option
      this.classList.add('selected');
      // Update hidden input
      document.getElementById('exerciseDifficulty').value = this.getAttribute('data-value');
    });
  });
}

function goToStep(stepNumber) {
  // Hide all steps
  const steps = document.querySelectorAll('.wizard-step');
  steps.forEach(step => {
    step.classList.remove('active');
  });
  
  // Show the requested step
  const targetStep = document.getElementById(`step-${stepNumber}`);
  if (targetStep) {
    targetStep.classList.add('active');
  }
  
  // If going to step 1, reset the search input
  if (stepNumber === 1) {
    const searchInput = document.getElementById('exerciseSearchInput');
    if (searchInput) {
      // Focus on the search input after a brief delay to allow the animation
      setTimeout(() => {
        searchInput.focus();
      }, 300);
    }
  }
}

// Updated findExercises function to work with wizard UI
async function findExercises() {
  // Get values from hidden inputs and search input
  const exerciseType = document.getElementById('exerciseType').value;
  const muscle = document.getElementById('exerciseMuscle').value;
  const difficulty = document.getElementById('exerciseDifficulty').value;
  const name = document.getElementById('exerciseSearchInput').value;
  
  const resultsContainer = document.getElementById('exerciseResults');
  const loadingIndicator = document.getElementById('exerciseLoading');
  const emptyResults = document.getElementById('emptyExercises');
  const exerciseWizard = document.querySelector('.exercise-wizard');
  
  // Clear previous results
  resultsContainer.innerHTML = '';
  resultsContainer.style.display = 'none';
  emptyResults.style.display = 'none';
  loadingIndicator.style.display = 'flex';
  
  // Animate wizard collapse
  exerciseWizard.style.height = exerciseWizard.offsetHeight + 'px';
  exerciseWizard.style.overflow = 'hidden';
  
  // Transition to collapsed state
  setTimeout(() => {
    exerciseWizard.style.height = '60px';
    exerciseWizard.style.transition = 'height 0.3s ease';
  }, 10);
  
  try {
    // Prepare form data
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (exerciseType) formData.append('type', exerciseType);
    if (muscle) formData.append('muscle', muscle);
    if (difficulty) formData.append('difficulty', difficulty);
    
    api_server = 'http://127.0.0.1:8000'
    // Call the API with the correct server URL
    const response = await fetch(`${api_server}/exercises`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Hide loading indicator
    loadingIndicator.style.display = 'none';
    
    // Add expand button to wizard header
    exerciseWizard.innerHTML = `
      <div class="collapsed-header">
        <div class="search-summary">
          <span>${name ? `"${name}"` : 'All exercises'}</span>
          ${exerciseType ? `<span class="filter-tag">${formatExerciseType(exerciseType)}</span>` : ''}
          ${muscle ? `<span class="filter-tag">${formatMuscle(muscle)}</span>` : ''}
          ${difficulty ? `<span class="filter-tag">${capitalizeFirstLetter(difficulty)}</span>` : ''}
        </div>
        <button class="expand-wizard-btn">
          <i class="fas fa-edit"></i>
        </button>
      </div>
    `;
    
    // Add event listener to expand button
    const expandBtn = exerciseWizard.querySelector('.expand-wizard-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', function() {
        // Reload the entire exercise finder
        location.reload();
      });
    }
    
    // Display results
    if (data.exercises && data.exercises.length > 0) {
      displayExercises(data.exercises, resultsContainer);
      resultsContainer.style.display = 'flex';
    } else {
      emptyResults.style.display = 'block';
    }
    
  } catch (error) {
    console.error('Error fetching exercises:', error);
    loadingIndicator.style.display = 'none';
    emptyResults.style.display = 'block';
    
    // Show error notification
    showNotification('Error fetching exercises. Please try again.');
  }
}

// Fix for "formatExerciseType is not defined" error
function formatExerciseType(type) {
  return type.split('_').map(capitalizeFirstLetter).join(' ');
}

function formatMuscle(muscle) {
  return muscle.split('_').map(capitalizeFirstLetter).join(' ');
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Fix for "showNotification is not defined" error
function showNotification(message) {
  const tooltip = document.getElementById('tooltip');
  if (tooltip) {
    tooltip.textContent = message;
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
    tooltip.style.bottom = '80px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    
    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => {
        tooltip.style.visibility = 'hidden';
      }, 300);
    }, 3000);
  } else {
    // Fallback to alert if tooltip element doesn't exist
    console.error(message);
    alert(message);
  }
}

function displayExercises(exercises, container) {
  exercises.forEach(exercise => {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    
    // Format difficulty badge
    const difficultyClass = `badge-${exercise.difficulty}`;
    
    // Format the exercise name for better display
    const formattedName = exercise.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Create the exercise card HTML with improved structure
    card.innerHTML = `
      <div class="exercise-header">
        <h3 class="exercise-title">${formattedName}</h3>
        <span class="exercise-badge ${difficultyClass}">${capitalizeFirstLetter(exercise.difficulty)}</span>
      </div>
      
      <div class="exercise-details">
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${formatExerciseType(exercise.type)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Muscle:</span>
          <span class="detail-value">${formatMuscle(exercise.muscle)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Equipment:</span>
          <span class="detail-value">${exercise.equipment || 'Bodyweight'}</span>
        </div>
      </div>
      
      <div class="exercise-instructions" style="display: none;">
        <h4 class="exercise-instructions-title">Instructions:</h4>
        <p>${exercise.instructions}</p>
      </div>
      
      <button class="toggle-instructions">
        <i class="fas fa-chevron-down"></i> Show Instructions
      </button>
    `;
    
    container.appendChild(card);
    
    // Add event listener to toggle instructions
    const toggleBtn = card.querySelector('.toggle-instructions');
    const instructions = card.querySelector('.exercise-instructions');
    
    toggleBtn.addEventListener('click', function() {
      const isVisible = instructions.style.display !== 'none';
      instructions.style.display = isVisible ? 'none' : 'block';
      toggleBtn.innerHTML = isVisible ? 
        '<i class="fas fa-chevron-down"></i> Show Instructions' : 
        '<i class="fas fa-chevron-up"></i> Hide Instructions';
    });
  });
}

// Add these styles dynamically
const style = document.createElement('style');
style.textContent = `
  .collapsed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
    color: white;
    border-radius: 10px;
  }
  
  .search-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    font-size: 14px;
    max-width: calc(100% - 40px);
  }
  
  .filter-tag {
    background: rgba(255,255,255,0.2);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
  }
  
  .expand-wizard-btn {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
`;
document.head.appendChild(style);

// Nutrition Style Functionality
document.addEventListener('DOMContentLoaded', function() {
  const refreshBtn = document.getElementById('refreshNutritionStyle');
  const nutritionStyleMeter = document.getElementById('nutritionStyleMeter');
  const nutritionStyleLabel = document.getElementById('nutritionStyleLabel');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', updateNutritionStyle);
  }
  
  // Helper function to get the user email from storage - moved here to be in scope
  function getUserEmail() {
    return localStorage.getItem('userEmail');
  }
  
  async function updateNutritionStyle() {
    // Skip if no user is logged in
    if (!getUserEmail()) {
      nutritionStyleLabel.textContent = 'Please log in to see your style';
      return;
    }
    
    // Show loading state
    refreshBtn.classList.add('loading');
    nutritionStyleLabel.textContent = 'Analyzing your data...';
    
    try {
      // Get user's food history data
      const foodHistory = await fetchFoodHistory();
      
      if (!foodHistory || !foodHistory.food_history || foodHistory.food_history.length === 0) {
        nutritionStyleLabel.textContent = 'Add meals to see your style';
        nutritionStyleMeter.style.width = '0%';
        refreshBtn.classList.remove('loading');
        return;
      }
      
      // Calculate nutrition style
      const styleData = calculateNutritionStyle(foodHistory.food_history);
      
      // Update the meter
      nutritionStyleMeter.style.width = styleData.percentage + '%';
      nutritionStyleLabel.textContent = styleData.label;
      
      // Store the result locally to avoid repeated calculations
      localStorage.setItem('nutritionStyleData', JSON.stringify({
        label: styleData.label,
        percentage: styleData.percentage,
        timestamp: Date.now()
      }));
      
    } catch (error) {
      console.error('Error updating nutrition style:', error);
      nutritionStyleLabel.textContent = 'Could not analyze style';
    } finally {
      refreshBtn.classList.remove('loading');
    }
  }
  
  // Fetch user's food history data
  async function fetchFoodHistory() {
    const userEmail = getUserEmail();
    const api_server = 'http://127.0.0.1:8000';
    
    if (!userEmail) return null;
    
    const formData = new FormData();
    formData.append('user_email', userEmail);
    
    const response = await fetch(`${api_server}/food-history`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch food history');
    }
    
    return await response.json();
  }
  
  // Calculate nutrition style based on food history
  function calculateNutritionStyle(foodHistory) {
    // Skip if no history
    if (!foodHistory || foodHistory.length === 0) {
      return { label: 'Add meals to see your style', percentage: 0 };
    }
    
    // Calculate average health score
    let totalScore = 0;
    let healthyMeals = 0;
    let balancedMeals = 0;
    let indulgentMeals = 0;
    
    foodHistory.forEach(meal => {
      const score = meal.overall_health_score || 0;
      totalScore += score;
      
      if (score >= 8) {
        healthyMeals++;
      } else if (score >= 5) {
        balancedMeals++;
      } else {
        indulgentMeals++;
      }
    });
    
    const avgScore = totalScore / foodHistory.length;
    
    // Determine the dominant style
    let label;
    let percentage;
    
    if (healthyMeals > balancedMeals && healthyMeals > indulgentMeals) {
      label = 'Nutrition Enthusiast';
      percentage = Math.min(100, Math.max(0, avgScore * 10));
    } else if (indulgentMeals > healthyMeals && indulgentMeals > balancedMeals) {
      label = 'Comfort Food Lover';
      percentage = Math.min(100, Math.max(0, avgScore * 10));
    } else {
      label = 'Balanced Eater';
      percentage = Math.min(100, Math.max(0, avgScore * 10));
    }
    
    // Handle special cases
    if (foodHistory.length < 3) {
      label += ' (Limited Data)';
    }
    
    return { label, percentage };
  }
  
  // Check if we have a cached result (for display only, user still needs to click to update)
  function loadCachedNutritionStyle() {
    const cachedData = localStorage.getItem('nutritionStyleData');
    
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        // Only use cached data if it's less than a day old
        if (now - data.timestamp < oneDay) {
          nutritionStyleMeter.style.width = data.percentage + '%';
          nutritionStyleLabel.textContent = data.label;
          return true;
        }
      } catch (e) {
        console.error('Error parsing cached nutrition style data', e);
      }
    }
    
    return false;
  }
  
  // Try to load cached data on page load
  loadCachedNutritionStyle();
});

// Remove old scanView logic and update navigation for new Record tab
// Update quick actions to use new Record tab
const quickActions = document.querySelectorAll('.action-btn');
quickActions.forEach(btn => {
  btn.addEventListener('click', function() {
    const view = this.getAttribute('onclick');
    if (view && view.includes('scanView')) {
      // Now open the Activity section and scroll to Scan Food
      document.querySelector('[data-view="activityView"]').click();
      setTimeout(() => {
        const scanFoodSection = document.querySelector('.activity-section .section-title h3');
        if (scanFoodSection && scanFoodSection.textContent.includes('Scan Food')) {
          scanFoodSection.scrollIntoView({behavior: 'smooth', block: 'center'});
        }
      }, 300);
    }
  });
});

// Voice Transcription UI logic for Record tab
const startTranscriptionBtn = document.getElementById('startTranscriptionBtn');
const stopTranscriptionBtn = document.getElementById('stopTranscriptionBtn');
const transcriptionStatus = document.getElementById('transcriptionStatus');
const transcriptionResult = document.getElementById('transcriptionResult');
const transcriptionActions = document.getElementById('transcriptionActions');
const saveTranscriptionBtn = document.getElementById('saveTranscriptionBtn');
const discardTranscriptionBtn = document.getElementById('discardTranscriptionBtn');

let recognition;
let isRecording = false;
let finalTranscript = '';

if (startTranscriptionBtn && stopTranscriptionBtn) {
  startTranscriptionBtn.addEventListener('click', () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    finalTranscript = '';
    transcriptionResult.style.display = 'block';
    transcriptionResult.innerHTML = '';
    transcriptionStatus.style.display = 'block';
    transcriptionActions.style.display = 'none';
    startTranscriptionBtn.style.display = 'none';
    stopTranscriptionBtn.style.display = 'inline-block';
    isRecording = true;
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      transcriptionResult.innerHTML = `<div style='min-height: 100px;'>${finalTranscript}<span style='color:#999;'>${interim}</span></div>`;
    };
    recognition.onend = () => {
      isRecording = false;
      transcriptionStatus.style.display = 'none';
      transcriptionActions.style.display = 'block';
      stopTranscriptionBtn.style.display = 'none';
      startTranscriptionBtn.style.display = 'inline-block';
    };
    recognition.onerror = (event) => {
      isRecording = false;
      transcriptionStatus.style.display = 'none';
      transcriptionActions.style.display = 'block';
      stopTranscriptionBtn.style.display = 'none';
      startTranscriptionBtn.style.display = 'inline-block';
      alert('Speech recognition error: ' + event.error);
    };
    recognition.start();
  });
  stopTranscriptionBtn.addEventListener('click', () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
  });
}

if (saveTranscriptionBtn) {
  saveTranscriptionBtn.addEventListener('click', async () => {
    if (!finalTranscript.trim()) {
      alert('No transcript to save.');
      return;
    }

    userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      alert('Please log in to save your journal entry.');
      return;
    }
    saveTranscriptionBtn.disabled = true;
    saveTranscriptionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      const formData = new FormData();
      formData.append('user_email', userEmail);
      formData.append('transcript', finalTranscript.trim());
      formData.append('timestamp', new Date().toISOString());
      const response = await fetch('http://127.0.0.1:8000/transcribe', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to save transcript');
      }
      const data = await response.json();
      transcriptionResult.innerHTML = `<div class='journal-entry'><h3>Your Journal Entry</h3><p>${finalTranscript}</p></div><div class='analysis'><h4>AI Analysis</h4><pre>${JSON.stringify(data, null, 2)}</pre></div>`;
      transcriptionActions.style.display = 'none';
      saveTranscriptionBtn.disabled = false;
      saveTranscriptionBtn.innerHTML = '<i class="fas fa-save"></i> Save Entry';
    } catch (error) {
      alert('Error saving transcript: ' + error.message);
      saveTranscriptionBtn.disabled = false;
      saveTranscriptionBtn.innerHTML = '<i class="fas fa-save"></i> Save Entry';
    }
  });
}
if (discardTranscriptionBtn) {
  discardTranscriptionBtn.addEventListener('click', () => {
    transcriptionResult.innerHTML = '';
    transcriptionActions.style.display = 'none';
    finalTranscript = '';
  });
}

// Add event listener for new View Food History button in Scan Food section
const viewFoodHistoryBtn = document.getElementById('viewFoodHistoryBtn');
if (viewFoodHistoryBtn) {
  viewFoodHistoryBtn.addEventListener('click', function() {
    // Switch to the Food History (communityView) section
    document.querySelector('[data-view="communityView"]').click();
  });
}

// --- AI Chat Section Logic ---
const aiChatForm = document.getElementById('aiChatForm');
const aiChatInput = document.getElementById('aiChatInput');
const aiChatMessages = document.getElementById('aiChatMessages');
let aiChatHistory = [];
api_server = 'http://127.0.0.1:8000';

function renderAIChatMessages() {
  aiChatMessages.innerHTML = '';
  aiChatHistory.forEach(msg => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-chat-msg ' + (msg.role === 'user' ? 'ai-chat-user' : 'ai-chat-ai');
    msgDiv.innerHTML = `
      <div class="ai-chat-bubble" style="background:${msg.role==='user' ? 'rgba(52,211,153,0.13)' : 'rgba(93,95,239,0.13)'};color:#fff;align-self:${msg.role==='user' ? 'flex-end' : 'flex-start'};">
        ${msg.content}
      </div>
    `;
    aiChatMessages.appendChild(msgDiv);
  });
  // Scroll to bottom
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}

async function sendAIMessage(question) {
  // Add user message
  aiChatHistory.push({ role: 'user', content: question });
  renderAIChatMessages();
  // Add loading state for AI
  aiChatHistory.push({ role: 'ai', content: '<span class="ai-chat-loading">...</span>' });
  renderAIChatMessages();
  try {
    const response = await fetch(`${api_server}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if (!response.ok) throw new Error('AI failed to respond.');
    const data = await response.json();
    // Replace loading with real response
    aiChatHistory.pop();
    aiChatHistory.push({ role: 'ai', content: data.response ? data.response : 'Sorry, I could not answer that.' });
    renderAIChatMessages();
  } catch (err) {
    aiChatHistory.pop();
    aiChatHistory.push({ role: 'ai', content: '<span style="color:#F56565">Error: ' + err.message + '</span>' });
    renderAIChatMessages();
  }
}

if (aiChatForm && aiChatInput && aiChatMessages) {
  aiChatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const question = aiChatInput.value.trim();
    if (!question) return;
    aiChatInput.value = '';
    sendAIMessage(question);
  });
}

// --- AI Chat Speech-to-Text Logic ---
const aiMicBtn = document.getElementById('aiMicBtn');
let aiRecognition = null;
let aiIsListening = false;

if (aiMicBtn && aiChatInput) {
  aiMicBtn.addEventListener('click', function() {
    if (aiIsListening) {
      if (aiRecognition) aiRecognition.stop();
      return;
    }
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    aiRecognition = new SpeechRecognition();
    aiRecognition.continuous = false;
    aiRecognition.interimResults = true;
    aiRecognition.lang = 'en-US';
    aiIsListening = true;
    aiMicBtn.classList.add('active');
    aiChatInput.placeholder = 'Listening...';
    let interim = '';
    aiRecognition.onresult = (event) => {
      interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      aiChatInput.value = (aiChatInput.value ? aiChatInput.value + ' ' : '') + final + interim;
    };
    aiRecognition.onend = () => {
      aiIsListening = false;
      aiMicBtn.classList.remove('active');
      aiChatInput.placeholder = 'Type your question...';
    };
    aiRecognition.onerror = (event) => {
      aiIsListening = false;
      aiMicBtn.classList.remove('active');
      aiChatInput.placeholder = 'Type your question...';
      alert('Speech recognition error: ' + event.error);
    };
    aiRecognition.start();
  });
}

// Dynamic Nutritional Tips
const nutritionalTips = [
  {
    icon: '<i class="fas fa-leaf"></i>',
    title: 'Balanced Diet',
    text: 'Include a variety of fruits, vegetables, lean proteins, and whole grains in your meals.'
  },
  {
    icon: '<i class="fas fa-tint"></i>',
    title: 'Stay Hydrated',
    text: 'Drink plenty of water throughout the day to support digestion and overall health.'
  },
  {
    icon: '<i class="fas fa-apple-alt"></i>',
    title: 'Fruits & Veggies',
    text: 'Aim for at least 5 servings of fruits and vegetables daily for essential vitamins and minerals.'
  },
  {
    icon: '<i class="fas fa-bread-slice"></i>',
    title: 'Whole Grains',
    text: 'Choose whole grain options like brown rice, oats, and whole wheat bread for more fiber.'
  },
  {
    icon: '<i class="fas fa-fish"></i>',
    title: 'Healthy Fats',
    text: 'Incorporate healthy fats from sources like fish, nuts, seeds, and olive oil.'
  },
  {
    icon: '<i class="fas fa-stopwatch"></i>',
    title: 'Mindful Eating',
    text: 'Eat slowly and pay attention to hunger cues to avoid overeating.'
  },
  {
    icon: '<i class="fas fa-utensils"></i>',
    title: 'Portion Control',
    text: 'Be mindful of portion sizes, especially with high-calorie foods.'
  },
  {
    icon: '<i class="fas fa-ice-cream"></i>',
    title: 'Limit Added Sugar',
    text: 'Reduce intake of sugary drinks and snacks for better energy and mood.'
  }
];

let currentTip = 0;

function renderTip(index) {
  const tip = nutritionalTips[index];
  document.getElementById('tipIcon').innerHTML = tip.icon;
  document.getElementById('tipTitle').textContent = tip.title;
  document.getElementById('tipText').textContent = tip.text;
  // Update indicator
  const indicator = document.getElementById('tipIndicator');
  indicator.innerHTML = nutritionalTips.map((_, i) => `<span class="${i === index ? 'active' : ''}"></span>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Nutritional Tips Carousel
  renderTip(currentTip);
  // Auto-scroll tips every 5 seconds
  setInterval(() => {
    currentTip = (currentTip + 1) % nutritionalTips.length;
    renderTip(currentTip);
  }, 5000);
});

// --- Journal Section Functionality ---
const recordJournalBtn = document.getElementById('recordJournalBtn');
const logJournalBtn = document.getElementById('logJournalBtn');
const viewJournalHistoryBtn = document.getElementById('viewJournalHistoryBtn');
const voiceJournalSection = document.getElementById('voiceJournalSection');
const logJournalContainer = document.getElementById('logJournalContainer');
const submitJournalLog = document.getElementById('submitJournalLog');
const cancelJournalLog = document.getElementById('cancelJournalLog');
const journalDescription = document.getElementById('journalDescription');

if (recordJournalBtn) {
  recordJournalBtn.addEventListener('click', () => {
    // Show voice journal UI, hide manual
    if (voiceJournalSection) voiceJournalSection.style.display = 'block';
    if (logJournalContainer) logJournalContainer.style.display = 'none';
  });
}
if (logJournalBtn) {
  logJournalBtn.addEventListener('click', () => {
    // Show manual journal UI, hide voice
    if (voiceJournalSection) voiceJournalSection.style.display = 'none';
    if (logJournalContainer) logJournalContainer.style.display = 'block';
  });
}
if (cancelJournalLog) {
  cancelJournalLog.addEventListener('click', () => {
    if (logJournalContainer) logJournalContainer.style.display = 'none';
    if (journalDescription) journalDescription.value = '';
  });
}
if (submitJournalLog) {
  submitJournalLog.addEventListener('click', async () => {
    const text = journalDescription.value.trim();
    if (!text) {
      alert('Please write something in your journal entry.');
      return;
    }
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      alert('Please log in to save your journal entry.');
      return;
    }
    submitJournalLog.disabled = true;
    submitJournalLog.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      const formData = new FormData();
      formData.append('user_email', userEmail);
      formData.append('transcript', text);
      formData.append('timestamp', new Date().toISOString());
      const response = await fetch('http://127.0.0.1:8000/transcribe', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to save journal entry');
      const data = await response.json();
      alert('Journal entry saved!');
      logJournalContainer.style.display = 'none';
      journalDescription.value = '';
      // Optionally show analysis result
      // You can display data in a modal or below the form
    } catch (err) {
      alert('Error saving journal entry: ' + err.message);
    } finally {
      submitJournalLog.disabled = false;
      submitJournalLog.innerHTML = '<i class="fas fa-check"></i> Save Journal';
    }
  });
}

//if (viewJournalHistoryBtn) {
//  viewJournalHistoryBtn.addEventListener('click', function() {
//    // For now, reuse the communityView for journal history, or implement a new view
//    // Here, we switch to communityView and could filter for journal entries
//    document.querySelector('[data-view="communityView"]').click();
//    // Optionally, trigger a filter for journal entries only
//  });
//}

// --- Journal History Section Logic ---
const journalHistorySection = document.getElementById('journalHistorySection');
const journalHistoryContainer = document.getElementById('journalHistoryContainer');
const viewJournalHistoryBtn2 = document.getElementById('viewJournalHistoryBtn');
const closeJournalHistoryBtn = document.getElementById('closeJournalHistoryBtn');
const emptyJournalHistory = document.getElementById('emptyJournalHistory');

function showJournalHistory() {
  if (journalHistorySection) journalHistorySection.style.display = 'block';
  // Hide other sections for clarity
  if (voiceJournalSection) voiceJournalSection.style.display = 'none';
  if (logJournalContainer) logJournalContainer.style.display = 'none';
  loadJournalHistory();
}
function hideJournalHistory() {
  if (journalHistorySection) journalHistorySection.style.display = 'none';
}
if (viewJournalHistoryBtn2) {
  viewJournalHistoryBtn2.addEventListener('click', showJournalHistory);
}
if (closeJournalHistoryBtn) {
  closeJournalHistoryBtn.addEventListener('click', hideJournalHistory);
}
async function loadJournalHistory() {
  if (!journalHistoryContainer) return;
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    journalHistoryContainer.innerHTML = '<div style="color:#888;text-align:center;padding:18px 0;">Please log in to view your journal history.</div>';
    return;
  }
  journalHistoryContainer.innerHTML = '<div style="text-align:center;padding:18px 0;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  try {
    const response = await fetch(`http://127.0.0.1:8000/history?user_email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) throw new Error('Failed to fetch journal history');
    const data = await response.json();
    const entries = data.entries || [];
    if (entries.length === 0) {
      if (emptyJournalHistory) emptyJournalHistory.style.display = 'block';
      journalHistoryContainer.innerHTML = '';
      journalHistoryContainer.appendChild(emptyJournalHistory);
      return;
    } else {
      if (emptyJournalHistory) emptyJournalHistory.style.display = 'none';
    }
    // Render entries
    journalHistoryContainer.innerHTML = entries.map(entry => `
      <div class="journal-history-entry" style="background:#fff;border-radius:8px;padding:10px 12px;margin-bottom:10px;box-shadow:0 1px 4px 0 rgba(93,95,239,0.04);">
        <div style="font-size:0.98em;color:#333;margin-bottom:4px;white-space:pre-line;">${escapeHTML(entry.transcript)}</div>
        <div style="font-size:0.92em;color:#888;">${formatJournalDate(entry.timestamp)}</div>
      </div>
    `).join('');
  } catch (err) {
    journalHistoryContainer.innerHTML = '<div style="color:#F56565;text-align:center;padding:18px 0;">Error loading journal history.</div>';
  }
}
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, function(tag) {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return charsToReplace[tag] || tag;
  });
}
function formatJournalDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleString();
}