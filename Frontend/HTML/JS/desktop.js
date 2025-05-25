// Desktop JavaScript for MindScribe

document.addEventListener('DOMContentLoaded', function() {
  console.log('Desktop app initializing...');
  
  // Ensure homeView is visible immediately
  const homeView = document.getElementById('homeView');
  if (homeView && !homeView.classList.contains('active')) {
    homeView.classList.add('active');
    console.log('HomeView activated');
  }
  
  // Initialize desktop functionality
  initNavigation();
  initSigninTracker();
  initFreeWriting();
  initRefreshButton();
  initUserEmail();
  initHistoryView();
  initProfileView();
  initAIChat();
  initVoiceTranscription();
  initActivityTracking();
  initFoodScanning();
  initExerciseSearch();
  
  console.log('Desktop app initialization complete');
});

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

  function switchView(viewId) {
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
      }
    } else {
      console.error('Target view not found:', viewId);
    }
  }
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

// Settings button functionality
document.addEventListener('click', function(e) {
  if (e.target.closest('.settings-btn')) {
    // Settings functionality to be implemented
    console.log('Settings clicked');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + Number keys for navigation
  if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
    e.preventDefault();
    const views = ['homeView', 'activityView', 'recordView', 'historyView', 'profileView'];
    const viewIndex = parseInt(e.key) - 1;
    if (views[viewIndex]) {
      const menuItem = document.querySelector(`.menu-item[data-view="${views[viewIndex]}"]`);
      if (menuItem) {
        menuItem.click();
      }
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
      
      transcriptionText = finalTranscript;
      updateTranscriptionDisplay(finalTranscript + interimTranscript);
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      showNotification('Speech recognition failed. Please try again.', 'error');
      stopVoiceRecording();
    };
    
    recognition.onend = function() {
      if (isRecording) {
        // Restart recognition if user is still recording
        recognition.start();
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
      recognition.stop();
      updateVoiceRecordingUI(false);
      
      if (transcriptionText.trim()) {
        showTranscriptionResult();
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
    sleepForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const hours = parseFloat(document.getElementById('sleepHours').value);
      if (hours && hours > 0 && hours <= 24) {
        saveActivityData('sleep', hours, 'hours');
        updateActivityDisplay('sleep', hours, 'hours');
        showNotification('Sleep hours logged successfully!', 'success');
        sleepForm.reset();
      } else {
        showNotification('Please enter valid sleep hours (0-24)', 'warning');
      }
    });
  }
  
  // Hydration tracking
  if (hydrationForm) {
    hydrationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const liters = parseFloat(document.getElementById('hydrationLiters').value);
      if (liters && liters > 0) {
        saveActivityData('water', liters, 'liters');
        updateActivityDisplay('water', liters, 'liters');
        showNotification('Water intake logged successfully!', 'success');
        hydrationForm.reset();
      } else {
        showNotification('Please enter valid water amount', 'warning');
      }
    });
  }
  
  // Screen time tracking
  if (screenTimeForm) {
    screenTimeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const hours = parseFloat(document.getElementById('screenTimeHours').value);
      if (hours && hours >= 0) {
        saveActivityData('screen', hours, 'hours');
        updateActivityDisplay('screen', hours, 'hours');
        showNotification('Screen time logged successfully!', 'success');
        screenTimeForm.reset();
      } else {
        showNotification('Please enter valid screen time hours', 'warning');
      }
    });
  }
  
  // Walk tracking
  if (walkForm) {
    walkForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const steps = parseInt(document.getElementById('walkSteps').value);
      if (steps && steps > 0) {
        saveActivityData('walk', steps, 'steps');
        updateActivityDisplay('walk', steps, 'steps');
        showNotification('Steps logged successfully!', 'success');
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
  }
  
  function updateActivityDisplay(type, value, unit) {
    const activityItems = document.querySelectorAll('.activity-item');
    
    activityItems.forEach(item => {
      const label = item.querySelector('.activity-label');
      if (label && label.textContent.toLowerCase().includes(type.toLowerCase())) {
        const valueElement = item.querySelector('.activity-value');
        if (valueElement) {
          const span = valueElement.querySelector('span');
          valueElement.innerHTML = `${value} <span>${unit}</span>`;
        }
      }
    });
  }
}

