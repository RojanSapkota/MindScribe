// Desktop JavaScript for MindScribe

document.addEventListener('DOMContentLoaded', function() {
  // Initialize desktop functionality
  initNavigation();
  initSigninTracker();
  initFreeWriting();
  initRefreshButton();
  initUserEmail();
});

// Navigation functionality
function initNavigation() {
  const menuItems = document.querySelectorAll('.menu-item[data-view]');
  const actionBtns = document.querySelectorAll('.action-btn[data-view]');
  const views = document.querySelectorAll('.desktop-view');

  // Handle menu item clicks
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetView = item.dataset.view;
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
    views.forEach(view => {
      view.classList.remove('active');
    });
    
    const targetView = document.getElementById(viewId);
    if (targetView) {
      targetView.classList.add('active');
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