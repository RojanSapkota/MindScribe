// JS for MindScribe Desktop Version
// Handles navigation, theme switching, and dynamic view loading

const viewTemplates = {
  homeView: document.getElementById('homeViewTemplate'),
  activityView: document.getElementById('activityViewTemplate'),
  journalView: document.getElementById('journalViewTemplate'),
  historyView: document.getElementById('historyViewTemplate'),
  profileView: document.getElementById('profileViewTemplate'),
  goalsView: document.getElementById('goalsViewTemplate'),
  bucketListView: document.getElementById('bucketListViewTemplate'),
  settingsView: document.getElementById('settingsViewTemplate'),
  termsView: document.getElementById('termsViewTemplate'),
  aiView: document.getElementById('aiViewTemplate'),
  aitalk: document.getElementById('aitalkViewTemplate'),
  scanView: document.getElementById('scanViewTemplate'),
  dietPlanView: document.getElementById('dietPlanViewTemplate'),
};

// --- API SERVER ---
const api_server = 'https://mindscribe.rojan.hackclub.app';

// --- Helper: Get user email ---
function getUserEmail() {
  return localStorage.getItem('userEmail') || '';
}

// --- ACTIVITY API ---
async function logActivityDesktop(type, value) {
  const user_email = getUserEmail();
  if (!user_email) throw new Error('Not logged in');
  const resp = await fetch(`${api_server}/log-activity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ user_email, type, value })
  });
  if (!resp.ok) throw new Error('Failed to log activity');
  return await resp.json();
}
async function fetchActivityHistoryDesktop() {
  const user_email = getUserEmail();
  if (!user_email) throw new Error('Not logged in');
  const resp = await fetch(`${api_server}/activity-history?user_email=${encodeURIComponent(user_email)}`);
  if (!resp.ok) throw new Error('Failed to fetch activity history');
  return await resp.json();
}

// --- FOOD SCAN API ---
async function analyzeFoodByTextDesktop(foodText) {
  const user_email = getUserEmail();
  if (!user_email) throw new Error('Not logged in');
  const formData = new FormData();
  formData.append('user_email', user_email);
  formData.append('food_text', foodText);
  const resp = await fetch(`${api_server}/log-food`, { method: 'POST', body: formData });
  if (!resp.ok) throw new Error('Failed to analyze food');
  return await resp.json();
}
async function analyzeFoodImageDesktop(file) {
  const user_email = getUserEmail();
  if (!user_email) throw new Error('Not logged in');
  const formData = new FormData();
  formData.append('user_email', user_email);
  formData.append('timestamp', new Date().toISOString());
  formData.append('file', file);
  const resp = await fetch(`${api_server}/analyze-food`, { method: 'POST', body: formData });
  if (!resp.ok) throw new Error('Failed to analyze food image');
  return await resp.json();
}

// --- FOOD HISTORY API ---
async function fetchFoodHistoryDesktop() {
  const user_email = getUserEmail();
  if (!user_email) throw new Error('Not logged in');
  const formData = new FormData();
  formData.append('user_email', user_email);
  const resp = await fetch(`${api_server}/food-history`, { method: 'POST', body: formData });
  if (!resp.ok) throw new Error('Failed to fetch food history');
  return await resp.json();
}

// --- JOURNAL API (stub: implement as needed) ---
async function saveJournalEntryDesktop(text) {
  // TODO: Implement backend endpoint
  // Example: POST to /save-journal
  return { success: true };
}
async function fetchJournalHistoryDesktop() {
  // TODO: Implement backend endpoint
  // Example: GET /journal-history?user_email=...
  return [];
}

// --- AI CHAT API ---
async function sendAIMessageDesktop(question) {
  const resp = await fetch(`${api_server}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  if (!resp.ok) throw new Error('AI failed to respond');
  return await resp.json();
}

// --- DIET PLAN WIZARD API ---
async function requestDietPlanDesktop(data) {
  const resp = await fetch(`${api_server}/diet-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data)
  });
  if (!resp.ok) throw new Error('Failed to request diet plan');
  return await resp.json();
}

function loadView(view) {
  const content = document.getElementById('desktopContent');
  if (viewTemplates[view] && viewTemplates[view].content) {
    content.innerHTML = '';
    content.appendChild(viewTemplates[view].content.cloneNode(true));
    afterViewLoad(view);
  } else {
    content.innerHTML = `<div style="padding:40px;text-align:center;color:#888;">Feature coming soon!</div>`;
  }
}

function afterViewLoad(view) {
  // Home quick actions
  if (view === 'homeView') {
    // Add mobile-style quick action icons and layout
    const quickActions = [
      { icon: 'fa-bolt', label: 'Activity', action: 'activityView', color: '#5D5FEF', bg: 'rgba(93,95,239,0.13)' },
      { icon: 'fa-utensils', label: 'Food Scan', action: 'scanView', color: '#ff7e3f', bg: 'rgba(255,126,63,0.13)' },
      { icon: 'fa-book', label: 'Journal', action: 'journalView', color: '#34D399', bg: 'rgba(52,211,153,0.13)' },
      { icon: 'fa-history', label: 'History', action: 'historyView', color: '#e53e3e', bg: 'rgba(229,62,62,0.13)' },
      { icon: 'fa-robot', label: 'AI Chat', action: 'aiView', color: '#f59e42', bg: 'rgba(245,158,66,0.13)' },
      { icon: 'fa-seedling', label: 'Diet Plan', action: 'dietPlanView', color: '#10b981', bg: 'rgba(16,185,129,0.13)' }
    ];
    const quickActionsRow = document.getElementById('quickActionsRowDesktop');
    if (quickActionsRow) {
      quickActionsRow.innerHTML = quickActions.map(q => `
        <div class="quick-action-card-desktop" data-action="${q.action}" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;background:${q.bg};border-radius:16px;padding:18px 10px;box-shadow:0 2px 8px 0 ${q.bg};cursor:pointer;transition:box-shadow .16s,transform .16s;min-width:90px;min-height:90px;">
          <span style="font-size:2em;color:${q.color};"><i class="fas ${q.icon}"></i></span>
          <span style="font-size:1.04em;font-weight:600;color:#232347;">${q.label}</span>
        </div>
      `).join('');
      quickActionsRow.querySelectorAll('.quick-action-card-desktop').forEach(card => {
        card.onmouseover = () => { card.style.boxShadow = '0 6px 18px 0 rgba(93,95,239,0.18)'; card.style.transform = 'translateY(-2px) scale(1.04)'; };
        card.onmouseleave = () => { card.style.boxShadow = `0 2px 8px 0 ${quickActions.find(q => q.action === card.getAttribute('data-action')).bg}`; card.style.transform = 'none'; };
        card.onclick = () => loadView(card.getAttribute('data-action'));
      });
    }
    // Nutrition style meter and tips carousel logic
    const meter = document.getElementById('nutritionStyleMeterDesktop');
    const label = document.getElementById('nutritionStyleLabelDesktop');
    const refreshBtn = document.getElementById('refreshNutritionStyleDesktop');
    if (refreshBtn && meter && label) {
      refreshBtn.onclick = () => {
        meter.style.width = (30 + Math.random() * 60) + '%';
        label.textContent = 'Analyzed!';
        setTimeout(() => { label.textContent = 'Click to analyze your style'; }, 2000);
      };
    }
    const tips = [
      { icon: 'fa-leaf', title: 'Balanced Diet', text: 'Include a variety of fruits, vegetables, lean proteins, and whole grains in your meals.' },
      { icon: 'fa-water', title: 'Stay Hydrated', text: 'Drink at least 8 glasses of water daily.' },
      { icon: 'fa-bed', title: 'Sleep Well', text: 'Aim for 7-9 hours of sleep each night.' }
    ];
    let idx = 0;
    const tipIcon = document.getElementById('tipIconDesktop');
    const tipTitle = document.getElementById('tipTitleDesktop');
    const tipText = document.getElementById('tipTextDesktop');
    setInterval(() => {
      idx = (idx + 1) % tips.length;
      if (tipIcon && tipTitle && tipText) {
        tipIcon.innerHTML = `<i class="fas ${tips[idx].icon}"></i>`;
        tipTitle.textContent = tips[idx].title;
        tipText.textContent = tips[idx].text;
      }
    }, 5000);
  }
  // Profile menu
  if (view === 'profileView') {
    document.getElementById('viewGoalsDesktop')?.addEventListener('click', () => loadView('goalsView'));
    document.getElementById('viewBucketListDesktop')?.addEventListener('click', () => loadView('bucketListView'));
    document.getElementById('viewSettingsDesktop')?.addEventListener('click', () => loadView('settingsView'));
    document.getElementById('exportToPDFBtnDesktop')?.addEventListener('click', () => alert('Export to PDF coming soon!'));
  }
  // Goals back
  if (view === 'goalsView') {
    document.getElementById('backToProfileBtnDesktop')?.addEventListener('click', () => loadView('profileView'));
  }
  // Bucket List logic
  if (view === 'bucketListView') {
    const renderBucketList = () => {
      const container = document.getElementById('bucketListItemsDesktop');
      if (!container) return;
      const items = JSON.parse(localStorage.getItem('bucketListDesktop') || '[]');
      container.innerHTML = '';
      if (items.length === 0) {
        container.innerHTML = '<div style="color:#888;text-align:center;padding:18px 0;">No items yet. Add your first bucket list item!</div>';
        return;
      }
      items.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'bucket-list-item-desktop';
        div.style = 'display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0;';
        div.innerHTML = `<span style="flex:1;">${item}</span><button data-idx="${idx}" class="remove-bucket-item-btn-desktop" style="background:none;border:none;color:#e53e3e;font-size:1.1em;cursor:pointer;"><i class="fas fa-trash"></i></button>`;
        container.appendChild(div);
      });
      container.querySelectorAll('.remove-bucket-item-btn-desktop').forEach(btn => {
        btn.addEventListener('click', function() {
          const idx = parseInt(this.getAttribute('data-idx'));
          const items = JSON.parse(localStorage.getItem('bucketListDesktop') || '[]');
          items.splice(idx, 1);
          localStorage.setItem('bucketListDesktop', JSON.stringify(items));
          renderBucketList();
        });
      });
    };
    const addBtn = document.getElementById('addBucketListItemBtnDesktop');
    const input = document.getElementById('newBucketListItemDesktop');
    if (addBtn && input) {
      addBtn.addEventListener('click', function() {
        const val = input.value.trim();
        if (!val) return;
        let items = JSON.parse(localStorage.getItem('bucketListDesktop') || '[]');
        items.push(val);
        localStorage.setItem('bucketListDesktop', JSON.stringify(items));
        input.value = '';
        renderBucketList();
      });
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          addBtn.click();
        }
      });
    }
    renderBucketList();
    document.getElementById('backToProfileBtnBucketDesktop')?.addEventListener('click', () => loadView('profileView'));
  }
  // Settings back
  if (view === 'settingsView') {
    document.getElementById('backToProfileBtnSettingsDesktop')?.addEventListener('click', () => loadView('profileView'));
  }
  // Terms tab switch
  if (view === 'termsView') {
    const termsTab = document.getElementById('termsTabDesktop');
    const privacyTab = document.getElementById('privacyTabDesktop');
    const termsContent = document.getElementById('terms-tab-desktop');
    const privacyContent = document.getElementById('privacy-tab-desktop');
    if (termsTab && privacyTab && termsContent && privacyContent) {
      termsTab.onclick = () => {
        termsTab.classList.add('active');
        privacyTab.classList.remove('active');
        termsContent.style.display = 'block';
        privacyContent.style.display = 'none';
      };
      privacyTab.onclick = () => {
        privacyTab.classList.add('active');
        termsTab.classList.remove('active');
        privacyContent.style.display = 'block';
        termsContent.style.display = 'none';
      };
    }
  }
  // Diet Plan wizard logic
  if (view === 'dietPlanView') {
    const steps = [
      'step-age-desktop',
      'step-weight-desktop',
      'step-height-desktop',
      'step-gender-desktop',
      'step-activity-desktop',
      'step-goal-desktop',
      'step-allergies-desktop',
      'step-dislikes-desktop',
      'step-email-deliver-desktop'
    ];
    let currentStep = 0;
    function updateProgressBar(idx) {
      const fill = document.getElementById('wizardProgressFillDesktop');
      if (fill) {
        fill.style.width = ((idx+1) / steps.length * 100) + '%';
      }
    }
    function renderStepDots(idx) {
      const dots = document.getElementById('wizardStepDotsDesktop');
      if (dots) {
        dots.innerHTML = steps.map((_, i) => `<div class="wizard-step-dot-desktop${i===idx?' active':''}"></div>`).join('');
      }
    }
    function showStep(idx) {
      steps.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.remove('active');
          el.style.display = 'none';
        }
      });
      const el = document.getElementById(steps[idx]);
      if (el) {
        el.classList.add('active');
        el.style.display = 'block';
      }
      updateProgressBar(idx);
      renderStepDots(idx);
    }
    function validateStep(idx) {
      switch (steps[idx]) {
        case 'step-age-desktop':
          return document.getElementById('wizardAgeDesktop').value;
        case 'step-weight-desktop':
          return document.getElementById('wizardWeightDesktop').value;
        case 'step-height-desktop':
          return document.getElementById('wizardHeightDesktop').value;
        case 'step-gender-desktop':
          return document.getElementById('wizardGenderDesktop').value;
        case 'step-activity-desktop':
          return document.getElementById('wizardActivityDesktop').value;
        case 'step-goal-desktop':
          return document.getElementById('wizardGoalDesktop').value;
        case 'step-allergies-desktop':
          if (document.getElementById('wizardAllergiesSelectDesktop').value === 'custom') {
            return document.getElementById('wizardAllergiesDesktop').value;
          }
          return true;
        case 'step-dislikes-desktop':
          if (document.getElementById('wizardDislikesSelectDesktop').value === 'custom') {
            return document.getElementById('wizardDislikesDesktop').value;
          }
          return true;
        case 'step-email-deliver-desktop':
          return true;
        default:
          return true;
      }
    }
    const form = document.getElementById('dietWizardFormDesktop');
    if (form) {
      form.querySelectorAll('.wizard-btn-desktop.next').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          if (!validateStep(currentStep)) {
            alert('Please fill in the required field.');
            return;
          }
          if (currentStep < steps.length - 1) {
            currentStep++;
            showStep(currentStep);
          }
        });
      });
      form.querySelectorAll('.wizard-btn-desktop.back').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          if (currentStep > 0) {
            currentStep--;
            showStep(currentStep);
          }
        });
      });
      showStep(currentStep);
      // Allergies/dislikes custom input logic
      const allergiesSelect = document.getElementById('wizardAllergiesSelectDesktop');
      const allergiesInput = document.getElementById('wizardAllergiesDesktop');
      if (allergiesSelect && allergiesInput) {
        allergiesSelect.addEventListener('change', function() {
          allergiesInput.style.display = this.value === 'custom' ? 'block' : 'none';
          if (this.value !== 'custom') allergiesInput.value = '';
        });
      }
      const dislikesSelect = document.getElementById('wizardDislikesSelectDesktop');
      const dislikesInput = document.getElementById('wizardDislikesDesktop');
      if (dislikesSelect && dislikesInput) {
        dislikesSelect.addEventListener('change', function() {
          dislikesInput.style.display = this.value === 'custom' ? 'block' : 'none';
          if (this.value !== 'custom') dislikesInput.value = '';
        });
      }
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        showStep(currentStep);
        if (!validateStep(currentStep)) {
          const stepEl = document.getElementById(steps[currentStep]);
          if (stepEl) {
            const invalid = stepEl.querySelector(':invalid');
            if (invalid) invalid.focus();
          }
          alert('Please fill in the required field.');
          return;
        }
        const getPlanBtn = document.getElementById('getPlanBtnDesktop');
        if (getPlanBtn) {
          getPlanBtn.disabled = true;
          getPlanBtn.textContent = 'Processing...';
          getPlanBtn.style.background = '#22c55e';
          getPlanBtn.style.color = '#fff';
        }
        const data = {
          user_email: localStorage.getItem('userEmail') || '',
          age: document.getElementById('wizardAgeDesktop').value,
          weight: document.getElementById('wizardWeightDesktop').value,
          height: document.getElementById('wizardHeightDesktop').value,
          gender: document.getElementById('wizardGenderDesktop').value,
          activity_level: document.getElementById('wizardActivityDesktop').value,
          goal: document.getElementById('wizardGoalDesktop').value,
          allergies: allergiesSelect && allergiesSelect.value === 'custom' ? allergiesInput.value : 'NA',
          dislikes: dislikesSelect && dislikesSelect.value === 'custom' ? dislikesInput.value : 'NA',
          email_deliver: 'Yes'
        };
        try {
          const response = await fetch('https://mindscribe.rojan.hackclub.app/diet-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data)
          });
          if (!response.ok) {
            throw new Error('Server error');
          }
          alert('Your personalized diet plan will be sent to your email!');
          form.reset();
          showStep(0);
          currentStep = 0;
        } catch (err) {
          alert('Failed to generate diet plan. Please try again.');
        } finally {
          if (getPlanBtn) {
            getPlanBtn.disabled = false;
            getPlanBtn.textContent = 'Get My Plan';
            getPlanBtn.style.background = '';
            getPlanBtn.style.color = '';
          }
        }
      });
    }
  }
  // AI Chat logic (demo, not real AI)
  if (view === 'aiView') {
    const form = document.getElementById('aiChatFormDesktop');
    const input = document.getElementById('aiChatInputDesktop');
    const messages = document.getElementById('aiChatMessagesDesktop');
    if (form && input && messages) {
      form.onsubmit = function(e) {
        e.preventDefault();
        const val = input.value.trim();
        if (!val) return;
        const userMsg = document.createElement('div');
        userMsg.className = 'ai-msg-user';
        userMsg.textContent = val;
        messages.appendChild(userMsg);
        input.value = '';
        // Simulate AI response
        setTimeout(() => {
          const aiMsg = document.createElement('div');
          aiMsg.className = 'ai-msg-bot';
          aiMsg.textContent = 'AI: This is a demo response.';
          messages.appendChild(aiMsg);
          messages.scrollTop = messages.scrollHeight;
        }, 700);
      };
    }
  }
  // Free writing save for desktop
  if (view === 'journalView') {
    const textarea = document.getElementById('freeWritingBoxDesktop');
    const savedMsg = document.getElementById('freeWritingSavedMsgDesktop');
    if (textarea) {
      textarea.value = localStorage.getItem('freeWritingContentDesktop') || '';
    }
    document.getElementById('saveFreeWritingBtnDesktop')?.addEventListener('click', function() {
      if (textarea) {
        localStorage.setItem('freeWritingContentDesktop', textarea.value);
        if (savedMsg) {
          savedMsg.style.display = 'inline';
          setTimeout(() => { savedMsg.style.display = 'none'; }, 1200);
        }
      }
    });
  }
  // --- Activity Tracking Logic (Desktop) ---
  if (view === 'activityView') {
    const ACTIVITY_API_URL = "https://mindscribe.rojan.hackclub.app/log-activity";
    const ACTIVITY_HISTORY_API_URL = "https://mindscribe.rojan.hackclub.app/activity-history";
    const activityTypes = [
      { key: 'sleep', label: 'Sleep', btn: 'sleepIconBtnDesktop', form: 'sleepFormDesktop', input: 'sleepHoursDesktop', unit: 'hours' },
      { key: 'hydration', label: 'Hydration', btn: 'hydrationIconBtnDesktop', form: 'hydrationFormDesktop', input: 'hydrationLitersDesktop', unit: 'liters' },
      { key: 'screen_time', label: 'Screen Time', btn: 'screenTimeIconBtnDesktop', form: 'screenTimeFormDesktop', input: 'screenTimeHoursDesktop', unit: 'hours' },
      { key: 'walk', label: 'Walk', btn: 'walkIconBtnDesktop', form: 'walkFormDesktop', input: 'walkStepsDesktop', unit: 'steps' }
    ];
    function getUserEmail() {
      return localStorage.getItem('userEmail') || '';
    }
    function showActivityTotals(totals) {
      let html = '<div class="activity-totals-row-desktop" style="display:flex;justify-content:space-around;margin:10px 0 18px 0;gap:10px;">';
      activityTypes.forEach(act => {
        const val = totals[act.key] || 0;
        html += `<div style="text-align:center;font-size:0.98em;min-width:60px;">
          <div style="font-weight:600;">${val} <span style="font-size:0.85em;color:#888;">${act.unit}</span></div>
          <div style="font-size:0.93em;color:#5D5FEF;">${act.label}</div>
        </div>`;
      });
      html += '</div>';
      let totalsDiv = document.getElementById('activityTotalsRowDesktop');
      if (totalsDiv) totalsDiv.innerHTML = html;
    }
    async function fetchActivityTotals() {
      const user_email = getUserEmail();
      if (!user_email) return;
      try {
        const resp = await fetch(ACTIVITY_HISTORY_API_URL + `?user_email=${encodeURIComponent(user_email)}`);
        if (!resp.ok) throw new Error('Failed to fetch activity history');
        const data = await resp.json();
        showActivityTotals(data.totals || {});
      } catch (e) {
        showActivityTotals({});
      }
    }
    fetchActivityTotals();
  }
  // --- Food Scan (Desktop) ---
  if (view === 'scanView') {
    const logFoodBtn = document.getElementById('logFoodButtonDesktop');
    const logFoodContainer = document.getElementById('logFoodContainerDesktop');
    const cancelBtn = document.getElementById('cancelFoodLogDesktop');
    if (logFoodBtn && logFoodContainer) {
      logFoodBtn.onclick = () => { logFoodContainer.style.display = 'block'; };
    }
    if (cancelBtn && logFoodContainer) {
      cancelBtn.onclick = () => { logFoodContainer.style.display = 'none'; };
    }
    // You can add more logic for file upload, camera, and food analysis API here
  }
  // --- Journal History (Desktop) ---
  if (view === 'journalView') {
    const viewHistoryBtn = document.getElementById('viewJournalHistoryBtnDesktop');
    if (viewHistoryBtn) {
      viewHistoryBtn.onclick = () => {
        alert('Journal history feature coming soon!');
      };
    }
    // You can add logic for voice recording, manual log, and saving journal entries here
  }
  // --- Nutrition Style Meter (Desktop) ---
  if (view === 'homeView') {
    const meter = document.getElementById('nutritionStyleMeterDesktop');
    const label = document.getElementById('nutritionStyleLabelDesktop');
    const refreshBtn = document.getElementById('refreshNutritionStyleDesktop');
    if (refreshBtn && meter && label) {
      refreshBtn.onclick = () => {
        meter.style.width = (30 + Math.random() * 60) + '%';
        label.textContent = 'Analyzed!';
        setTimeout(() => { label.textContent = 'Click to analyze your style'; }, 2000);
      };
    }
  }
  // --- Tips Carousel (Desktop) ---
  if (view === 'homeView') {
    const tips = [
      { icon: 'fa-leaf', title: 'Balanced Diet', text: 'Include a variety of fruits, vegetables, lean proteins, and whole grains in your meals.' },
      { icon: 'fa-water', title: 'Stay Hydrated', text: 'Drink at least 8 glasses of water daily.' },
      { icon: 'fa-bed', title: 'Sleep Well', text: 'Aim for 7-9 hours of sleep each night.' }
    ];
    let idx = 0;
    const tipIcon = document.getElementById('tipIconDesktop');
    const tipTitle = document.getElementById('tipTitleDesktop');
    const tipText = document.getElementById('tipTextDesktop');
    setInterval(() => {
      idx = (idx + 1) % tips.length;
      if (tipIcon && tipTitle && tipText) {
        tipIcon.innerHTML = `<i class="fas ${tips[idx].icon}"></i>`;
        tipTitle.textContent = tips[idx].title;
        tipText.textContent = tips[idx].text;
      }
    }, 5000);
  }
  // --- History Filtering (Desktop) ---
  if (view === 'historyView') {
    const searchInput = document.getElementById('searchInputDesktop');
    const sortBy = document.getElementById('sortByDesktop');
    const filterHealth = document.getElementById('filterHealthScoreDesktop');
    const historyContainer = document.getElementById('historyContainerDesktop');
    async function renderHistory() {
      if (!historyContainer) return;
      historyContainer.innerHTML = '<div style="color:#888;text-align:center;padding:18px 0;">Loading...</div>';
      try {
        const data = await fetchFoodHistoryDesktop();
        const history = data.food_history || [];
        if (!history.length) {
          historyContainer.innerHTML = '<div style="color:#888;text-align:center;padding:18px 0;">No food history yet.</div>';
          return;
        }
        historyContainer.innerHTML = '';
        history.forEach(entry => {
          const date = new Date(entry.timestamp);
          // Food emojis: fallback to 🍽️ if not present
          const foods = (entry.foods || []).map(f => {
            const emoji = f.emoji || '🍽️';
            return `<li style="display:flex;align-items:center;gap:7px;font-size:1.04em;margin-bottom:2px;"><span style='font-size:1.18em;'>${emoji}</span> <span>${f.name}</span> <span style='color:#888;font-size:0.97em;'>(${f.estimated_calories || '?'} cal)</span></li>`;
          }).join('');
          const health = entry.overall_health_score || '--';
          const calories = entry.overall_calories || '--';
          const card = document.createElement('div');
          card.className = 'history-card-desktop';
          card.style = `backdrop-filter: blur(12px); background: rgba(255,255,255,0.55); border-radius:18px; box-shadow:0 4px 24px 0 rgba(93,95,239,0.13),0 1.5px 8px 0 rgba(93,95,239,0.09); margin-bottom:18px; padding:18px 18px 12px 18px; transition:box-shadow .18s,transform .18s; cursor:pointer; border:1.5px solid rgba(93,95,239,0.08);`;
          card.onmouseover = () => { card.style.boxShadow = '0 8px 32px 0 rgba(93,95,239,0.18),0 2px 12px 0 rgba(93,95,239,0.13)'; card.style.transform = 'translateY(-2px) scale(1.012)'; };
          card.onmouseleave = () => { card.style.boxShadow = '0 4px 24px 0 rgba(93,95,239,0.13),0 1.5px 8px 0 rgba(93,95,239,0.09)'; card.style.transform = 'none'; };
          card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span style='font-size:1.45em;color:#ff7e3f;'><i class="fas fa-fire"></i></span>
                <div>
                  <div style="font-weight:600;font-size:1.08em;">${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                  <div style="color:#888;font-size:0.97em;">${entry.foods && entry.foods.length ? entry.foods.length + ' items' : ''}</div>
                </div>
              </div>
              <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
                <div style="color:#5D5FEF;font-weight:600;display:flex;align-items:center;gap:6px;"><i class="fas fa-fire" style="color:#ff7e3f;font-size:1.13em;"></i> ${calories} cal</div>
                <div style="color:#34D399;font-weight:600;display:flex;align-items:center;gap:6px;"><i class="fas fa-heart" style="color:#e53e3e;font-size:1.13em;"></i> ${health}/10</div>
              </div>
            </div>
            <ul style="margin:12px 0 0 0;padding-left:0;list-style:none;color:#232347;">${foods}</ul>
          `;
          historyContainer.appendChild(card);
        });
      } catch (e) {
        historyContainer.innerHTML = '<div style="color:#e53e3e;text-align:center;padding:18px 0;">Failed to load history.</div>';
      }
    }
    renderHistory();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      loadView(this.getAttribute('data-view'));
    });
  });
  loadView('homeView');
  // Theme switcher
  const themeSwitch = document.getElementById('themeSwitch');
  let darkMode = localStorage.getItem('darkModeDesktop') === 'true';
  function setTheme(dark) {
    document.body.classList.toggle('dark-theme', dark);
    themeSwitch.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkModeDesktop', dark);
  }
  setTheme(darkMode);
  themeSwitch.addEventListener('click', () => {
    darkMode = !darkMode;
    setTheme(darkMode);
  });
});
