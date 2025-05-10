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
  navPersonalization: 'personalizeSection',
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
  const sections = ['thoughtsSection', 'exploreSection', 'personalizeSection', 'settingsSection'];
  
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
newEntryBtn.addEventListener('click', () => {
  alert('New journal entry feature coming soon!');
});

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

// Initialize the app with the first section
showSection('thoughtsSection');