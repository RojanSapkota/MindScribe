// Desktop JavaScript for MindScribe

document.addEventListener('DOMContentLoaded', function() {
  console.log('Desktop app initializing...');
  
  // Check authentication first
  if (!checkAuthenticationStatus()) {
    return;
  }
  
  // Initialize desktop functionality
  initAuthentication();
  initNavigation();
  initSigninTracker();
  initFreeWriting();
  initRefreshButton();
  initUserEmail();
  initHistoryView();
  initProfileView();
  initAIChat();  initVoiceTranscription();
  initActivityTracking();
  initFoodScanning();
  initExerciseSearch();  initDarkMode();
  initKeyboardShortcuts();
  
  // Ensure homeView is visible and initialize it
  switchView('homeView');
  
  console.log('Desktop app initialization complete');
});

// Authentication check
function checkAuthenticationStatus() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  
  if (!isLoggedIn) {
    alert('Please log in to access this app.');
    window.location.href = 'login.html';
    return false;
  }
  
  console.log('User authenticated:', userEmail);
  return true;
}

// Authentication functionality
function initAuthentication() {
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName') || userEmail;
  
  // Set user info in UI
  const welcomeEmailElement = document.getElementById('welcomeUserEmail');
  const profileEmailElement = document.getElementById('profileUserEmail');
  
  if (welcomeEmailElement) {
    welcomeEmailElement.textContent = userName || 'Ready to track your mental wellness journey?';
  }
  
  if (profileEmailElement) {
    profileEmailElement.textContent = userEmail || 'user@example.com';
  }
  
  // Set member since date
  const memberSinceElement = document.getElementById('memberSince');
  if (memberSinceElement) {
    memberSinceElement.textContent = new Date().getFullYear();
  }
  
  // Logout functionality
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('darkMode');
      localStorage.removeItem('notifications');
      window.location.href = 'login.html';
    });
  }
}

// Navigation functionality
function initNavigation() {
  console.log('Initializing navigation...');
  const menuItems = document.querySelectorAll('.menu-item[data-view]');
  const actionBtns = document.querySelectorAll('.action-btn[data-view]');
  const views = document.querySelectorAll('.desktop-view');
  
  console.log('Found menu items:', menuItems.length);
  console.log('Found action buttons:', actionBtns.length);
  console.log('Found views:', views.length);

  // Handle menu item clicks
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.dataset.view;
      console.log('Menu item clicked:', targetView);
      switchView(targetView);
      
      // Update active menu item
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Handle action button clicks
  actionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      console.log('Action button clicked:', targetView);
      switchView(targetView);
      
      // Update active menu item
      menuItems.forEach(mi => mi.classList.remove('active'));
      const correspondingMenuItem = document.querySelector(`.menu-item[data-view="${targetView}"]`);
      if (correspondingMenuItem) {
        correspondingMenuItem.classList.add('active');
      }
    });
  });

  // Global view switching function
  window.switchView = function(viewId) {
    console.log('Switching to view:', viewId);
    views.forEach(view => {
      view.classList.remove('active');
    });
    
    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.add('active');
      console.log('View activated:', viewId);
      
      // Call view-specific initialization functions
      if (viewId === 'historyView') {
        loadJournalHistory();
      } else if (viewId === 'profileView') {
        loadProfileData();
      } else if (viewId === 'activityView') {
        loadActivityData();
        fetchAndDisplayActivityTotals();
      } else if (viewId === 'recordView') {
        initializeRecordingView();
      }
    } else {
      console.error('Target view not found:', viewId);
    }
  };
  
  // Initialize with home view
  switchView('homeView');
}

// Sign-in Tracker functionality
function initSigninTracker() {
  const trackerCard = document.getElementById('signinTrackerCard');
  const daysDiv = document.getElementById('signinTrackerDays');

  function getLast7Days() {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { weekday: 'short' })
      });
    }
    return days;
  }

  function getSigninData() {
    return JSON.parse(localStorage.getItem('signinTracker') || '[]');
  }

  function setSigninData(arr) {
    localStorage.setItem('signinTracker', JSON.stringify(arr));
  }

  function markTodaySignin() {
    const arr = getSigninData();
    const today = new Date().toISOString().slice(0, 10);
    if (!arr.includes(today)) {
      arr.push(today);
      setSigninData(arr);
    }
  }

  function renderSigninTracker() {
    const arr = getSigninData();
    const days = getLast7Days();
    daysDiv.innerHTML = '';

    days.forEach(day => {
      const signed = arr.includes(day.date);
      const isToday = day.date === new Date().toISOString().slice(0, 10);
      
      const el = document.createElement('div');
      el.textContent = day.label.charAt(0);
      el.title = day.label + ' ' + day.date;
      
      if (isToday) {
        el.style.cssText = 'background: var(--primary); color: white;';
      } else if (signed) {
        el.style.cssText = 'background: var(--accent); color: white;';
      } else {
        el.style.cssText = 'background: var(--light-gray); color: var(--gray);';
      }
      
      daysDiv.appendChild(el);
    });
  }

  // Modal functionality
  if (trackerCard) {
    trackerCard.addEventListener('click', function() {
      const arr = getSigninData();
      const days = getLast7Days();
      
      let modal = document.getElementById('signinTrackerModal');
      if (modal) modal.remove();
      
      modal = document.createElement('div');
      modal.id = 'signinTrackerModal';
      modal.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.5);
        z-index: 3000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
      `;
      
      modal.innerHTML = `
        <div style="
          background: white;
          padding: 32px;
          border-radius: 20px;
          max-width: 90vw;
          width: 400px;
          box-shadow: var(--shadow-lg);
          position: relative;
        ">
          <button id="closeSigninTrackerModal" style="
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            font-size: 20px;
            color: var(--gray);
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <i class="fas fa-times"></i>
          </button>
          <h3 style="
            margin: 0 0 24px 0;
            font-size: 24px;
            color: var(--primary);
            font-weight: 700;
          ">Sign-in Tracker</h3>
          <div style="
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-bottom: 20px;
          ">
            ${days.map(day => {
              const signed = arr.includes(day.date);
              const isToday = day.date === new Date().toISOString().slice(0, 10);
              return `
                <div title="${day.label} ${day.date}" style="
                  width: 48px;
                  height: 48px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 12px;
                  font-weight: 700;
                  font-size: 16px;
                  box-shadow: var(--shadow-sm);
                  ${isToday ? 
                    'background: var(--primary); color: white;' : 
                    signed ? 
                      'background: var(--accent); color: white;' : 
                      'background: var(--light-gray); color: var(--gray);'
                  }
                ">${day.label.charAt(0)}</div>
              `;
            }).join('')}
          </div>
          <div style="
            text-align: center;
            color: var(--gray);
            font-size: 16px;
          ">
            Today's sign-in: <span style="color: var(--primary); font-weight: 600;">
              ${days[6].label}
            </span>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close modal functionality
      const closeBtn = document.getElementById('closeSigninTrackerModal');
      closeBtn.onclick = () => modal.remove();
      modal.addEventListener('click', e => {
        if (e.target === modal) modal.remove();
      });
      
      // Escape key to close
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal) {
          modal.remove();
        }
      });
    });
  }

  // Initialize tracker
  markTodaySignin();
  renderSigninTracker();
}

// Free Writing functionality
function initFreeWriting() {
  const textarea = document.getElementById('freeWritingBox');
  const saveBtn = document.getElementById('saveFreeWritingBtn');
  const savedMsg = document.getElementById('freeWritingSavedMsg');

  // Load saved content
  if (textarea) {
    const saved = localStorage.getItem('freeWritingContent');
    if (saved) {
      textarea.value = saved;
    }
  }

  // Save functionality
  if (saveBtn && textarea) {
    saveBtn.addEventListener('click', function() {
      localStorage.setItem('freeWritingContent', textarea.value);
      
      if (savedMsg) {
        savedMsg.style.display = 'inline';
        setTimeout(() => {
          savedMsg.style.display = 'none';
        }, 1200);
      }
    });
  }

  // Auto-save on typing (debounced)
  if (textarea) {
    let saveTimeout;
    textarea.addEventListener('input', function() {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        localStorage.setItem('freeWritingContent', textarea.value);
      }, 1000);
    });
  }
}

