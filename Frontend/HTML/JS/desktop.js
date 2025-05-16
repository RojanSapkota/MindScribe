// JS extracted from desktop.html
// ...existing code...
// Check if user is on a mobile device
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
// If on mobile, redirect to the main mobile app
if (isMobile) {
  window.location.href = 'mobile.html'; // Redirect to mobile.html
}
// Theme switcher functionality
const themeSwitch = document.getElementById('themeSwitch');
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
  // Update QR code based on theme
  updateQRCode();
});
// Generate dynamic QR code
function generateQRCode(url, darkMode = false) {
  const qrCodeContainer = document.getElementById('qrCode');
  const qrLoading = document.getElementById('qrLoading');
  const qrError = document.getElementById('qrError');
  // Show loading state
  qrLoading.style.display = 'flex';
  qrError.style.display = 'none';
  // Check if there's already an image and remove it
  const existingImg = qrCodeContainer.querySelector('img');
  if (existingImg) {
    existingImg.remove();
  }
  // Generate QR code using an API
  const qrImage = new Image();
  const bgColor = darkMode ? '2d3748' : 'ffffff';
  const fgColor = darkMode ? 'ffffff' : '000000';
  // Use qrserver.com API to generate QR code
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=200x200&bgcolor=${bgColor}&color=${fgColor}&margin=10`;
  qrImage.onload = function() {
    qrLoading.style.display = 'none';
    qrCodeContainer.appendChild(qrImage);
  };
  qrImage.onerror = function() {
    qrLoading.style.display = 'none';
    qrError.style.display = 'flex';
  };
}
// Function to update QR code based on current theme
function updateQRCode() {
  // Get current URL
  const currentURL = window.location.origin + window.location.pathname.replace('desktop.html', '');
  generateQRCode(currentURL, darkMode);
}
// Generate QR code on page load
document.addEventListener('DOMContentLoaded', updateQRCode);
