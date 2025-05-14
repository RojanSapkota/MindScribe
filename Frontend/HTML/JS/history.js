// State variables
let historyData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 5;
let darkMode = localStorage.getItem('darkMode') === 'true';
const api_server = 'https://hackclubapi.rojansapkota.com.np/';

// DOM Elements (defined globally to be accessible to all functions)
let historyContainer;
let emptyHistory;
let searchInput;
let sortBySelect;
let filterHealthScore;
let paginationContainer;
let progressBar;
let themeSwitch;

async function loadHistoryData() {
  try {
    // Get user email from localStorage or session storage
    const userEmail = localStorage.getItem('userEmail');
    
    if (!userEmail) {
      alert('Please log in to access this page.');
      window.location.href = 'login.html';
      return;
    }
    
    // Show loading state
    historyContainer.innerHTML = '<div class="loading">Loading your food history...</div>';
    emptyHistory.style.display = 'none';
    
    // Create FormData for the request
    const formData = new FormData();
    formData.append('user_email', userEmail);
  
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
      historyContainer.innerHTML = '';
      emptyHistory.style.display = 'block';
      paginationContainer.style.display = 'none';
      return;
    }
    
    // Transform API data to match expected frontend format
    historyData = data.food_history.map(entry => {
      return {
        date: entry.timestamp, // API returns timestamp instead of date
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
    
    
    // Apply initial filters and sorting
    applyFiltersAndSort();
    
  } catch (error) {
    console.error('Error loading history data:', error);
    historyContainer.innerHTML = '';
    emptyHistory.style.display = 'block';
    emptyHistory.innerHTML = `
      <div class="empty-history-content">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error loading history</h3>
        <p>We couldn't load your food history. Please try again later.</p>
      </div>
    `;
    paginationContainer.style.display = 'none';
  }
}

// Apply filters and sorting
function applyFiltersAndSort() {
  // Get search text
  const searchText = searchInput.value.toLowerCase().trim();
  
  // Debug the filter value
  //console.log("Filter health score value:", filterHealthScore.value);

  // Apply both health score filter and search text filter
  filteredData = historyData.filter(entry => {
    // Health score filter - ensure proper numeric comparison
    const healthScoreValue = parseFloat(entry.healthScore);
    const filterValue = filterHealthScore.value === "all" ? 0 : parseFloat(filterHealthScore.value);
    
    // Debug values to see what's being compared
    //console.log(`Entry health score: ${healthScoreValue}, Filter value: ${filterValue}`);
    
    const matchesHealthScore = filterHealthScore.value === "all" || healthScoreValue >= filterValue;
    
    // Search text filter - check if any food item name matches the search
    const matchesSearch = searchText === '' || 
                         entry.items.some(item => 
                           item.name.toLowerCase().includes(searchText) ||
                           (item.ingredients && item.ingredients.toLowerCase().includes(searchText))
                         );
    
    // Return true only if both filters match
    return matchesHealthScore && matchesSearch;
  });

  // Rest of your function remains unchanged...
  
  // Apply sorting
  const sortBy = sortBySelect.value;
  
  if (sortBy === 'date-newest' || sortBy === 'date-desc') {
    filteredData.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortBy === 'date-oldest' || sortBy === 'date-asc') {
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

// Helper function to parse nutrient values
function parseNutrient(value) {
  if (typeof value === 'string') {
    const match = value.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  }
  return parseFloat(value) || 0;
}

// Display error message to user
function showError(message) {
  // Create or update error element
  let errorElement = document.getElementById('errorMessage');
  
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = 'errorMessage';
    errorElement.className = 'error-message';
    
    // Insert after history header
    const historyHeader = document.querySelector('.history-header');
    historyHeader.insertAdjacentElement('afterend', errorElement);
  }
  
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 5000);
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

// Create history cards
function createHistoryCards(data) {
  
  if (data.length === 0) {
    historyContainer.innerHTML = '';
    emptyHistory.style.display = 'block';
    emptyHistory.innerHTML = `
      <div class="empty-history-content">
        <i class="fas fa-utensils"></i>
        <h3>No food history yet</h3>
        <p>Take a picture of your meal to start tracking your nutrition!</p>
      </div>
    `;
    paginationContainer.style.display = 'none';
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
    card.innerHTML = `
      <div class="history-card-header">
        <div>
          <div class="history-date">${date}</div>
          <div class="history-time">${time}</div>
        </div>
        <div class="history-summary">
          <div class="history-summary-item calories-summary">
            <i class="fas fa-fire"></i>
            ${entry.totalCalories} cal
          </div>
          <div class="history-summary-item health-summary" style="color: ${healthDisplay.color}">
            <i class="${healthDisplay.icon}"></i>
            ${entry.healthScore}/10
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
  });
  
  // Create pagination
  createPagination(data.length);
}

// Create food items for each history card
function createFoodItems(items) {
  return items.map(item => {
    // Create macro pills
    const macros = [
      { name: 'Carbs', value: `${item.carbs}g`, color: 'rgba(251, 146, 60, 0.1)', textColor: '#fb923c' },
      { name: 'Protein', value: `${item.protein}g`, color: 'rgba(93, 95, 239, 0.1)', textColor: 'var(--primary)' },
      { name: 'Fat', value: `${item.fat}g`, color: 'rgba(249, 115, 22, 0.1)', textColor: '#f97316' }
    ];
    
    const macroPills = macros.map(macro => 
      `<span class="history-food-macro" style="background-color: ${macro.color}; color: ${macro.textColor}">
        ${macro.name}: ${macro.value}
       </span>`
    ).join('');
    
    return `
      <div class="history-food-item">
        <div>
          <div class="history-food-name">${item.name}</div>
          <div class="history-food-ingredients">${item.ingredients || 'No ingredients data'}</div>
          <div class="history-food-macros">
            ${macroPills}
          </div>
        </div>
        <div class="calories-summary history-summary-item">
          <i class="fas fa-fire"></i>
          ${item.calories} cal
        </div>
      </div>
    `;
  }).join('');
}

// Create pagination
function createPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) {
    paginationContainer.style.display = 'none';
    return;
  }
  
  paginationContainer.style.display = 'flex';
  paginationContainer.innerHTML = '';
  
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
  paginationContainer.appendChild(prevBtn);
  
  // Page buttons
  const maxPageButtons = 5;
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
    paginationContainer.appendChild(pageBtn);
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
  paginationContainer.appendChild(nextBtn);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  // Initialize DOM Elements
  historyContainer = document.getElementById('historyContainer');
  emptyHistory = document.getElementById('emptyHistory');
  searchInput = document.getElementById('searchInput');
  sortBySelect = document.getElementById('sortBy');
  filterHealthScore = document.getElementById('filterHealthScore');
  paginationContainer = document.getElementById('pagination');
  progressBar = document.getElementById('progressBar');
  themeSwitch = document.getElementById('themeSwitch');
  
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
  
  // Event listeners for sorting and filtering
  searchInput.addEventListener('input', () => {
    applyFiltersAndSort();
  });

  sortBySelect.addEventListener('change', () => {
    applyFiltersAndSort();
  });

  filterHealthScore.addEventListener('input', () => {
    applyFiltersAndSort();
  });

  // Load the history data when the page is ready
  loadHistoryData();
});