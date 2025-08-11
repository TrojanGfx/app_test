// Main logic for Qr-Mac
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
let videoElem = null;
let permissionStream = null;
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
    if (videoElem) {
      // clear preview
      try { videoElem.srcObject = null; } catch {}
    }
    stopStream(permissionStream);
    permissionStream = null;
    preview.innerHTML = '';
    startScanBtn.textContent = 'Start Scan';
    return;
  }

  // START
  if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
    alert('Your device does not support camera access.');
    return;
  }

  try {
    // 1) Ask for permission & show a reliable live preview immediately
    permissionStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });

    // Create video element once and attach to DOM
    videoElem = document.createElement('video');
    videoElem.setAttribute('autoplay', '');
    videoElem.setAttribute('muted', '');
    videoElem.setAttribute('playsinline', ''); // mobile inline playback
    // give preview box some size in case CSS is missing
    videoElem.style.width = '100%';
    videoElem.style.display = 'block';
    preview.appendChild(videoElem);

    videoElem.srcObject = permissionStream;
    videoElem.onloadedmetadata = () => {
      // Some devices need an explicit play after metadata
      videoElem.play().catch(() => {});
    };

    startScanBtn.textContent = 'Stop Scan';

    // 2) Initialize QrScanner on the same <video>
    //    (library: https://npmjs.com/package/qr-scanner — UMD build exposes QrScanner) 
    scanner = new QrScanner(
      videoElem,
      (result) => {
        // On successful scan, add new code if not already present
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
        // preferredCamera works in newer versions; fallback is facingMode above
        preferredCamera: 'environment'
      }
    );

    // 3) Start the scanner (it may override the stream; that’s OK)
    await scanner.start().catch(err => {
      console.error('Scanner start failed:', err);
      throw err;
    });

  } catch (err) {
    console.error('Camera permission/start failed', err);
    alert('Cannot access camera. Check browser permissions and try again.');
    // cleanup
    try { scanner?.destroy?.(); } catch {}
    scanner = null;
    stopStream(permissionStream);
    permissionStream = null;
    preview.innerHTML = '';
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
