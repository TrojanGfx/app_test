# Qr‑Mac

Qr‑Mac is a lightweight Progressive Web App (PWA) that allows you to scan QR codes for items you pick up in the supermarket and collect them into a cart. When you reach the checkout, open the cart to display all collected QR codes full‑screen so the cashier can scan them quickly without you having to pick up each individual item again.

## Features

* **QR scanning:** Uses your device camera to scan product QR codes and adds them to a cart. Duplicate entries are ignored automatically.
* **Cart management:** View, remove, and persist your scanned codes locally. The cart is stored in your browser so your list remains intact even if you close the app.
* **Full‑screen cart view:** When it’s time to pay, tap “Show Cart” and present all your QR codes in one full‑screen view for fast checkout.
* **Offline support:** As a PWA, Qr‑Mac can be installed on your device and works offline after the first load.

## Usage

1. Open the app in your browser (or install it to your home screen).
2. Tap **Start Scan** and point your camera at a product’s QR code. Each successful scan will add the code to your list.
3. Tap **Stop Scan** when you’re finished scanning items.
4. Review your cart list. Use the **Remove** button next to each entry to delete any mistakes.
5. At the checkout, tap **Show Cart** to display all your codes as scannable QR codes in a full‑screen view. Press **Close** when done.

## Development

The project is entirely static; no build system is required. All code lives in `index.html`, `app.js`, `manifest.webmanifest`, and `sw.js`. To serve locally during development, you can use any static file server, e.g.:

```bash
npx serve qr-mac
```

Icons are derived from a custom QR‑code smiley design. If you wish to update the icons, replace the files in `icons/` with your own 192×192 and 512×512 PNGs.