// Food Scanning functionality
function initFoodScanning() {
  const startCameraBtn = document.getElementById('startCameraButton');
  const logFoodBtn = document.getElementById('logFoodButton');
  const fileUpload = document.getElementById('fileUpload');
  const closePreviewBtn = document.getElementById('closePreviewButton');
  const captureBtn = document.getElementById('captureButton');
  const submitFoodLogBtn = document.getElementById('submitFoodLog');
  const cancelFoodLogBtn = document.getElementById('cancelFoodLog');
  const speechToTextBtn = document.getElementById('speechToTextBtn');
  
  const previewContainer = document.getElementById('previewContainer');
  const logFoodContainer = document.getElementById('logFoodContainer');
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const photo = document.getElementById('photo');
  const resultsContainer = document.getElementById('results');
  
  let currentStream = null;
  
  // Start camera
  if (startCameraBtn) {
    startCameraBtn.addEventListener('click', startCamera);
  }
  
  // Show manual food logging
  if (logFoodBtn) {
    logFoodBtn.addEventListener('click', () => {
      logFoodContainer.style.display = 'block';
    });
  }
  
  // File upload
  if (fileUpload) {
    fileUpload.addEventListener('change', handleFileUpload);
  }
  
  // Close preview
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', closeCamera);
  }
  
  // Capture photo
  if (captureBtn) {
    captureBtn.addEventListener('click', capturePhoto);
  }
  
  // Submit food log
  if (submitFoodLogBtn) {
    submitFoodLogBtn.addEventListener('click', submitFoodLog);
  }
  
  // Cancel food log
  if (cancelFoodLogBtn) {
    cancelFoodLogBtn.addEventListener('click', () => {
      logFoodContainer.style.display = 'none';
      document.getElementById('foodDescription').value = '';
    });
  }
  
  // Speech to text for food description
  if (speechToTextBtn) {
    speechToTextBtn.addEventListener('click', startFoodSpeechRecognition);
  }
  
  async function startCamera() {
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      video.srcObject = currentStream;
      previewContainer.style.display = 'block';
      captureBtn.style.display = 'block';
    } catch (error) {
      console.error('Error accessing camera:', error);
      showNotification('Camera access denied. Please upload a photo instead.', 'error');
    }
  }
  
  function closeCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      currentStream = null;
    }
    previewContainer.style.display = 'none';
    photo.style.display = 'none';
    video.style.display = 'block';
    captureBtn.style.display = 'none';
    resultsContainer.style.display = 'none';
  }
  
  function capturePhoto() {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    photo.src = imageData;
    photo.style.display = 'block';
    video.style.display = 'none';
    captureBtn.style.display = 'none';
    
    // Process the image
    processFoodImage(imageData);
  }
  
  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        processFoodImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
  
  function processFoodImage(imageData) {
    // Show loading state
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div class="food-analysis-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Analyzing your food...</p>
      </div>
    `;
    
    // Simulate food analysis (replace with actual API call)
    setTimeout(() => {
      const mockAnalysis = generateMockFoodAnalysis();
      displayFoodResults(mockAnalysis);
    }, 2000);
  }
  
  function generateMockFoodAnalysis() {
    const foods = [
      { name: 'Grilled Chicken Breast', calories: 250, protein: 25, carbs: 0, fat: 14 },
      { name: 'Caesar Salad', calories: 180, protein: 8, carbs: 12, fat: 14 },
      { name: 'Banana', calories: 90, protein: 1, carbs: 23, fat: 0 },
      { name: 'Sandwich', calories: 320, protein: 15, carbs: 42, fat: 12 },
      { name: 'Apple', calories: 80, protein: 0, carbs: 22, fat: 0 }
    ];
    
    return foods[Math.floor(Math.random() * foods.length)];
  }
  
  function displayFoodResults(analysis) {
    resultsContainer.innerHTML = `
      <div class="food-analysis-result">
        <h4><i class="fas fa-utensils"></i> Food Analysis</h4>
        <div class="food-info">
          <h5>${analysis.name}</h5>
          <div class="nutrition-grid">
            <div class="nutrition-item">
              <span class="nutrition-label">Calories</span>
              <span class="nutrition-value">${analysis.calories}</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Protein</span>
              <span class="nutrition-value">${analysis.protein}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Carbs</span>
              <span class="nutrition-value">${analysis.carbs}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Fat</span>
              <span class="nutrition-value">${analysis.fat}g</span>
            </div>
          </div>
          <div class="food-actions">
            <button class="action-btn primary" onclick="saveFoodLog('${analysis.name}', ${analysis.calories})">
              <i class="fas fa-save"></i> Save to Log
            </button>
            <button class="action-btn secondary" onclick="retakePhoto()">
              <i class="fas fa-camera"></i> Retake
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  function submitFoodLog() {
    const description = document.getElementById('foodDescription').value.trim();
    if (!description) {
      showNotification('Please describe your food first.', 'warning');
      return;
    }
    
    // Save food log
    const foodEntry = {
      id: generateUniqueId(),
      description: description,
      timestamp: new Date().toISOString(),
      type: 'manual'
    };
    
    saveFoodEntry(foodEntry);
    showNotification('Food log saved successfully!', 'success');
    
    // Reset form
    document.getElementById('foodDescription').value = '';
    logFoodContainer.style.display = 'none';
  }
  
  function startFoodSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showNotification('Speech recognition is not supported in your browser.', 'error');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    const speechStatus = document.getElementById('speechStatus');
    speechStatus.style.display = 'block';
    
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      document.getElementById('foodDescription').value = transcript;
      speechStatus.style.display = 'none';
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      showNotification('Speech recognition failed. Please try again.', 'error');
      speechStatus.style.display = 'none';
    };
    
    recognition.onend = function() {
      speechStatus.style.display = 'none';
    };
    
    recognition.start();
  }
  
  function saveFoodEntry(entry) {
    try {
      const existingEntries = JSON.parse(localStorage.getItem('foodEntries') || '[]');
      existingEntries.unshift(entry);
      localStorage.setItem('foodEntries', JSON.stringify(existingEntries));
    } catch (error) {
      console.error('Failed to save food entry:', error);
      showNotification('Failed to save food entry. Please try again.', 'error');
    }
  }
}

