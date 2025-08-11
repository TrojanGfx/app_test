// Main logic for Qr-Mac (uses existing <video> inside #preview)

// Grab DOM elements
const preview = document.getElementById('preview');
const videoElem = preview.querySelector('video'); // <-- Χρησιμοποιούμε αυτό το video
const codesList = document.getElementById('codes');
const startScanBtn = document.getElementById('startScan');
const showCartBtn = document.getElementById('showCart');
const fullscreen = document.getElementById('fullscreen');
const qrContainer = document.getElementById('qr-container');
const closeBtn = fullscreen.querySelector('.close');

let scanner = null;
let permissionStream = null; // τρέχον MediaStream
let codes = [];

// Load codes from localStorage on startup
function loadCodes() {
  try {
    const stored = localStorage.getItem('codes');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        codes = parsed;
      }
    }
  } catch (e) {
    console.error('Error loading codes', e);
  }
  renderCodes();
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

    const span = document.createElement('span');
    span.className = 'code-text';
    span.textContent = code;

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

loadCodes();

// Helper: stop and release any MediaStream tracks
function stopStream(stream) {
  try {
    stream?.getTracks?.().forEach(t => t.stop());
  } catch {}
}

// Start or stop scanning depending on current state
startScanBtn.addEventListener('click', async () => {
  // STOP
  if (scanner) {
    try { await scanner.stop(); } catch {}
    scanner.destroy?.();
    scanner = null;

    try { videoElem.srcObject = null; } catch {}
    stopStream(permissionStream);
    permissionStream = null;

    startScanBtn.textContent = 'Start Scan';
    return;
  }

  // START
  if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
    alert('Your device does not support camera access.');
    return;
  }

  try {
    // Ζήτα άδεια + ξεκίνα ζωντανό preview στο ΥΠΑΡΧΟΝ video
    permissionStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });

    videoElem.setAttribute('autoplay', '');
    videoElem.setAttribute('muted', '');
    videoElem.setAttribute('playsinline', '');
    videoElem.style.width = '100%';
    videoElem.style.display = 'block';

    videoElem.srcObject = permissionStream;
    await new Promise(res => {
      videoElem.onloadedmetadata = () => {
        videoElem.play().catch(() => {});
        res();
      };
    });

    startScanBtn.textContent = 'Stop Scan';

    // Στήσε τον QrScanner πάνω στο ΙΔΙΟ video element
    // (UMD build: window.QrScanner)
    scanner = new QrScanner(
      videoElem,
      (result) => {
        const text = typeof result === 'string' ? result : result?.data || '';
        if (text && !codes.includes(text)) {
          codes.push(text);
          saveCodes();
          renderCodes();
        }
      },
      {
        highlightScanRegion: true,
        returnDetailedScanResult: true,
        maxScansPerSecond: 8,
        preferredCamera: 'environment'
      }
    );

    await scanner.start().catch(err => {
      console.error('Scanner start failed:', err);
      throw err;
    });

  } catch (err) {
    console.error('Camera permission/start failed', err);
    alert('Cannot access camera. Check browser permissions and try again.');

    try { scanner?.destroy?.(); } catch {}
    scanner = null;

    try { videoElem.srcObject = null; } catch {}
    stopStream(permissionStream);
    permissionStream = null;

    startScanBtn.textContent = 'Start Scan';
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
