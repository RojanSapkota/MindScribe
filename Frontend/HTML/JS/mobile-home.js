// Set up API base URL - defined at top level so it's accessible to all scripts
const API_BASE_URL = 'https://mindscribe.rojan.hackclub.app/';

// Variables and DOM elements
const thoughts = [
  "You are stronger than you think. Every day is a new beginning.",
  "Progress, not perfection. Celebrate small wins.",
  "Your feelings are valid. Take time for yourself.",
  "Growth is a journey, not a race.",
  "Let go of what you can't control. Focus on what you can.",
  "You are enough, just as you are.",
  "Breathe. This moment is yours.",
  "Kindness to yourself is never wasted.",
  "Difficult roads often lead to beautiful destinations.",
  "Your story matters. Keep writing it.",
  "Small steps still move you forward.",
  "Embrace the journey, not just the destination.",
  "Every day brings a new opportunity to grow.",
  "The present moment is your most precious possession.",
  "You've overcome difficult challenges before. You can do it again."
];

const thoughtText = document.getElementById('thoughtText');
const refreshBtn = document.getElementById('refreshBtn');
const newEntryBtn = document.getElementById('newEntryBtn');
let lastScrollTop = 0;
let navHidden = false;
const bottomNav = document.querySelector('.bottom-nav');

// Loader functionality
const loaderContainer = document.getElementById('loaderContainer');

// Show loader function
function showLoader(message = 'Loading your thoughts...') {
  document.querySelector('.loader-text').textContent = message;
  loaderContainer.classList.add('active');
}

// Hide loader function
function hideLoader() {
  loaderContainer.classList.remove('active');
}

// Show loader on initial page load
showLoader();

// Hide loader after everything is loaded
window.addEventListener('load', () => {
  setTimeout(() => {
    hideLoader();
  }, 800);
});

// Animate thought card on refresh with improved animation
refreshBtn.addEventListener('click', () => {
  // Add spinning class to button for animation
  refreshBtn.classList.add('spinning');
  
  setTimeout(() => {
    let idx = Math.floor(Math.random() * thoughts.length);
    // Ensure we don't repeat the same thought
    if (thoughtText.textContent === thoughts[idx]) {
      idx = (idx + 1) % thoughts.length;
    }
    thoughtText.textContent = thoughts[idx];
    const card = document.getElementById('thoughtCard');
    
    // Apply animation
    card.style.animation = 'none';
    void card.offsetWidth; // Trigger reflow
    card.style.animation = 'fadeIn 0.7s';
    
    // Add highlight effect temporarily
    card.classList.add('highlighted');
    setTimeout(() => {
      card.classList.remove('highlighted');
      refreshBtn.classList.remove('spinning');
    }, 1500);
  }, 300);
});

// Handle theme switching in personalization
document.querySelectorAll('.theme-option').forEach(option => {
  option.addEventListener('click', function() {
    showLoader('Applying theme...');
    
    setTimeout(() => {
      // Remove active class from all options
      document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
      });
      
      // Add active class to selected option
      this.classList.add('active');
      
      // Apply theme colors (body background would change based on the selected theme)
      const themeClasses = ['theme-light', 'theme-dark', 'theme-purple', 'theme-blue'];
      const selectedTheme = Array.from(this.classList)
        .find(cls => themeClasses.includes(cls));
        
      if (selectedTheme === 'theme-dark') {
        document.body.style.background = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
        document.body.style.color = '#fff';
      } else if (selectedTheme === 'theme-purple') {
        document.body.style.background = 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)';
      } else if (selectedTheme === 'theme-blue') {
        document.body.style.background = 'linear-gradient(135deg, #bfdbfe 0%, #60a5fa 100%)';
      } else {
        // Default light theme
        document.body.style.background = 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)';
        document.body.style.color = '#222';
      }
      
      hideLoader();
    }, 600);
  });
});

// Enhanced navigation with smooth transitions
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function() {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    
    // Get the corresponding section id
    const sectionId = navMap[this.id];
    showSection(sectionId);
  });
});

// Improved section switching with transitions
const originalShowSection = showSection;
showSection = function(section) {
  showLoader('Changing section...');
  
  setTimeout(() => {
    originalShowSection(section);
    hideLoader();
  }, 500);
};