// Global functions for food scanning
function saveFoodLog(foodName, calories) {
  const foodEntry = {
    id: generateUniqueId(),
    description: foodName,
    calories: calories,
    timestamp: new Date().toISOString(),
    type: 'photo'
  };
  
  try {
    const existingEntries = JSON.parse(localStorage.getItem('foodEntries') || '[]');
    existingEntries.unshift(foodEntry);
    localStorage.setItem('foodEntries', JSON.stringify(existingEntries));
    showNotification('Food logged successfully!', 'success');
  } catch (error) {
    console.error('Failed to save food entry:', error);
    showNotification('Failed to save food entry. Please try again.', 'error');
  }
}

function retakePhoto() {
  const video = document.getElementById('video');
  const photo = document.getElementById('photo');
  const captureBtn = document.getElementById('captureButton');
  const resultsContainer = document.getElementById('results');
  
  photo.style.display = 'none';
  video.style.display = 'block';
  captureBtn.style.display = 'block';
  resultsContainer.style.display = 'none';
}

// Exercise Search functionality
function initExerciseSearch() {
  const searchInput = document.getElementById('exerciseSearchInput');
  const searchBtn = document.getElementById('startSearchBtn');
  const typeOptions = document.querySelectorAll('#typeOptions .option-item');
  const muscleOptions = document.querySelectorAll('.muscle-option');
  const wizardBtns = document.querySelectorAll('.wizard-btn');
  
  let selectedType = '';
  let selectedMuscle = '';
  let searchQuery = '';
  
  // Search input
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        startExerciseSearch();
      }
    });
  }
  
  if (searchBtn) {
    searchBtn.addEventListener('click', startExerciseSearch);
  }
  
  // Type selection
  typeOptions.forEach(option => {
    option.addEventListener('click', function() {
      typeOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      selectedType = this.dataset.value;
    });
  });
  
  // Muscle selection
  muscleOptions.forEach(option => {
    option.addEventListener('click', function() {
      muscleOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      selectedMuscle = this.dataset.value;
    });
  });
  
  // Wizard navigation
  wizardBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetStep = this.dataset.step;
      
      if (targetStep === 'search') {
        performExerciseSearch();
      } else {
        showWizardStep(targetStep);
      }
    });
  });
  
  function startExerciseSearch() {
    searchQuery = searchInput ? searchInput.value.trim() : '';
    if (!searchQuery) {
      showNotification('Please enter an exercise name to search.', 'warning');
      return;
    }
    showWizardStep('2');
  }
  
  function showWizardStep(stepNumber) {
    const steps = document.querySelectorAll('.wizard-step');
    steps.forEach(step => step.classList.remove('active'));
    
    const targetStep = document.getElementById(`step-${stepNumber}`);
    if (targetStep) {
      targetStep.classList.add('active');
    }
  }
  
  async function performExerciseSearch() {
    try {
      // Show loading state
      showExerciseResults(`
        <div class="exercise-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Searching for exercises...</p>
        </div>
      `);
      
      // For demo purposes, use mock data. Replace with actual API call to exercise database
      setTimeout(() => {
        const mockResults = generateMockExerciseResults();
        displayExerciseResults(mockResults);
      }, 1500);
      
    } catch (error) {
      console.error('Exercise search error:', error);
      showNotification('Failed to search exercises. Please try again.', 'error');
    }
  }
  
  function generateMockExerciseResults() {
    const exercises = [
      {
        name: 'Push-ups',
        type: 'strength',
        muscle: 'chest',
        difficulty: 'beginner',
        instructions: 'Start in a plank position, lower your body until your chest nearly touches the floor, then push back up.',
        equipment: 'None'
      },
      {
        name: 'Squats',
        type: 'strength',
        muscle: 'legs',
        difficulty: 'beginner',
        instructions: 'Stand with feet shoulder-width apart, lower your body as if sitting back into a chair, then return to standing.',
        equipment: 'None'
      },
      {
        name: 'Bicep Curls',
        type: 'strength',
        muscle: 'biceps',
        difficulty: 'beginner',
        instructions: 'Hold weights at your sides, curl them up toward your shoulders, then lower back down.',
        equipment: 'Dumbbells'
      },
      {
        name: 'Planks',
        type: 'strength',
        muscle: 'abdominals',
        difficulty: 'intermediate',
        instructions: 'Hold a push-up position with your body in a straight line from head to heels.',
        equipment: 'None'
      },
      {
        name: 'Running',
        type: 'cardio',
        muscle: 'legs',
        difficulty: 'beginner',
        instructions: 'Maintain a steady pace while keeping good form and breathing rhythm.',
        equipment: 'None'
      }
    ];
    
    // Filter based on selections
    let filtered = exercises;
    
    if (searchQuery) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.muscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedType) {
      filtered = filtered.filter(ex => ex.type === selectedType);
    }
    
    if (selectedMuscle) {
      filtered = filtered.filter(ex => ex.muscle === selectedMuscle);
    }
    
    return filtered.slice(0, 6); // Limit results
  }
  
  function displayExerciseResults(exercises) {
    if (exercises.length === 0) {
      showExerciseResults(`
        <div class="no-exercises">
          <i class="fas fa-search"></i>
          <p>No exercises found. Try adjusting your search criteria.</p>
        </div>
      `);
      return;
    }
    
    const resultsHTML = exercises.map(exercise => `
      <div class="exercise-result-card">
        <div class="exercise-header">
          <h4>${exercise.name}</h4>
          <span class="exercise-type">${exercise.type}</span>
        </div>
        <div class="exercise-info">
          <div class="exercise-meta">
            <span><i class="fas fa-dumbbell"></i> ${exercise.muscle}</span>
            <span><i class="fas fa-signal"></i> ${exercise.difficulty}</span>
            <span><i class="fas fa-tools"></i> ${exercise.equipment}</span>
          </div>
          <p class="exercise-instructions">${exercise.instructions}</p>
        </div>
        <div class="exercise-actions">
          <button class="action-btn primary" onclick="saveExercise('${exercise.name}')">
            <i class="fas fa-bookmark"></i> Save
          </button>
          <button class="action-btn secondary" onclick="startExerciseTimer('${exercise.name}')">
            <i class="fas fa-play"></i> Start
          </button>
        </div>
      </div>
    `).join('');
    
    showExerciseResults(`
      <div class="exercise-results">
        <h3>Exercise Results (${exercises.length})</h3>
        <div class="exercise-grid">
          ${resultsHTML}
        </div>
        <div class="search-actions">
          <button class="action-btn outline" onclick="resetExerciseSearch()">
            <i class="fas fa-search"></i> New Search
          </button>
        </div>
      </div>
    `);
  }
  
  function showExerciseResults(html) {
    // Find or create results container
    let resultsContainer = document.querySelector('.exercise-results-container');
    if (!resultsContainer) {
      resultsContainer = document.createElement('div');
      resultsContainer.className = 'exercise-results-container';
      
      const exerciseCard = document.querySelector('.exercise-card');
      if (exerciseCard) {
        exerciseCard.appendChild(resultsContainer);
      }
    }
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
    
    // Hide wizard
    const wizard = document.querySelector('.exercise-wizard');
    if (wizard) {
      wizard.style.display = 'none';
    }
  }
}