// Refresh button functionality
function initRefreshButton() {
  const refreshBtn = document.querySelector('.refresh-btn');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      // Add loading state
      refreshBtn.classList.add('loading');
      
      // Simulate refresh action
      setTimeout(() => {
        // Refresh sign-in tracker
        initSigninTracker();
        
        // Remove loading state
        refreshBtn.classList.remove('loading');
        
        // Show success feedback
        const icon = refreshBtn.querySelector('i');
        const originalClass = icon.className;
        icon.className = 'fas fa-check';
        
        setTimeout(() => {
          icon.className = originalClass;
        }, 1000);
      }, 800);
    });
  }
}

// User email functionality
function initUserEmail() {
  const emailElement = document.getElementById('welcomeUserEmail');
  if (emailElement) {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      emailElement.textContent = `Welcome back, ${userEmail.split('@')[0]}!`;
    } else {
      emailElement.textContent = 'Ready to track your mental wellness journey?';
    }
  }
}

// Dark mode functionality
function initDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  let darkMode = localStorage.getItem('darkMode') === 'true';
  
  // Initialize dark mode from localStorage
  if (darkMode) {
    document.body.classList.add('dark-theme');
  }
  
  // Initialize dark mode toggle
  if (darkModeToggle) {
    darkModeToggle.checked = darkMode;
    
    darkModeToggle.addEventListener('change', function() {
      darkMode = this.checked;
      document.body.classList.toggle('dark-theme', darkMode);
      localStorage.setItem('darkMode', darkMode);
      showNotification(darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    });
  }
}

// Keyboard shortcuts
function initKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Number keys for navigation
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      const views = ['homeView', 'activityView', 'recordView', 'historyView', 'profileView'];
      const viewIndex = parseInt(e.key) - 1;
      if (views[viewIndex]) {
        switchView(views[viewIndex]);
        
        // Update active menu item
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(mi => mi.classList.remove('active'));
        const targetMenuItem = document.querySelector(`.menu-item[data-view="${views[viewIndex]}"]`);
        if (targetMenuItem) {
          targetMenuItem.classList.add('active');
        }
      }
    }
    
    // Ctrl/Cmd + S to save (for free writing)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const saveFreeWritingBtn = document.getElementById('saveFreeWritingBtn');
      if (saveFreeWritingBtn && document.getElementById('recordView').classList.contains('active')) {
        saveFreeWritingBtn.click();
      }
    }
    
    // Escape key to close modals
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('[id*="Modal"]');
      modals.forEach(modal => {
        if (modal.style.display !== 'none') {
          modal.remove();
        }
      });
    }
  });
}

// Settings button functionality
document.addEventListener('click', function(e) {
  if (e.target.closest('.settings-btn')) {
    switchView('profileView');
    
    // Update active menu item
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(mi => mi.classList.remove('active'));
    const profileMenuItem = document.querySelector('.menu-item[data-view="profileView"]');
    if (profileMenuItem) {
      profileMenuItem.classList.add('active');
    }
  }
});

// History View functionality
function initHistoryView() {
  const refreshHistoryBtn = document.getElementById('refreshJournalHistoryBtn');
  const searchInput = document.getElementById('historySearchInput');
  const moodFilter = document.getElementById('moodFilterSelect');

  if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener('click', function() {
      refreshHistoryBtn.classList.add('loading');
      loadJournalHistory();
      setTimeout(() => {
        refreshHistoryBtn.classList.remove('loading');
      }, 1000);
    });
  }

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterJournalEntries();
      }, 300);
    });
  }

  if (moodFilter) {
    moodFilter.addEventListener('change', filterJournalEntries);
  }
}

let journalHistoryData = [];

async function loadJournalHistory() {
  const userEmail = localStorage.getItem('userEmail');
  const loadingEl = document.getElementById('historyLoading');
  const emptyEl = document.getElementById('historyEmpty');
  const containerEl = document.getElementById('journalEntriesContainer');

  if (!userEmail) {
    showHistoryEmpty('Please log in to view your journal history');
    return;
  }

  if (loadingEl) loadingEl.style.display = 'flex';
  if (emptyEl) emptyEl.style.display = 'none';

  try {
    const response = await fetch(`https://mindscribe.rojan.hackclub.app/history?user_email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) throw new Error('Failed to fetch journal history');
    
    const data = await response.json();
    journalHistoryData = data.entries || [];

    if (loadingEl) loadingEl.style.display = 'none';

    if (journalHistoryData.length === 0) {
      showHistoryEmpty('No journal entries yet');
      updateHistoryStats(0, 0, 0, 0);
      return;
    }

    // Update stats
    const stats = calculateHistoryStats(journalHistoryData);
    updateHistoryStats(stats.total, stats.positive, stats.neutral, stats.negative);

    // Update timeline
    updateMoodTimeline(journalHistoryData.slice(0, 20));

    // Display entries
    displayJournalEntries(journalHistoryData);

  } catch (error) {
    console.error('Error loading journal history:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    showHistoryEmpty('Error loading journal history. Please try again.');
  }
}

function calculateHistoryStats(entries) {
  const total = entries.length;
  let positive = 0, neutral = 0, negative = 0;

  entries.forEach(entry => {
    const sentiment = getSentimentType(entry);
    if (sentiment === 'positive') positive++;
    else if (sentiment === 'neutral') neutral++;
    else negative++;
  });

  return { total, positive, neutral, negative };
}

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
  } catch {
    return 'neutral';
  }
}

function updateHistoryStats(total, positive, neutral, negative) {
  const totalEl = document.getElementById('totalJournals');
  const positiveEl = document.getElementById('positiveJournals');
  const neutralEl = document.getElementById('neutralJournals');
  const negativeEl = document.getElementById('negativeJournals');

  if (totalEl) totalEl.textContent = total;
  if (positiveEl) positiveEl.textContent = positive;
  if (neutralEl) neutralEl.textContent = neutral;
  if (negativeEl) negativeEl.textContent = negative;
}

function updateMoodTimeline(entries) {
  const timelineEl = document.getElementById('moodTimeline');
  if (!timelineEl) return;

  timelineEl.innerHTML = '';

  entries.forEach((entry, index) => {
    const sentiment = getSentimentType(entry);
    const date = new Date(entry.timestamp);
    const height = Math.max(20, Math.random() * 60 + 20); // Random height for visualization

    const bar = document.createElement('div');
    bar.className = `timeline-bar ${sentiment}`;
    bar.style.height = `${height}px`;
    bar.title = `${date.toLocaleDateString()} - ${sentiment}`;
    
    bar.addEventListener('click', function() {
      // Remove active class from all bars
      timelineEl.querySelectorAll('.timeline-bar').forEach(b => b.classList.remove('active'));
      // Add active class to clicked bar
      this.classList.add('active');
      // Scroll to corresponding entry
      const entryElements = document.querySelectorAll('.history-entry');
      if (entryElements[index]) {
        entryElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    timelineEl.appendChild(bar);
  });
}

function displayJournalEntries(entries) {
  const containerEl = document.getElementById('journalEntriesContainer');
  if (!containerEl) return;

  // Clear loading/empty states
  const loadingEl = document.getElementById('historyLoading');
  const emptyEl = document.getElementById('historyEmpty');
  if (loadingEl) loadingEl.style.display = 'none';
  if (emptyEl) emptyEl.style.display = 'none';

  // Create entries HTML
  containerEl.innerHTML = '';
  
  entries.forEach((entry, index) => {
    const entryEl = createHistoryEntryElement(entry, index);
    containerEl.appendChild(entryEl);
  });
}

function createHistoryEntryElement(entry, index) {
  const sentiment = getSentimentType(entry);
  const date = new Date(entry.timestamp);
  const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  let analysis;
  try {
    analysis = typeof entry.analysis_result === 'string'
      ? JSON.parse(entry.analysis_result)
      : entry.analysis_result;
  } catch {
    analysis = {};
  }

  const mood = analysis.mood || 'Unknown mood';
  const summary = analysis.summary || '';
  const topics = (analysis.key_topics || []).map(t => `<span class="topic-badge">${escapeHTML(t)}</span>`).join('');
  const moodIcon = sentiment === 'positive' ? 'fa-smile' : sentiment === 'negative' ? 'fa-frown' : 'fa-meh';

  const entryEl = document.createElement('div');
  entryEl.className = `history-entry ${sentiment}`;
  entryEl.innerHTML = `
    <div class="entry-header">
      <span class="entry-date">${formattedDate}</span>
      <span class="entry-mood"><i class="fas ${moodIcon}"></i> ${escapeHTML(mood)}</span>
    </div>
    <div class="entry-summary">${escapeHTML(summary)}</div>
    <div class="entry-transcript">${escapeHTML(entry.transcript || '')}</div>
    <div class="entry-topics">${topics}</div>
    <button class="entry-expand" data-entry-id="${entry._id}" title="View details">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  // Add click handler for expand button
  const expandBtn = entryEl.querySelector('.entry-expand');
  expandBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    showJournalFullModal(analysis, entry);
  });

  return entryEl;
}