function showSection(section) {
  // First, remove active class from all sections
  document.querySelectorAll('.main-section').forEach(s => {
    s.classList.remove('active');
  });
  
  // Then add active class to the target section
  const targetSection = document.getElementById(section);
  targetSection.classList.add('active');
  
  // Reset scroll position
  window.scrollTo(0, 0);
  
  // Apply delay to make animations visible after section change
  setTimeout(() => {
    // Reset all animations
    const animatedElements = targetSection.querySelectorAll('.scale-in, .slide-up, .delayed-fade, .delayed-fade-long');
    animatedElements.forEach(el => {
      el.style.animation = 'none';
      void el.offsetWidth; // Trigger reflow
      el.style.animation = '';
    });
  }, 50);
}

// Section switching logic with improved mapping
const navMap = {
  navHome: 'thoughtsSection',
  navExplore: 'exploreSection',
  navHistory: 'historySection',
  navSettings: 'settingsSection'
};

Object.keys(navMap).forEach(navId => {
  document.getElementById(navId).addEventListener('click', function() {
    showSection(navMap[navId]);
  });
});

// Handle scroll to hide/show bottom navigation
window.addEventListener('scroll', () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  if (scrollTop > lastScrollTop && scrollTop > 100) {
    // Scrolling down & past threshold
    if (!navHidden) {
      bottomNav.classList.add('bottom-nav-hidden');
      navHidden = true;
    }
  } else {
    // Scrolling up
    if (navHidden) {
      bottomNav.classList.remove('bottom-nav-hidden');
      navHidden = false;
    }
  }
  
  lastScrollTop = scrollTop;
});

// Add touch gestures for navigation (swipe left/right)
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}, false);

function handleSwipe() {
  const threshold = 100; // Minimum swipe distance
  const sections = ['thoughtsSection', 'exploreSection', 'historySection', 'settingsSection'];
  // Find current active section
  let currentIndex = 0;
  sections.forEach((id, index) => {
    if (document.getElementById(id).classList.contains('active')) {
      currentIndex = index;
    }
  });
  
  if (touchEndX < touchStartX - threshold) {
    // Swipe left -> Move right in tabs
    const nextIndex = Math.min(currentIndex + 1, sections.length - 1);
    const navId = Object.keys(navMap).find(key => navMap[key] === sections[nextIndex]);
    if (navId) {
      document.getElementById(navId).click();
    }
  }
  
  if (touchEndX > touchStartX + threshold) {
    // Swipe right -> Move left in tabs
    const prevIndex = Math.max(currentIndex - 1, 0);
    const navId = Object.keys(navMap).find(key => navMap[key] === sections[prevIndex]);
    if (navId) {
      document.getElementById(navId).click();
    }
  }
}

// Simulate haptic feedback (will work on devices that support vibration API)
function simulateHapticFeedback(duration = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
  }
}

// Add double-tap gesture for thought card to highlight important thoughts
const thoughtCard = document.getElementById('thoughtCard');
let lastTap = 0;

thoughtCard.addEventListener('touchend', function() {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  
  if (tapLength < 300 && tapLength > 0) {
    // Double tap detected
    simulateHapticFeedback(100);
    this.classList.add('highlighted');
    
    setTimeout(() => {
      this.classList.remove('highlighted');
    }, 3000);
    
    // Create a "saved to favorites" toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = '<i class="fas fa-heart"></i> Added to favorites';
    document.body.appendChild(toast);
    
    // Animate the toast
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove the toast after a delay
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2500);
  }
  
  lastTap = currentTime;
});

// Add long-press gesture to share thoughts
let pressTimer;
let isLongPress = false;

thoughtCard.addEventListener('touchstart', function() {
  isLongPress = false;
  pressTimer = setTimeout(() => {
    isLongPress = true;
    simulateHapticFeedback(150);
    
    // Create sharing popup
    const shareText = document.getElementById('thoughtText').textContent;
    
    // Check if Web Share API is supported
    if (navigator.share) {
      navigator.share({
        title: 'MindScribe Thought',
        text: shareText,
        url: window.location.href
      }).then(() => {
        console.log('Shared successfully');
      }).catch((error) => {
        console.log('Error sharing:', error);
      });
    } else {
      alert(`Sharing: ${shareText}`);
    }
  }, 800);
});

