# Thread & Co. Image + Confirmation Fix

## Product image fix
- The eight supplied product images are stored locally in `public/images/products/`.
- Product rendering now resolves images by product name, so an old/stale API image path such as `/images/top.svg` cannot replace the supplied product photo for the matching catalog item.
- Home, Shop, Product Detail, and Admin product previews use the same local image resolver.
- The PWA product API runtime cache was removed and the image/static cache versions were bumped to v2 to prevent old cached catalog/image responses from being reused.

## Confirmation UI fix
- Native browser `alert()` confirmation/error dialogs were removed from checkout and product deletion.
- Added a custom responsive confirmation modal with the Thread & Co. visual style.
- Checkout now shows a polished Order Confirmed modal with the order number and navigation choices.
- Admin product deletion uses the same custom modal.
- The standalone order confirmation page was also redesigned.

## Existing development command
Run:

`npm install`

then:

`npm run dev`

This starts Vite and Express together.