function filterJournalEntries() {
  const searchInput = document.getElementById('historySearchInput');
  const moodFilter = document.getElementById('moodFilterSelect');
  
  if (!searchInput || !moodFilter) return;

  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedMood = moodFilter.value;

  let filteredEntries = journalHistoryData.filter(entry => {
    // Search filter
    let matchesSearch = true;
    if (searchTerm) {
      const transcript = entry.transcript || '';
      let analysis;
      try {
        analysis = typeof entry.analysis_result === 'string'
          ? JSON.parse(entry.analysis_result)
          : entry.analysis_result;
      } catch {
        analysis = {};
      }
      const summary = analysis.summary || '';
      const topics = (analysis.key_topics || []).join(' ');
      
      matchesSearch = transcript.toLowerCase().includes(searchTerm) ||
                     summary.toLowerCase().includes(searchTerm) ||
                     topics.toLowerCase().includes(searchTerm);
    }

    // Mood filter
    let matchesMood = true;
    if (selectedMood) {
      const sentiment = getSentimentType(entry);
      matchesMood = sentiment === selectedMood;
    }

    return matchesSearch && matchesMood;
  });

  displayJournalEntries(filteredEntries);
}

function showHistoryEmpty(message) {
  const emptyEl = document.getElementById('historyEmpty');
  const loadingEl = document.getElementById('historyLoading');
  
  if (loadingEl) loadingEl.style.display = 'none';
  if (emptyEl) {
    emptyEl.style.display = 'flex';
    const messageEl = emptyEl.querySelector('p');
    if (messageEl) messageEl.textContent = message;
  }
}

function showJournalFullModal(analysis, entry) {
  // Remove any existing modal
  const oldModal = document.getElementById('journalFullModal');
  if (oldModal) oldModal.remove();

  const summary = analysis.summary || 'No summary available.';
  const mood = analysis.mood || 'N/A';
  const sentiment_score = analysis.sentiment_score !== undefined ? analysis.sentiment_score : 'N/A';
  const key_topics = Array.isArray(analysis.key_topics) ? analysis.key_topics.map(escapeHTML).join(', ') : 'N/A';
  const insights = Array.isArray(analysis.insights) ? analysis.insights.map(i => `<li>${escapeHTML(i)}</li>`).join('') : '';
  const suggestions = Array.isArray(analysis.suggestions) ? analysis.suggestions.map(i => `<li>${escapeHTML(i)}</li>`).join('') : '';

  const modal = document.createElement('div');
  modal.id = 'journalFullModal';
  modal.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      padding: 32px;
      border-radius: 20px;
      max-width: 90vw;
      max-height: 90vh;
      width: 600px;
      box-shadow: var(--shadow-lg);
      position: relative;
      overflow-y: auto;
    ">
      <button id="closeJournalFullModal" style="
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 20px;
        color: var(--gray);
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <i class="fas fa-times"></i>
      </button>
      <h2 style="
        margin: 0 0 24px 0;
        font-size: 24px;
        color: var(--primary);
        font-weight: 700;
      "><i class="fas fa-book-open"></i> Journal Analysis</h2>
      <div style="margin-bottom: 16px;"><strong>Summary:</strong><br><span>${escapeHTML(summary)}</span></div>
      <div style="margin-bottom: 16px;"><strong>Mood:</strong> <span>${escapeHTML(mood)}</span></div>
      <div style="margin-bottom: 16px;"><strong>Sentiment Score:</strong> <span>${sentiment_score}</span></div>
      <div style="margin-bottom: 16px;"><strong>Key Topics:</strong> <span>${key_topics}</span></div>
      <div style="margin-bottom: 16px;"><strong>Insights:</strong><ul>${insights || '<li>No insights available.</li>'}</ul></div>
      <div style="margin-bottom: 16px;"><strong>Suggestions:</strong><ul>${suggestions || '<li>No suggestions available.</li>'}</ul></div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
        <strong>Original Entry:</strong><br>
        <div style="background: var(--bg-light); padding: 16px; border-radius: 8px; margin-top: 8px; font-style: italic;">
          ${escapeHTML(entry.transcript || 'No transcript available')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Close modal functionality
  const closeBtn = document.getElementById('closeJournalFullModal');
  closeBtn.onclick = () => modal.remove();
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
  
  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal) {
      modal.remove();
    }
  });
}

// Profile View functionality
function initProfileView() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const notificationsToggle = document.getElementById('notificationsToggle');
  const exportBtn = document.getElementById('exportToPDF');
  const termsBtn = document.getElementById('viewTermsAndPrivacy');

  // Load saved preferences
  if (darkModeToggle) {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    darkModeToggle.checked = darkMode;
    
    darkModeToggle.addEventListener('change', function() {
      localStorage.setItem('darkMode', this.checked);
      // Apply dark mode (would need CSS implementation)
      if (this.checked) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    });
  }

  if (notificationsToggle) {
    const notifications = localStorage.getItem('notifications') !== 'false';
    notificationsToggle.checked = notifications;
    
    notificationsToggle.addEventListener('change', function() {
      localStorage.setItem('notifications', this.checked);
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportToPDF);
  }

  if (termsBtn) {
    termsBtn.addEventListener('click', function() {
      window.open('https://mindscribe.rojan.hackclub.app/terms', '_blank');
    });
  }

  // Profile menu items
  const profileMenuItems = document.querySelectorAll('.profile-menu-item');
  profileMenuItems.forEach(item => {
    item.addEventListener('click', function() {
      const id = this.id;
      switch(id) {
        case 'viewGoals':
          showComingSoonModal('Goals tracking feature is coming soon!');
          break;
        case 'viewBucketList':
          showComingSoonModal('Bucket list feature is coming soon!');
          break;
        case 'editProfile':
          showComingSoonModal('Profile editing is coming soon!');
          break;
        case 'changePassword':
          showComingSoonModal('Password change feature is coming soon!');
          break;
      }
    });
  });
}

function loadProfileData() {
  const emailEl = document.getElementById('profileUserEmail');
  const memberSinceEl = document.getElementById('memberSince');

  if (emailEl) {
    const userEmail = localStorage.getItem('userEmail');
    emailEl.textContent = userEmail || 'user@example.com';
  }

  if (memberSinceEl) {
    // Set member since to current year or stored value
    const memberSince = localStorage.getItem('memberSince') || '2025';
    memberSinceEl.textContent = memberSince;
  }
}

async function handleExportToPDF() {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    showComingSoonModal('Please log in to export your journal history.');
    return;
  }

  showComingSoonModal('PDF export feature is coming soon!');
}