thoughtCard.addEventListener('touchend', () => {
  clearTimeout(pressTimer);
});

thoughtCard.addEventListener('touchmove', () => {
  clearTimeout(pressTimer);
});

// Add pull-to-refresh functionality
let touchStartY = 0;
let touchEndY = 0;
const mainContent = document.querySelector('.thoughts-section');

mainContent.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

mainContent.addEventListener('touchmove', (e) => {
  touchEndY = e.touches[0].clientY;
  
  // If we're at the top of the content and pulling down
  if (window.scrollY === 0 && touchEndY > touchStartY && touchEndY - touchStartY > 70) {
    // Show visual indicator
    if (!document.querySelector('.pull-indicator')) {
      const indicator = document.createElement('div');
      indicator.className = 'pull-indicator';
      indicator.innerHTML = '<i class="fas fa-arrow-down"></i> Release to refresh';
      mainContent.prepend(indicator);
      
      setTimeout(() => {
        indicator.style.opacity = '1';
      }, 10);
    }
  }
}, { passive: true });

mainContent.addEventListener('touchend', (e) => {
  const indicator = document.querySelector('.pull-indicator');
  
  // If pulled down enough and at the top of content
  if (window.scrollY === 0 && touchEndY > touchStartY && touchEndY - touchStartY > 100) {
    // Trigger refresh
    simulateHapticFeedback(80);
    refreshBtn.click();
  }
  
  // Remove indicator if it exists
  if (indicator) {
    indicator.style.opacity = '0';
    setTimeout(() => {
      indicator.remove();
    }, 300);
  }
}, { passive: true });

// Add toast notification style
const style = document.createElement('style');
style.textContent = `
  .toast-notification {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: rgba(93, 95, 239, 0.95);
    color: white;
    padding: 12px 20px;
    border-radius: 30px;
    font-size: 0.9rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .toast-notification i {
    margin-right: 8px;
  }
  
  .pull-indicator {
    width: 100%;
    text-align: center;
    padding: 15px 0;
    color: var(--primary);
    font-size: 0.9rem;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .pull-indicator i {
    margin-right: 5px;
    animation: bounce 1s infinite alternate;
  }
`;
document.head.appendChild(style);

// Modal for new entry button
//newEntryBtn.addEventListener('click', () => {
//  alert('New journal entry feature coming soon!');
//});

// Save button animation
const saveButton = document.getElementById('saveButton');
if (saveButton) {
  saveButton.addEventListener('click', function() {
    const originalText = this.innerHTML;
    this.innerHTML = '<i class="fas fa-check"></i> Saved!';
    
    setTimeout(() => {
      this.innerHTML = originalText;
    }, 2000);
  });
}

// Add fancy scroll animations for card elements
const cards = document.querySelectorAll('.thought-card');
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

cards.forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  observer.observe(card);
});

// Toggle event listeners
const notificationToggle = document.getElementById('notificationToggle');
if (notificationToggle) {
  notificationToggle.addEventListener('change', function() {
    if (this.checked) {
      console.log('Notifications enabled');
    } else {
      console.log('Notifications disabled');
    }
  });
}

const privacyToggle = document.getElementById('privacyToggle');
if (privacyToggle) {
  privacyToggle.addEventListener('change', function() {
    if (this.checked) {
      console.log('Privacy mode enabled');
    } else {
      console.log('Privacy mode disabled');
    }
  });
}

// User authentication and profile management
function checkAuthStatus() {
  const userEmail = localStorage.getItem('mindscribe_email');
  const userName = localStorage.getItem('userName');
  const userProfileCard = document.getElementById('userProfileCard');
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  const userDisplayName = document.getElementById('userDisplayName');
  const userEmailElement = document.getElementById('userEmail');
  
  if (userEmail && userProfileCard) {
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
    if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';
    if (userDisplayName) userDisplayName.textContent = userName || 'MindScribe User';
    if (userEmailElement) userEmailElement.textContent = userEmail;
    
    // Load user analytics if available
    loadUserAnalytics(userEmail);
  }
}

