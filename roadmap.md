# Checkout and accounts
- [x] Enable Lovable Cloud.
- [x] Confirm seller country: Estonia.
- [x] Move the sushi catalog to Cloud; send Stripe only one cart-total line, never individual products.
- [x] Add login-only accounts without a profiles table.
- [x] Store user-owned orders and enforce signed-in ordering.
- [x] Connect the existing Stripe account securely.
- [x] Implement authenticated cart checkout and payment confirmation.
- [x] Verify checkout and payment confirmation end-to-end: user completed checkout; Cloud records the $11.00 USD order as paid with a payment reference and confirmation timestamp.

# Page branding
- [x] Use the uploaded icon as the browser tab icon.
- [x] Use the uploaded logo in the page header and verify it on desktop and mobile.
- [x] Swap in the newly uploaded wide Restorani.bar logo in the page header; verified on desktop and mobile.

# Sign-in methods
- [x] Remove the Sign in with Lovable button.
- [x] Remove the Google sign-in button; email and password remain.

# Order confirmation emails
- [x] Configure notify.restorani.bar as the sender domain (DNS verification pending).
- [x] Prepare managed sending and a homepage-branded order confirmation template; secure preview renders on desktop and mobile.
- [x] Send the itemized confirmation after verified payment; snapshot, paid-only, recipient, idempotency and suppression tests pass.
- [ ] Verify real delivery: blocked until sender DNS verification completes and these changes are published.

# AI menu assistant
- [x] Confirm conversation shape and history storage: no persistence; use a temporary single-session assistant rather than a saved thread list.
- [x] Add a top-bar assistant connected to the live menu and React cart.
- [x] Verify real AI replies add two salmon and one tuna ($15.20), recommend without changing the cart, remove tuna ($8.40), and open sign-in-gated checkout; desktop/mobile and no-history reload checks pass.