function showComingSoonModal(message) {
  // Remove any existing modal
  const oldModal = document.getElementById('comingSoonModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'comingSoonModal';
  modal.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      padding: 32px;
      border-radius: 20px;
      max-width: 90vw;
      width: 400px;
      box-shadow: var(--shadow-lg);
      position: relative;
      text-align: center;
    ">
      <div style="
        width: 80px;
        height: 80px;
        background: var(--primary-light);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      ">
        <i class="fas fa-rocket" style="font-size: 36px; color: white;"></i>
      </div>
      <h3 style="
        margin: 0 0 16px 0;
        font-size: 20px;
        color: var(--text);
        font-weight: 600;
      ">Coming Soon!</h3>
      <p style="
        margin: 0 0 24px 0;
        color: var(--text-secondary);
        line-height: 1.5;
      ">${message}</p>
      <button id="closeComingSoonModal" style="
        background: var(--primary);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: var(--transition);
      ">Got it!</button>
    </div>
  `;

  document.body.appendChild(modal);
  
  const closeBtn = document.getElementById('closeComingSoonModal');
  closeBtn.onclick = () => modal.remove();
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.remove();
  });
}

// AI Chat functionality
function initAIChat() {
  const aiChatButton = document.querySelector('.ai-chat-card .action-btn');
  if (aiChatButton) {
    aiChatButton.addEventListener('click', openAIChat);
  }
}

function openAIChat() {
  // Create AI chat modal
  const modal = document.createElement('div');
  modal.className = 'ai-chat-modal';
  modal.innerHTML = `
    <div class="ai-chat-overlay">
      <div class="ai-chat-container">
        <div class="ai-chat-header">
          <div class="ai-chat-title">
            <i class="fas fa-robot"></i>
            <span>AI Mental Health Assistant</span>
          </div>
          <button class="ai-chat-close" onclick="closeAIChat()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="ai-chat-messages" id="aiChatMessages">
          <div class="ai-message">
            <div class="message-avatar">
              <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
              <p>Hello! I'm your AI mental health assistant. I'm here to listen, provide support, and help you explore your thoughts and feelings. How are you doing today?</p>
            </div>
          </div>
        </div>
        
        <div class="ai-chat-input-container">
          <div class="ai-chat-input-wrapper">
            <textarea id="aiChatInput" placeholder="Type your message here..." rows="2"></textarea>
            <button id="aiChatVoiceBtn" class="voice-input-btn" title="Voice input">
              <i class="fas fa-microphone"></i>
            </button>
          </div>
          <button id="aiChatSendBtn" class="ai-chat-send">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        
        <div class="ai-chat-quick-actions">
          <button class="quick-action-btn" onclick="sendQuickMessage('I am feeling anxious today')">
            <i class="fas fa-heart"></i> Feeling anxious
          </button>
          <button class="quick-action-btn" onclick="sendQuickMessage('I need some motivation')">
            <i class="fas fa-lightbulb"></i> Need motivation
          </button>
          <button class="quick-action-btn" onclick="sendQuickMessage('Help me process my emotions')">
            <i class="fas fa-brain"></i> Process emotions
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Initialize chat functionality
  initAIChatEvents();
  
  // Focus on input
  setTimeout(() => {
    document.getElementById('aiChatInput').focus();
  }, 100);
}

function closeAIChat() {
  const modal = document.querySelector('.ai-chat-modal');
  if (modal) {
    modal.remove();
  }
}

function initAIChatEvents() {
  const sendBtn = document.getElementById('aiChatSendBtn');
  const input = document.getElementById('aiChatInput');
  const voiceBtn = document.getElementById('aiChatVoiceBtn');
  
  // Send message on button click
  sendBtn.addEventListener('click', sendAIMessage);
  
  // Send message on Enter (Shift+Enter for new line)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAIMessage();
    }
  });
  
  // Voice input functionality
  voiceBtn.addEventListener('click', startAIVoiceInput);
}