// Load user analytics from backend
async function loadUserAnalytics(userEmail) {
  const moodChart = document.getElementById('moodChart');
  const recentInsights = document.getElementById('recentInsights');
  
  if (!moodChart || !recentInsights) return;
  
  try {
    // Here we would fetch analytics from the backend
    // For now, just display a placeholder
    moodChart.innerHTML = `
      <div class="chart-placeholder">
        <i class="fas fa-chart-line"></i>
        <p>Connected as ${userEmail}</p>
      </div>
    `;
    
    recentInsights.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-lightbulb"></i>
        <p>Record journal entries to get AI insights</p>
      </div>
    `;
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

// Handle logout
function logoutUser() {
  localStorage.removeItem('mindscribe_email');
  localStorage.removeItem('userName');
  
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
  const userDisplayName = document.getElementById('userDisplayName');
  const userEmailElement = document.getElementById('userEmail');
  
  if (mobileLoginBtn) mobileLoginBtn.style.display = 'block';
  if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
  if (userDisplayName) userDisplayName.textContent = 'Guest User';
  if (userEmailElement) userEmailElement.textContent = 'Not logged in';
  
  showToast('Logged out successfully');
}

// Handle tab switching in Explore section
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const tabName = this.getAttribute('data-tab');
    
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    const activeContent = document.getElementById(tabName + 'Content');
    activeContent.style.display = 'block';
    
    // Add animation
    setTimeout(() => {
      activeContent.classList.add('visible');
    }, 50);
  });
});

// Dark mode toggle
const darkModeToggle = document.getElementById('darkModeToggle');
if (darkModeToggle) {
  // Check if dark mode is saved in preferences
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  
  // Apply dark mode if enabled
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
  }
  
  darkModeToggle.addEventListener('change', function() {
    if (this.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  });
}

// Connect login/logout buttons
const mobileLoginBtn = document.getElementById('mobileLoginBtn');
const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

if (mobileLoginBtn) {
  mobileLoginBtn.addEventListener('click', () => {
    window.location.href = 'login.html';
  });
}

if (mobileLogoutBtn) {
  mobileLogoutBtn.addEventListener('click', logoutUser);
}

// Show custom toast message
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}-toast`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
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
  }, 3000);
}

