# Qr‑Mac (PWA)

Scan supermarket items before checkout, collect their codes, and present them quickly at the cashier.

## Files
- index.html — UI, includes a <video> preview element
- app.js — requests camera permission, shows live preview, scans QR codes (QrScanner), stores results
- sw.js — offline caching
- manifest.webmanifest — PWA metadata
- icon-192.png, icon-512.png — app icons

## Deploy
Host the folder on HTTPS (e.g., GitHub Pages). Open on Android Chrome → Add to Home screen.