function sendAIMessage() {
  const input = document.getElementById('aiChatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message
  addChatMessage(message, 'user');
  
  // Clear input
  input.value = '';
  
  // Show typing indicator
  showTypingIndicator();
  
  // Simulate AI response (replace with actual API call)
  setTimeout(() => {
    hideTypingIndicator();
    const aiResponse = generateAIResponse(message);
    addChatMessage(aiResponse, 'ai');
  }, 1000 + Math.random() * 2000);
}

function sendQuickMessage(message) {
  const input = document.getElementById('aiChatInput');
  input.value = message;
  sendAIMessage();
}

function addChatMessage(message, sender) {
  const messagesContainer = document.getElementById('aiChatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = sender === 'user' ? 'user-message' : 'ai-message';
  
  if (sender === 'user') {
    messageDiv.innerHTML = `
      <div class="message-content">
        <p>${escapeHTML(message)}</p>
      </div>
      <div class="message-avatar">
        <i class="fas fa-user"></i>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <i class="fas fa-robot"></i>
      </div>
      <div class="message-content">
        <p>${escapeHTML(message)}</p>
      </div>
    `;
  }
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
  const messagesContainer = document.getElementById('aiChatMessages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'ai-message typing-indicator';
  typingDiv.id = 'typingIndicator';
  typingDiv.innerHTML = `
    <div class="message-avatar">
      <i class="fas fa-robot"></i>
    </div>
    <div class="message-content">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function generateAIResponse(userMessage) {
  // Simple AI response generator (replace with actual AI API)
  const responses = {
    anxiety: [
      "I understand that you're feeling anxious. It's completely normal to experience anxiety. Let's try some breathing exercises together. Take a deep breath in for 4 counts, hold for 4, and exhale for 6. Would you like to tell me more about what's causing these feelings?",
      "Anxiety can be overwhelming, but you're not alone in this. What you're feeling is valid. Can you identify what might be triggering these anxious thoughts right now?",
      "Thank you for sharing that with me. Anxiety is your mind's way of trying to protect you, but sometimes it can feel too intense. What usually helps you feel more grounded?"
    ],
    motivation: [
      "I believe in your strength and resilience. Even reaching out today shows your courage. What's one small step you could take right now that would make you feel accomplished?",
      "Motivation can ebb and flow, and that's perfectly natural. You've overcome challenges before, and you have that same strength within you now. What's something you're grateful for today?",
      "Sometimes motivation starts with self-compassion. You're doing the best you can with what you have right now, and that's enough. What would you tell a good friend in your situation?"
    ],
    emotions: [
      "Processing emotions is a brave and important step. Emotions are information - they tell us something about our needs and experiences. What emotion feels strongest for you right now?",
      "It's wonderful that you want to understand your emotions better. There's no wrong way to feel. Can you describe what you're experiencing in your body when these emotions arise?",
      "Emotions can feel overwhelming sometimes, but naming them can help reduce their intensity. Would you like to explore what might be underneath these feelings?"
    ],
    default: [
      "Thank you for sharing that with me. I'm here to listen and support you. How are you feeling right now?",
      "I appreciate you opening up. Your feelings and experiences are important. What would be most helpful for you in this moment?",
      "It sounds like you're going through something significant. I'm here to support you through this. Would you like to explore this feeling more?",
      "Thank you for trusting me with your thoughts. Every step toward understanding yourself better is valuable. What's on your mind?"
    ]
  };
  
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
    return responses.anxiety[Math.floor(Math.random() * responses.anxiety.length)];
  } else if (lowerMessage.includes('motivation') || lowerMessage.includes('motivated') || lowerMessage.includes('energy')) {
    return responses.motivation[Math.floor(Math.random() * responses.motivation.length)];
  } else if (lowerMessage.includes('emotion') || lowerMessage.includes('feel') || lowerMessage.includes('process')) {
    return responses.emotions[Math.floor(Math.random() * responses.emotions.length)];
  } else {
    return responses.default[Math.floor(Math.random() * responses.default.length)];
  }
}

function startAIVoiceInput() {
  const voiceBtn = document.getElementById('aiChatVoiceBtn');
  const input = document.getElementById('aiChatInput');
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Speech recognition is not supported in your browser. Please type your message instead.');
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  voiceBtn.innerHTML = '<i class="fas fa-stop recording"></i>';
  voiceBtn.classList.add('recording');
  
  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    input.value = transcript;
  };
  
  recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
    alert('Speech recognition failed. Please try again.');
  };
  
  recognition.onend = function() {
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceBtn.classList.remove('recording');
  };
  
  recognition.start();
}

// Voice Transcription functionality
function initVoiceTranscription() {
  const recordBtn = document.getElementById('recordJournalBtn');
  const logBtn = document.getElementById('logJournalBtn');
  const historyBtn = document.getElementById('viewJournalHistoryBtn');
  
  const voiceSection = document.getElementById('voiceJournalSection');
  const logSection = document.getElementById('logJournalContainer');
  const historySection = document.getElementById('journalHistorySection');
  
  const startTranscriptionBtn = document.getElementById('startTranscriptionBtn');
  const stopTranscriptionBtn = document.getElementById('stopTranscriptionBtn');
  const saveTranscriptionBtn = document.getElementById('saveTranscriptionBtn');
  const discardTranscriptionBtn = document.getElementById('discardTranscriptionBtn');
  
  const submitJournalBtn = document.getElementById('submitJournalLog');
  const cancelJournalBtn = document.getElementById('cancelJournalLog');
  const closeHistoryBtn = document.getElementById('closeJournalHistoryBtn');
  
  // Voice recording variables
  let recognition = null;
  let isRecording = false;
  let transcriptionText = '';
  
  // Button event listeners
  if (recordBtn) {
    recordBtn.addEventListener('click', () => showVoiceJournalSection());
  }
  
  if (logBtn) {
    logBtn.addEventListener('click', () => showLogJournalSection());
  }
  
  if (historyBtn) {
    historyBtn.addEventListener('click', () => showJournalHistorySection());
  }
  
  if (startTranscriptionBtn) {
    startTranscriptionBtn.addEventListener('click', startVoiceRecording);
  }
  
  if (stopTranscriptionBtn) {
    stopTranscriptionBtn.addEventListener('click', stopVoiceRecording);
  }
  
  if (saveTranscriptionBtn) {
    saveTranscriptionBtn.addEventListener('click', saveVoiceJournal);
  }
  
  if (discardTranscriptionBtn) {
    discardTranscriptionBtn.addEventListener('click', discardVoiceJournal);
  }
  
  if (submitJournalBtn) {
    submitJournalBtn.addEventListener('click', saveManualJournal);
  }
  
  if (cancelJournalBtn) {
    cancelJournalBtn.addEventListener('click', hideAllJournalSections);
  }
  
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', hideAllJournalSections);
  }
  
  function showVoiceJournalSection() {
    hideAllJournalSections();
    if (voiceSection) {
      voiceSection.style.display = 'block';
    }
  }
  
  function showLogJournalSection() {
    hideAllJournalSections();
    if (logSection) {
      logSection.style.display = 'block';
    }
  }
  
  function showJournalHistorySection() {
    hideAllJournalSections();
    if (historySection) {
      historySection.style.display = 'block';
      loadJournalHistoryInRecord();
    }
  }
  
  function hideAllJournalSections() {
    [voiceSection, logSection, historySection].forEach(section => {
      if (section) {
        section.style.display = 'none';
      }
    });
    
    // Reset voice recording state
    if (isRecording) {
      stopVoiceRecording();
    }
    resetVoiceRecordingUI();
  }
    function startVoiceRecording() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showNotification('Speech recognition is not supported in your browser. Please use manual entry instead.', 'error');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = function() {
      isRecording = true;
      updateVoiceRecordingUI(true);
      transcriptionText = '';
      showNotification('Voice recording started. Speak now...', 'success');
    };
    
    recognition.onresult = function(event) {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update global transcription text with final results
      if (finalTranscript) {
        transcriptionText += finalTranscript;
      }
      
      // Display both final and interim results
      updateTranscriptionDisplay(transcriptionText + interimTranscript);
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Speech recognition failed. Please try again.';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone access denied. Please check your permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
      }
      
      showNotification(errorMessage, 'error');
      stopVoiceRecording();
    };
    
    recognition.onend = function() {
      if (isRecording) {
        // Only show result if we have content, otherwise restart
        if (transcriptionText.trim()) {
          showTranscriptionResult();
        } else {
          // Auto-restart for continuous recording
          try {
            recognition.start();
          } catch (error) {
            console.error('Failed to restart recognition:', error);
            stopVoiceRecording();
          }
        }
      }
    };
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      showNotification('Failed to start voice recording. Please try again.', 'error');
    }
  }
    function stopVoiceRecording() {
    if (recognition && isRecording) {
      isRecording = false;
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
      
      updateVoiceRecordingUI(false);
      
      if (transcriptionText.trim()) {
        showTranscriptionResult();
        showNotification('Voice recording stopped. Review your transcript below.', 'success');
      } else {
        showNotification('No speech detected. Please try recording again.', 'warning');
        resetVoiceRecordingUI();
      }
    }
  }
  
  function updateVoiceRecordingUI(recording) {
    const status = document.getElementById('transcriptionStatus');
    const startBtn = document.getElementById('startTranscriptionBtn');
    const stopBtn = document.getElementById('stopTranscriptionBtn');
    
    if (recording) {
      if (status) status.style.display = 'block';
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'block';
    } else {
      if (status) status.style.display = 'none';
      if (startBtn) startBtn.style.display = 'block';
      if (stopBtn) stopBtn.style.display = 'none';
    }
  }
  
  function updateTranscriptionDisplay(text) {
    const resultDiv = document.getElementById('transcriptionResult');
    const textDiv = resultDiv?.querySelector('.transcription-text');
    
    if (textDiv) {
      textDiv.textContent = text;
    }
  }
  
  function showTranscriptionResult() {
    const resultDiv = document.getElementById('transcriptionResult');
    const actionsDiv = document.getElementById('transcriptionActions');
    const textDiv = resultDiv?.querySelector('.transcription-text');
    
    if (textDiv) {
      textDiv.textContent = transcriptionText;
    }
    
    if (resultDiv) resultDiv.style.display = 'block';
    if (actionsDiv) actionsDiv.style.display = 'block';
  }
  
  function resetVoiceRecordingUI() {
    const resultDiv = document.getElementById('transcriptionResult');
    const actionsDiv = document.getElementById('transcriptionActions');
    
    if (resultDiv) resultDiv.style.display = 'none';
    if (actionsDiv) actionsDiv.style.display = 'none';
    
    transcriptionText = '';
    updateVoiceRecordingUI(false);
  }
  
  function saveVoiceJournal() {
    if (!transcriptionText.trim()) {
      showNotification('No content to save. Please record your journal entry first.', 'warning');
      return;
    }
    
    const journalEntry = {
      id: generateUniqueId(),
      content: transcriptionText.trim(),
      type: 'voice',
      timestamp: new Date().toISOString(),
      sentiment: analyzeSentiment(transcriptionText)
    };
    
    saveJournalEntry(journalEntry);
    showNotification('Voice journal saved successfully!', 'success');
    resetVoiceRecordingUI();
    hideAllJournalSections();
  }
  
  function discardVoiceJournal() {
    transcriptionText = '';
    resetVoiceRecordingUI();
  }
  
  function saveManualJournal() {
    const textArea = document.getElementById('journalDescription');
    const content = textArea?.value.trim();
    
    if (!content) {
      showNotification('Please write your journal entry before saving.', 'warning');
      return;
    }
    
    const journalEntry = {
      id: generateUniqueId(),
      content: content,
      type: 'manual',
      timestamp: new Date().toISOString(),
      sentiment: analyzeSentiment(content)
    };
    
    saveJournalEntry(journalEntry);
    showNotification('Journal entry saved successfully!', 'success');
    
    if (textArea) textArea.value = '';
    hideAllJournalSections();
  }
  
  function saveJournalEntry(entry) {
    try {
      const existingEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      existingEntries.unshift(entry);
      localStorage.setItem('journalEntries', JSON.stringify(existingEntries));
      
      // Also update the history view if it's active
      const historyView = document.getElementById('historyView');
      if (historyView && historyView.classList.contains('active')) {
        loadJournalHistory();
      }
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      showNotification('Failed to save journal entry. Please try again.', 'error');
    }
  }
  
  function loadJournalHistoryInRecord() {
    const container = document.getElementById('journalHistoryContainer');
    const emptyState = document.getElementById('emptyJournalHistory');
    
    if (!container) return;
    
    try {
      const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
      
      if (entries.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      
      if (emptyState) emptyState.style.display = 'none';
      
      // Clear existing content except empty state
      const existingEntries = container.querySelectorAll('.journal-history-entry');
      existingEntries.forEach(entry => entry.remove());
      
      // Display recent entries (limit to 10)
      const recentEntries = entries.slice(0, 10);
      recentEntries.forEach(entry => {
        const entryElement = createJournalHistoryEntry(entry);
        container.appendChild(entryElement);
      });
      
    } catch (error) {
      console.error('Failed to load journal history:', error);
      if (emptyState) {
        emptyState.innerHTML = '<i class="fas fa-exclamation-triangle"></i><p>Failed to load journal history</p>';
        emptyState.style.display = 'block';
      }
    }
  }
  
  function createJournalHistoryEntry(entry) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'journal-history-entry';
    
    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const sentimentIcon = getSentimentIcon(entry.sentiment);
    const sentimentClass = getSentimentClass(entry.sentiment);
    
    entryDiv.innerHTML = `
      <div class="entry-header">
        <div class="entry-meta">
          <span class="entry-date">${formattedDate}</span>
          <span class="entry-time">${formattedTime}</span>
          <span class="entry-type">
            <i class="fas fa-${entry.type === 'voice' ? 'microphone' : 'pen'}"></i>
            ${entry.type === 'voice' ? 'Voice' : 'Written'}
          </span>
        </div>
        <div class="entry-sentiment ${sentimentClass}">
          <i class="fas fa-${sentimentIcon}"></i>
        </div>
      </div>
      <div class="entry-content">
        <p>${escapeHTML(entry.content.substring(0, 150))}${entry.content.length > 150 ? '...' : ''}</p>
      </div>
    `;
    
    entryDiv.addEventListener('click', () => {
      showJournalFullModal(entry);
    });
    
    return entryDiv;
  }
  
  function getSentimentIcon(sentiment) {
    switch (sentiment) {
      case 'positive': return 'smile';
      case 'negative': return 'frown';
      default: return 'meh';
    }
  }
  
  function getSentimentClass(sentiment) {
    switch (sentiment) {
      case 'positive': return 'sentiment-positive';
      case 'negative': return 'sentiment-negative';
      default: return 'sentiment-neutral';
    }
  }
  
  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  function analyzeSentiment(text) {
    // Simple sentiment analysis (can be replaced with more sophisticated analysis)
    const positiveWords = ['happy', 'joy', 'love', 'excited', 'wonderful', 'amazing', 'great', 'good', 'positive', 'thankful', 'grateful', 'blessed', 'content', 'peaceful'];
    const negativeWords = ['sad', 'angry', 'depressed', 'anxious', 'worried', 'stressed', 'upset', 'frustrated', 'terrible', 'awful', 'bad', 'negative', 'hopeless', 'lonely'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
  
  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
  
  function getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'exclamation-triangle';
      case 'warning': return 'exclamation-circle';
      default: return 'info-circle';
    }
  }
}

// Activity Tracking functionality
function initActivityTracking() {
  // Initialize activity tracking forms
  const sleepForm = document.getElementById('sleepForm');
  const hydrationForm = document.getElementById('hydrationForm');
  const screenTimeForm = document.getElementById('screenTimeForm');
  const walkForm = document.getElementById('walkForm');
  
  // Load existing activity data
  loadActivityData();
  
  // Sleep tracking
  if (sleepForm) {
    sleepForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const hours = parseFloat(document.getElementById('sleepHours').value);
      if (hours && hours > 0 && hours <= 24) {
        // Save to localStorage first (for immediate feedback)
        saveActivityData('sleep', hours, 'hours');
        updateActivityDisplay('sleep', hours, 'hours');
        
        // Save to API
        const success = await saveActivityDataToAPI('sleep', hours, 'hours');
        if (success) {
          showNotification('Sleep hours logged successfully!', 'success');
        } else {
          showNotification('Sleep hours saved locally. Will sync when online.', 'warning');
        }
        
        sleepForm.reset();
      } else {
        showNotification('Please enter valid sleep hours (0-24)', 'warning');
      }
    });
  }
  
  // Hydration tracking
  if (hydrationForm) {
    hydrationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const liters = parseFloat(document.getElementById('hydrationLiters').value);
      if (liters && liters > 0) {
        // Save to localStorage first
        saveActivityData('water', liters, 'liters');
        updateActivityDisplay('water', liters, 'liters');
        
        // Save to API
        const success = await saveActivityDataToAPI('water', liters, 'liters');
        if (success) {
          showNotification('Water intake logged successfully!', 'success');
        } else {
          showNotification('Water intake saved locally. Will sync when online.', 'warning');
        }
        
        hydrationForm.reset();
      } else {
        showNotification('Please enter valid water amount', 'warning');
      }
    });
  }
  
  // Screen time tracking
  if (screenTimeForm) {
    screenTimeForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const hours = parseFloat(document.getElementById('screenTimeHours').value);
      if (hours && hours >= 0) {
        // Save to localStorage first
        saveActivityData('screen', hours, 'hours');
        updateActivityDisplay('screen', hours, 'hours');
        
        // Save to API
        const success = await saveActivityDataToAPI('screen', hours, 'hours');
        if (success) {
          showNotification('Screen time logged successfully!', 'success');
        } else {
          showNotification('Screen time saved locally. Will sync when online.', 'warning');
        }
        
        screenTimeForm.reset();
      } else {
        showNotification('Please enter valid screen time hours', 'warning');
      }
    });
  }
  
  // Walk tracking
  if (walkForm) {
    walkForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const steps = parseInt(document.getElementById('walkSteps').value);
      if (steps && steps > 0) {
        // Save to localStorage first
        saveActivityData('walk', steps, 'steps');
        updateActivityDisplay('walk', steps, 'steps');
        
        // Save to API
        const success = await saveActivityDataToAPI('walk', steps, 'steps');
        if (success) {
          showNotification('Steps logged successfully!', 'success');
        } else {
          showNotification('Steps saved locally. Will sync when online.', 'warning');
        }
        
        walkForm.reset();
      } else {
        showNotification('Please enter valid step count', 'warning');
      }
    });
  }
  
  function saveActivityData(type, value, unit) {
    const today = new Date().toISOString().split('T')[0];
    const activityData = JSON.parse(localStorage.getItem('activityData') || '{}');
    
    if (!activityData[today]) {
      activityData[today] = {};
    }
    
    activityData[today][type] = { value, unit };
    localStorage.setItem('activityData', JSON.stringify(activityData));
  }
  
  function loadActivityData() {
    const today = new Date().toISOString().split('T')[0];
    const activityData = JSON.parse(localStorage.getItem('activityData') || '{}');
    const todayData = activityData[today] || {};
    
    // Update displays with today's data
    Object.keys(todayData).forEach(type => {
      const data = todayData[type];
      updateActivityDisplay(type, data.value, data.unit);
    });
    
    // Also fetch from API to get most recent data
    fetchAndDisplayActivityTotals();
  }
  
  function updateActivityDisplay(type, value, unit) {
    const activityItems = document.querySelectorAll('.activity-item');
    
    activityItems.forEach(item => {
      const label = item.querySelector('.activity-label');
      if (label && label.textContent.toLowerCase().includes(type.toLowerCase())) {
        const valueElement = item.querySelector('.activity-value');
        if (valueElement) {
          valueElement.innerHTML = `${value} <span>${unit}</span>`;
        }
      }
    });
  }
}

// Activity API endpoints
const ACTIVITY_API_URL = "https://mindscribe.rojan.hackclub.app/log-activity";
const ACTIVITY_HISTORY_API_URL = "https://mindscribe.rojan.hackclub.app/activity-history";

// Global function to fetch and display activity totals
async function fetchAndDisplayActivityTotals() {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    console.log('No user email found for activity tracking');
    return;
  }

  try {
    const response = await fetch(`${ACTIVITY_HISTORY_API_URL}?user_email=${encodeURIComponent(userEmail)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch activity history');
    }
    
    const data = await response.json();
    const totals = data.totals || {};
    
    // Update activity displays with fetched data
    updateActivityTotalsDisplay(totals);
    
    console.log('Activity totals loaded:', totals);
  } catch (error) {
    console.error('Error fetching activity totals:', error);
    // Load from localStorage as fallback
    loadActivityDataFromLocalStorage();
  }
}

// Update activity totals display
function updateActivityTotalsDisplay(totals) {
  const activityMappings = {
    'sleep': { label: 'Sleep', unit: 'hours' },
    'hydration': { label: 'Water', unit: 'liters' },
    'screen_time': { label: 'Screen', unit: 'hours' },
    'walk': { label: 'Walk', unit: 'steps' }
  };

  const activityItems = document.querySelectorAll('.activity-item');
  
  activityItems.forEach(item => {
    const label = item.querySelector('.activity-label');
    if (label) {
      const labelText = label.textContent.toLowerCase();
      
      // Find matching activity type
      let activityType = null;
      let activityData = null;
      
      for (const [key, mapping] of Object.entries(activityMappings)) {
        if (labelText.includes(mapping.label.toLowerCase())) {
          activityType = key;
          activityData = mapping;
          break;
        }
      }
      
      if (activityType && activityData) {
        const valueElement = item.querySelector('.activity-value');
        if (valueElement) {
          const value = totals[activityType] || 0;
          valueElement.innerHTML = `${value} <span>${activityData.unit}</span>`;
        }
      }
    }
  });
}

// Load activity data from localStorage as fallback
function loadActivityDataFromLocalStorage() {
  const today = new Date().toISOString().split('T')[0];
  const activityData = JSON.parse(localStorage.getItem('activityData') || '{}');
  const todayData = activityData[today] || {};
  
  // Convert localStorage format to API format
  const totals = {
    sleep: todayData.sleep?.value || 0,
    hydration: todayData.water?.value || 0,
    screen_time: todayData.screen?.value || 0,
    walk: todayData.walk?.value || 0
  };
  
  updateActivityTotalsDisplay(totals);
}

// Enhanced saveActivityData function with API integration
async function saveActivityDataToAPI(type, value, unit) {
  const userEmail = localStorage.getItem('userEmail');
  if (!userEmail) {
    console.error('No user email found for activity logging');
    return false;
  }

  // Map internal types to API types
  const typeMapping = {
    'sleep': 'sleep',
    'water': 'hydration',
    'screen': 'screen_time',
    'walk': 'walk'
  };

  const apiType = typeMapping[type] || type;
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch(ACTIVITY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        user_email: userEmail,
        activity: apiType,
        count: value,
        timestamp: timestamp
      })
    });

    if (!response.ok) {
      throw new Error('Failed to log activity to API');
    }

    console.log(`Activity logged to API: ${apiType} = ${value} ${unit}`);
    
    // Refresh the totals display
    await fetchAndDisplayActivityTotals();
    
    return true;
  } catch (error) {
    console.error('Error logging activity to API:', error);
    return false;
  }
}