// Enhanced Journal history functionality
async function loadJournalHistory() {
  const userEmail = localStorage.getItem('mindscribe_email');
  const historyContainer = document.getElementById('journalHistory');
  const historyLoading = document.getElementById('historyLoading');
  const historyEmpty = document.getElementById('historyEmpty');
  const historyEntries = document.getElementById('historyEntries');
  const historyStats = document.getElementById('historyStats');
  const historyTimeline = document.getElementById('historyTimeline');
  const historySearch = document.getElementById('historySearch');
  const historyMoodFilter = document.getElementById('historyMoodFilter');

  if (!historyContainer || !historyLoading || !historyEmpty || !historyEntries) {
    return;
  }

  // Reset state
  historyLoading.style.display = 'flex';
  historyEmpty.style.display = 'none';
  historyEntries.innerHTML = '';
  if (historyStats) historyStats.innerHTML = '';
  if (historyTimeline) historyTimeline.innerHTML = '';

  // If not logged in, show empty state
  if (!userEmail) {
    historyLoading.style.display = 'none';
    historyEmpty.style.display = 'flex';
    historyEmpty.querySelector('p').textContent = 'Please log in to see your journal entries';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/history?user_email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) throw new Error('Failed to fetch journal history');
    const data = await response.json();
    let entries = data.entries || [];

    // Hide loading
    historyLoading.style.display = 'none';

    // Show stats
    if (historyStats) {
      const total = entries.length;
      const positive = entries.filter(e => getSentimentType(e) === 'positive').length;
      const neutral = entries.filter(e => getSentimentType(e) === 'neutral').length;
      const negative = entries.filter(e => getSentimentType(e) === 'negative').length;
      historyStats.innerHTML = `
        <span title="Total entries"><i class="fas fa-book"></i> ${total}</span>
        <span title="Positive"><i class="fas fa-smile"></i> ${positive}</span>
        <span title="Neutral"><i class="fas fa-meh"></i> ${neutral}</span>
        <span title="Negative"><i class="fas fa-frown"></i> ${negative}</span>
      `;
    }

    // Timeline visualization (last 20 entries)
    if (historyTimeline) {
      const timelineEntries = entries.slice(0, 20);
      historyTimeline.innerHTML = timelineEntries.map((entry, idx) => {
        const sentiment = getSentimentType(entry);
        const mood = getMood(entry);
        const date = new Date(entry.timestamp);
        const tooltip = `${date.toLocaleDateString()}<br>${mood}`;
        return `<div class="timeline-bar ${sentiment}" data-idx="${idx}">
          <div class="timeline-tooltip">${tooltip}</div>
        </div>`;
      }).join('');
      // Click on timeline bar scrolls to entry
      historyTimeline.querySelectorAll('.timeline-bar').forEach(bar => {
        bar.addEventListener('click', function() {
          const idx = parseInt(this.getAttribute('data-idx'));
          const entryEl = historyEntries.children[idx];
          if (entryEl) entryEl.scrollIntoView({behavior: 'smooth', block: 'center'});
          this.classList.add('active');
          setTimeout(() => this.classList.remove('active'), 800);
        });
      });
    }

    // Filtering logic
    let filteredEntries = entries;
    function applyFilters() {
      let search = historySearch ? historySearch.value.trim().toLowerCase() : '';
      let moodFilter = historyMoodFilter ? historyMoodFilter.value : '';
      filteredEntries = entries.filter(entry => {
        const analysis = typeof entry.analysis_result === 'string'
          ? JSON.parse(entry.analysis_result)
          : entry.analysis_result;
        const transcript = entry.transcript || '';
        const mood = (analysis.mood || '').toLowerCase();
        const sentimentType = getSentimentType(entry);
        let match = true;
        if (search) {
          match = transcript.toLowerCase().includes(search) ||
                  (analysis.summary || '').toLowerCase().includes(search) ||
                  (analysis.key_topics || []).join(' ').toLowerCase().includes(search);
        }
        if (moodFilter) {
          match = match && sentimentType === moodFilter;
        }
        return match;
      });
      renderEntries(filteredEntries);
    }

    if (historySearch) historySearch.oninput = applyFilters;
    if (historyMoodFilter) historyMoodFilter.onchange = applyFilters;

    // Render entries
    function renderEntries(list) {
      historyEntries.innerHTML = '';
      if (list.length === 0) {
        historyEmpty.style.display = 'flex';
        return;
      }
      historyEmpty.style.display = 'none';
      list.forEach((entry, idx) => {
        try {
          const analysis = typeof entry.analysis_result === 'string'
            ? JSON.parse(entry.analysis_result)
            : entry.analysis_result;
          const date = new Date(entry.timestamp);
          const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          const sentimentType = getSentimentType(entry);
          const mood = analysis.mood || 'Unknown mood';
          const summary = analysis.summary || '';
          const topics = (analysis.key_topics || []).map(t => `<span class="topic-badge">${t}</span>`).join('');
          const moodIcon = sentimentType === 'positive' ? 'fa-smile' : sentimentType === 'negative' ? 'fa-frown' : 'fa-meh';
          const entryElement = document.createElement('div');
          entryElement.className = `history-entry history-entry-modern ${sentimentType}`;
          entryElement.innerHTML = `
            <div class="entry-header">
              <span class="entry-date">${formattedDate}</span>
              <span class="entry-mood"><i class="fas ${moodIcon}"></i> ${mood}</span>
            </div>
            <div class="entry-summary">${summary}</div>
            <div class="entry-transcript">${entry.transcript}</div>
            <div class="entry-topics">${topics}</div>
            <button class="entry-expand" data-entry-id="${entry._id}" title="View details">
              <i class="fas fa-chevron-right"></i>
            </button>
          `;
          entryElement.addEventListener('click', () => viewEntryDetails(entry));
          historyEntries.appendChild(entryElement);
        } catch (parseError) {
          console.error('Error parsing entry:', parseError);
        }
      });
    }

    // Helper: get sentiment type
    function getSentimentType(entry) {
      try {
        const analysis = typeof entry.analysis_result === 'string'
          ? JSON.parse(entry.analysis_result)
          : entry.analysis_result;
        const score = analysis.sentiment_score;
        if (typeof score === 'number') {
          if (score >= 3) return 'positive';
          if (score <= -3) return 'negative';
        }
        return 'neutral';
      } catch { return 'neutral'; }
    }
    function getMood(entry) {
      try {
        const analysis = typeof entry.analysis_result === 'string'
          ? JSON.parse(entry.analysis_result)
          : entry.analysis_result;
        return analysis.mood || '';
      } catch { return ''; }
    }

    // Initial render
    applyFilters();

  } catch (error) {
    console.error('Error loading journal history:', error);
    historyLoading.style.display = 'none';
    historyEmpty.style.display = 'flex';
    historyEmpty.querySelector('p').textContent = 'Error loading entries. Please try again.';
  }
}