// Global functions for exercise search
function saveExercise(exerciseName) {
  const exercise = {
    id: generateUniqueId(),
    name: exerciseName,
    timestamp: new Date().toISOString(),
    saved: true
  };
  
  try {
    const savedExercises = JSON.parse(localStorage.getItem('savedExercises') || '[]');
    
    // Check if already saved
    if (savedExercises.some(ex => ex.name === exerciseName)) {
      showNotification('Exercise already saved!', 'info');
      return;
    }
    
    savedExercises.unshift(exercise);
    localStorage.setItem('savedExercises', JSON.stringify(savedExercises));
    showNotification('Exercise saved successfully!', 'success');
  } catch (error) {
    console.error('Failed to save exercise:', error);
    showNotification('Failed to save exercise. Please try again.', 'error');
  }
}

function startExerciseTimer(exerciseName) {
  showNotification(`Starting timer for ${exerciseName}. Timer feature coming soon!`, 'info');
}

function resetExerciseSearch() {
  // Reset wizard
  const wizard = document.querySelector('.exercise-wizard');
  const resultsContainer = document.querySelector('.exercise-results-container');
  
  if (wizard) wizard.style.display = 'block';
  if (resultsContainer) resultsContainer.style.display = 'none';
  
  // Reset to step 1
  const steps = document.querySelectorAll('.wizard-step');
  steps.forEach(step => step.classList.remove('active'));
  document.getElementById('step-1').classList.add('active');
  
  // Clear selections
  document.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
  document.querySelectorAll('.muscle-option').forEach(opt => opt.classList.remove('selected'));
  
  // Clear search input
  const searchInput = document.getElementById('exerciseSearchInput');
  if (searchInput) searchInput.value = '';
}