// Food Scanning functionality
function initFoodScanning() {
  // Get user email for API calls
  const userEmail = localStorage.getItem('userEmail');
  
  // DOM Elements
  const startCameraButton = document.getElementById('startCameraButton');
  const captureButton = document.getElementById('captureButton');
  const closePreviewButton = document.getElementById('closePreviewButton');
  const previewContainer = document.getElementById('previewContainer');
  const video = document.getElementById('video');
  const photo = document.getElementById('photo');
  const canvas = document.getElementById('canvas');
  const fileUpload = document.getElementById('fileUpload');
  const results = document.getElementById('results');
  const logFoodButton = document.getElementById('logFoodButton');
  const logFoodContainer = document.getElementById('logFoodContainer');
  const foodDescription = document.getElementById('foodDescription');
  const submitFoodLog = document.getElementById('submitFoodLog');
  const cancelFoodLog = document.getElementById('cancelFoodLog');
  const speechToTextBtn = document.getElementById('speechToTextBtn');
  const speechStatus = document.getElementById('speechStatus');
  
  // Speech recognition setup
  let recognition;
  let isListening = false;
  
  // Initialize speech recognition
  function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      let previousContent = '';
      
      recognition.onresult = function(event) {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        foodDescription.value = previousContent + " " + transcript;
      };
      
      recognition.onstart = function() {
        isListening = true;
        speechStatus.style.display = 'block';
        speechToTextBtn.classList.add('listening');
        previousContent = foodDescription.value.trim();
      };
      
      recognition.onend = function() {
        stopSpeechToText();
      };
      
      recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        stopSpeechToText();
        showNotification(`Speech error: ${event.error}. Try again.`, 'warning');
      };
      
      return true;
    }
    return false;
  }
  
  function startSpeechToText() {
    if (recognition && !isListening) {
      recognition.start();
    }
  }
  
  function stopSpeechToText() {
    if (recognition && isListening) {
      recognition.stop();
    }
    isListening = false;
    speechStatus.style.display = 'none';
    speechToTextBtn.classList.remove('listening');
  }
  
  // Camera functionality
  if (startCameraButton) {
    startCameraButton.addEventListener('click', function() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Camera access is not supported in this browser. Please use a modern browser.', 'warning');
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
          
          video.onloadedmetadata = function() {
            video.play();
          };
        })
        .catch(err => {
          console.error("Error accessing camera: ", err);
          showNotification("Camera access denied. Please check permissions.", 'warning');
        });
    });
  }
  
  // Close preview
  if (closePreviewButton) {
    closePreviewButton.addEventListener('click', function() {
      previewContainer.style.display = 'none';
      
      if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
      }
      
      if (results) {
        results.style.display = 'none';
        results.innerHTML = '';
      }
      
      if (photo) {
        photo.src = '';
      }
    });
  }
  
  // Capture image
  if (captureButton) {
    captureButton.addEventListener('click', takePicture);
  }

  function takePicture() {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    if (!videoWidth || !videoHeight) {
      showNotification("Video stream not ready. Please try again.", 'warning');
      return;
    }
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, videoWidth, videoHeight);
    
    canvas.toBlob(async function(blob) {
      if (!blob) {
        showNotification("Failed to capture image. Please try again.", 'warning');
        return;
      }
      
      const file = new File([blob], "captured_image.png", { type: "image/png" });
      photo.src = URL.createObjectURL(blob);
      photo.style.display = 'block';
      video.style.display = 'none';
      captureButton.style.display = 'none';

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
      showNotification("Please select an image to upload!", 'warning');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      showNotification("Please upload a valid image file (JPEG or PNG).", 'warning');
      return;
    }

    if (file.size > maxSize) {
      showNotification("File size must be less than 5MB.", 'warning');
      return;
    }

    photo.src = URL.createObjectURL(file);
    photo.style.display = 'block';
    video.style.display = 'none';
    previewContainer.style.display = 'block';
    
    analyzeFood(file);
  }
  
  // Manual food logging
  if (logFoodButton) {
    logFoodButton.addEventListener('click', function() {
      logFoodContainer.style.display = 'block';
      document.querySelector('.action-buttons').style.display = 'none';
    });
  }
  
  if (cancelFoodLog) {
    cancelFoodLog.addEventListener('click', function() {
      logFoodContainer.style.display = 'none';
      foodDescription.value = '';
      document.querySelector('.action-buttons').style.display = 'flex';
      stopSpeechToText();
    });
  }
  
  if (submitFoodLog) {
    submitFoodLog.addEventListener('click', function() {
      const foodText = foodDescription.value.trim();
      
      if (!foodText) {
        showNotification("Please enter a food description", 'warning');
        return;
      }
      
      logFoodContainer.style.display = 'none';
      analyzeFoodByText(foodText);
    });
  }
  
  // Speech to text
  if (speechToTextBtn) {
    initSpeechRecognition();
    speechToTextBtn.addEventListener('click', function() {
      if (isListening) {
        stopSpeechToText();
      } else {
        startSpeechToText();
      }
    });
  }
  
  // Analyze food by image
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
      let percentage = 0;
      const percentageEl = document.querySelector('.percentage');
      const percentageInterval = setInterval(() => {
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

      const response = await fetch(`${CONFIG.BACKEND_BASE_URL}/analyze-food`, {
        method: 'POST',
        body: formData
      });

      clearInterval(percentageInterval);
      percentageEl.textContent = '100%';

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      displayResults(data);

    } catch (error) {
      console.error('Error:', error);
      results.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3>Analysis Failed</h3>
          <p>We couldn't analyze your image. Please try again with a clearer photo.</p>
          <button class="action-btn secondary" style="margin-top: 20px;" onclick="document.getElementById('results').style.display = 'none';">
            Try Again
          </button>
        </div>
      `;
    }
  }
  
  // Analyze food by text description
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
      let percentage = 0;
      const percentageEl = document.querySelector('.percentage');
      const percentageInterval = setInterval(() => {
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

      const response = await fetch(`${CONFIG.BACKEND_BASE_URL}/log-food`, {
        method: 'POST',
        body: formData
      });

      clearInterval(percentageInterval);
      percentageEl.textContent = '100%';

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      displayResults(data);
      
      document.querySelector('.action-buttons').style.display = 'flex';

    } catch (error) {
      console.error('Error:', error);
      results.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3>Analysis Failed</h3>
          <p>We couldn't analyze your food description. Please try again with more details.</p>
          <button class="action-btn secondary" style="margin-top: 20px;" onclick="document.querySelector('.action-buttons').style.display = 'flex'; document.getElementById('logFoodContainer').style.display = 'none'; document.getElementById('results').style.display = 'none';">
            Try Again
          </button>
        </div>
      `;
    }
  }
  
  // Display analysis results
  function displayResults(data) {
    if (!data.foods || data.foods.length === 0) {
      results.innerHTML = `
        <div class="results-header">
          <h2>No Food Detected</h2>
          <p>We couldn't identify any food items in this image. Please try a clearer photo.</p>
        </div>
      `;
      return;
    }

    const totalCalories = data.overall_calories;
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
              <div class="health-bar">
                <div class="health-fill" style="width: ${healthWidth}"></div>
              </div>
              <span class="health-score">${food.health_score}/10</span>
            </div>
          </div>
          <div class="food-calories">
            <span class="calories-value">${food.estimated_calories}</span>
            <span class="calories-unit">cal</span>
          </div>
        </div>
      `;
    });

    html += '</div>';
    results.innerHTML = html;
    
    showNotification('Food analysis complete!', 'success');
  }
}

// Exercise Search functionality
function initExerciseSearch() {
  const exerciseSearchInput = document.getElementById('exerciseSearchInput');
  const startSearchBtn = document.getElementById('startSearchBtn');
  const wizardSteps = document.querySelectorAll('.wizard-step');
  const wizardBtns = document.querySelectorAll('.wizard-btn');
  const optionItems = document.querySelectorAll('.option-item');
  
  let searchData = {
    query: '',
    type: '',
    muscle: ''
  };
  
  // Show specific wizard step
  function showStep(stepNumber) {
    wizardSteps.forEach(step => step.classList.remove('active'));
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
      targetStep.classList.add('active');
    }
  }
  
  // Initial search functionality
  if (startSearchBtn) {
    startSearchBtn.addEventListener('click', function() {
      const query = exerciseSearchInput.value.trim();
      if (query) {
        searchData.query = query;
        showStep(2);
      } else {
        showNotification('Please enter an exercise name to search', 'warning');
      }
    });
  }
  
  if (exerciseSearchInput) {
    exerciseSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        startSearchBtn.click();
      }
    });
  }
  
  // Wizard navigation
  wizardBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const step = this.dataset.step;
      
      if (step === 'search') {
        performExerciseSearch();
      } else {
        showStep(parseInt(step));
      }
    });
  });
  
  // Option selection
  optionItems.forEach(item => {
    item.addEventListener('click', function() {
      const parent = this.closest('.wizard-step');
      const siblingItems = parent.querySelectorAll('.option-item');
      
      siblingItems.forEach(sibling => sibling.classList.remove('selected'));
      this.classList.add('selected');
      
      const value = this.dataset.value;
      const stepId = parent.id;
      
      if (stepId === 'step-2') {
        searchData.type = value;
      } else if (stepId === 'step-3') {
        searchData.muscle = value;
      }
    });
  });
  // Perform exercise search
  async function performExerciseSearch() {
    const exerciseCard = document.querySelector('.exercise-card');
    const originalContent = exerciseCard.innerHTML;
    
    try {
      // Show loading state
      exerciseCard.innerHTML = `
        <div class="card-header">
          <i class="fas fa-dumbbell"></i>
          <span>Find Exercises</span>
        </div>
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Searching for exercises...</p>
        </div>
      `;
      
      // Prepare form data for backend API
      const formData = new FormData();
      if (searchData.query) formData.append('name', searchData.query);
      if (searchData.type) formData.append('type', searchData.type);
      if (searchData.muscle) formData.append('muscle', searchData.muscle);
      
      // Call the backend API (which securely handles the API Ninjas key)
      const response = await fetch(`${CONFIG.BACKEND_BASE_URL}/exercises`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.exercises && data.exercises.length > 0) {
        displayExerciseResults(data.exercises);
        showNotification(`Found ${data.exercises.length} exercises!`, 'success');
      } else {
        displayNoResults();
      }
      
    } catch (error) {
      console.error('Error searching exercises:', error);
      exerciseCard.innerHTML = `
        <div class="card-header">
          <i class="fas fa-dumbbell"></i>
          <span>Find Exercises</span>
        </div>
        <div class="error-state">
          <div class="error-icon">
            <i class="fas fa-exclamation-circle"></i>
          </div>
          <h3>Search Failed</h3>
          <p>We couldn't find exercises at the moment. Please try again later.</p>
          <button class="action-btn primary" onclick="location.reload()">
            <i class="fas fa-refresh"></i>
            Try Again
          </button>
        </div>
      `;
    }  }
  
  // Display no results
  function displayNoResults() {
    const exerciseCard = document.querySelector('.exercise-card');
    exerciseCard.innerHTML = `
      <div class="card-header">
        <i class="fas fa-dumbbell"></i>
        <span>Find Exercises</span>
      </div>
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-search"></i>
        </div>
        <h3>No Exercises Found</h3>
        <p>Try searching with different terms or muscle groups.</p>
        <button class="action-btn primary" onclick="location.reload()">
          <i class="fas fa-search"></i>
          Search Again
        </button>
      </div>
    `;
  }
  
  // Display exercise search results
  function displayExerciseResults(exercises) {
    const exerciseCard = document.querySelector('.exercise-card');
    
    let html = `
      <div class="card-header">
        <i class="fas fa-dumbbell"></i>
        <span>Exercise Results (${exercises.length})</span>
        <button class="action-btn secondary" onclick="location.reload()" style="margin-left: auto;">
          <i class="fas fa-search"></i>
          New Search
        </button>
      </div>
      <div class="exercise-results">
    `;
    
    exercises.slice(0, 10).forEach(exercise => { // Limit to 10 results
      html += `
        <div class="exercise-item">
          <div class="exercise-header">
            <h4>${exercise.name}</h4>
            <div class="exercise-badges">
              <span class="badge type">${exercise.type}</span>
              <span class="badge muscle">${exercise.muscle}</span>
              <span class="badge difficulty">${exercise.difficulty}</span>
            </div>
          </div>
          <div class="exercise-details">
            <p><strong>Equipment:</strong> ${exercise.equipment}</p>
            <p><strong>Instructions:</strong> ${exercise.instructions}</p>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    exerciseCard.innerHTML = html;
  }
}