// Journal history functionality
document.getElementById('navHistory')?.addEventListener('click', () => {
  loadJournalHistory();
});

document.getElementById('refreshHistoryBtn')?.addEventListener('click', () => {
  loadJournalHistory();
});

document.getElementById('createFirstEntryBtn')?.addEventListener('click', () => {
  // Open the recording modal if available, otherwise switch to home
  if (window.voiceRecording && typeof window.voiceRecording.openRecordingModal === 'function') {
    window.voiceRecording.openRecordingModal();
  } else {
    document.getElementById('navHome')?.click();
  }
});

document.getElementById('exportHistoryBtn')?.addEventListener('click', () => {
  const userEmail = localStorage.getItem('mindscribe_email');
  if (!userEmail) {
    showToast('Please log in to export your journal history', 'error');
    return;
  }
  
  showToast('Exporting journal entries...', 'info');
  // In a real implementation, this would download a file with the journal entries
  setTimeout(() => {
    showToast('Export feature coming soon!', 'info');
  }, 1500);
});

// Event listener for loading history when switching sections
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    if (item.id === 'navHistory') {
      setTimeout(() => loadJournalHistory(), 100);
    }
  });
});

// Load history when section becomes visible due to swipe
function afterSectionChange(sectionId) {
  if (sectionId === 'historySection') {
    loadJournalHistory();
  }
}

// Listen for document visibility changes to refresh history when app regains focus
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    const activeSection = document.querySelector('.main-section.active');
    if (activeSection && activeSection.id === 'historySection') {
      loadJournalHistory();
    }
  }
});

// Settings section enhancements
// Theme selector logic
const themeOptions = document.querySelectorAll('.theme-option');
themeOptions.forEach(option => {
  option.addEventListener('click', function() {
    themeOptions.forEach(o => o.classList.remove('active'));
    this.classList.add('active');
    const theme = this.getAttribute('data-theme');
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-purple', 'theme-blue');
    document.body.classList.add('theme-' + theme);
    localStorage.setItem('mindscribe-theme', theme);
  });
});
// Load theme on page load
const savedTheme = localStorage.getItem('mindscribe-theme');
if (savedTheme) {
  document.body.classList.add('theme-' + savedTheme);
  const active = document.querySelector('.theme-option[data-theme="' + savedTheme + '"]');
  if (active) active.classList.add('active');
}
// Editable profile name/avatar (demo only)
document.querySelectorAll('.edit-profile-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const nameEl = document.getElementById('userDisplayName');
    const current = nameEl.childNodes[0].nodeValue.trim();
    const newName = prompt('Edit your display name:', current);
    if (newName) nameEl.childNodes[0].nodeValue = newName + ' ';
  });
});
document.querySelectorAll('.edit-avatar-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    alert('Profile picture editing coming soon!');
  });
});

// Initialize the app
function initApp() {
  // Show the home section first
  showSection('thoughtsSection');
  
  // Check authentication status
  checkAuthStatus();
  
  // Show welcome toast
  //setTimeout(() => {
  //  showToast('Welcome to MindScribe Mobile', 'success');
  //}, 1500);
}

// Start the app
initApp();