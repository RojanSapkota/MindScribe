// JS for MindScribe Desktop Version
// Handles navigation, theme switching, and dynamic view loading

const viewTemplates = {
  homeView: document.getElementById('homeViewTemplate'),
  activityView: document.getElementById('activityViewTemplate'),
  journalView: document.getElementById('journalViewTemplate'),
  historyView: document.getElementById('historyViewTemplate'),
  profileView: document.getElementById('profileViewTemplate'),
};

function loadView(view) {
  const content = document.getElementById('desktopContent');
  if (viewTemplates[view] && viewTemplates[view].content) {
    content.innerHTML = '';
    content.appendChild(viewTemplates[view].content.cloneNode(true));
  } else {
    content.innerHTML = `<div style="padding:40px;text-align:center;color:#888;">Feature coming soon!</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      loadView(this.getAttribute('data-view'));
    });
  });
  // Load default view
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

  // Example: Free writing save for desktop
  document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'saveFreeWritingBtnDesktop') {
      const textarea = document.getElementById('freeWritingBoxDesktop');
      const savedMsg = document.getElementById('freeWritingSavedMsgDesktop');
      if (textarea) {
        localStorage.setItem('freeWritingContentDesktop', textarea.value);
        if (savedMsg) {
          savedMsg.style.display = 'inline';
          setTimeout(() => { savedMsg.style.display = 'none'; }, 1200);
        }
      }
    }
  });
});
