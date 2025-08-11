// Main logic for Qr‑Mac
// Uses qr-scanner library to scan QR codes from the device camera
// and uses qrious to render QR codes for the cart view.

// Grab DOM elements
const preview = document.getElementById('preview');
const codesList = document.getElementById('codes');
const startScanBtn = document.getElementById('startScan');
const showCartBtn = document.getElementById('showCart');
const fullscreen = document.getElementById('fullscreen');
const qrContainer = document.getElementById('qr-container');
const closeBtn = fullscreen.querySelector('.close');

let scanner = null;
let codes = [];

// Load codes from localStorage on startup
function loadCodes() {
  try {
    const stored = localStorage.getItem('codes');
    if (stored) {
      codes = JSON.parse(stored);
      if (Array.isArray(codes)) {
        renderCodes();
      } else {
        codes = [];
      }
    }
  } catch (e) {
    console.error('Error loading codes', e);
  }
}

// Persist codes array to localStorage
function saveCodes() {
  try {
    localStorage.setItem('codes', JSON.stringify(codes));
  } catch (e) {
    console.error('Error saving codes', e);
  }
}

// Render the list of scanned codes in the UI
function renderCodes() {
  codesList.innerHTML = '';
  codes.forEach((code, idx) => {
    const li = document.createElement('li');
    li.className = 'code-item';
    // Show the text of the QR code
    const span = document.createElement('span');
    span.className = 'code-text';
    span.textContent = code;
    // Button to remove a code from the list
    const btn = document.createElement('button');
    btn.textContent = 'Remove';
    btn.className = 'code-remove';
    btn.addEventListener('click', () => {
      codes.splice(idx, 1);
      saveCodes();
      renderCodes();
    });
    li.appendChild(span);
    li.appendChild(btn);
    codesList.appendChild(li);
  });
}

// Initialize codes from storage
loadCodes();

// Start or stop scanning depending on current state
startScanBtn.addEventListener('click', async () => {
  if (scanner) {
    // Stop scanning
    scanner.stop();
    scanner = null;
    startScanBtn.textContent = 'Start Scan';
    preview.innerHTML = '';
    return;
  }
  // Check for mediaDevices support
  if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
    alert('Your device does not support camera access.');
    startScanBtn.textContent = 'Start Scan';
    return;
  }
  try {
    // Request camera permission upfront; this will show a prompt to the user if
    // permission has not been granted yet. If denied, an exception is thrown.
    await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
  } catch (err) {
    console.error('Camera permission denied or not available', err);
    alert('The app needs access to your camera. Please allow camera permission in your browser settings and try again.');
    startScanBtn.textContent = 'Start Scan';
    return;
  }
  // Create video element for scanning preview
  const videoElem = document.createElement('video');
  videoElem.setAttribute('autoplay', '');
  videoElem.setAttribute('muted', '');
  videoElem.setAttribute('playsinline', '');
  preview.appendChild(videoElem);
  startScanBtn.textContent = 'Stop Scan';
  // Initialize QR scanner
  scanner = new QrScanner(
    videoElem,
    (result) => {
      // On successful scan, add new code if not already present
      if (!codes.includes(result)) {
        codes.push(result);
        saveCodes();
        renderCodes();
      }
    },
    { highlightScanRegion: true }
  );
  try {
    await scanner.start();
  } catch (e) {
    console.error('Failed to start scanner', e);
    startScanBtn.textContent = 'Start Scan';
    preview.innerHTML = '';
    scanner = null;
  }
});

// Show cart view: render each code as a QR image using qrious
showCartBtn.addEventListener('click', () => {
  qrContainer.innerHTML = '';
  codes.forEach((code) => {
    const canvas = document.createElement('canvas');
    new QRious({
      element: canvas,
      value: code,
      size: 200
    });
    canvas.className = 'qr-img';
    qrContainer.appendChild(canvas);
  });
  fullscreen.style.display = 'block';
});

// Close cart view
closeBtn.addEventListener('click', () => {
  fullscreen.style.display = 'none';
});

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js')
      .catch((err) => console.error('Service worker registration failed', err));
  });
}