# శ్రీ కిరాణా బిల్లింగ్ — Telugu Grocery POS

## Original Problem Statement
Site for billing groceries where prices change very frequently. Required: Bulk Price Import (paste/upload CSV to update all rates in seconds); Customer Khata (running credit, bills marked "on account", settled later); Daily Sales Report (printable day-end summary with cash vs UPI vs card totals); entire site in Telugu; typing in English must convert to Telugu script (transliteration, NOT translation); shortcut codes (a1, a2, b2) that resolve to items like butter.

## Architecture
- Backend: FastAPI + MongoDB (motor). Collections: `items`, `bills`, `customers`, `khata`. UUID string ids, ISO datetime strings, `_id` never returned.
- Frontend: React 19 + Tailwind + shadcn, react-router. Pages: Billing, Items, PriceImport, Khata, Report.
- Transliteration: custom offline rule engine `/app/frontend/src/lib/telugu.js` (no API key, instant) + `TeluguInput` component.
- No authentication (single-shop counter use).

## User Persona
Kirana shopkeeper at the counter — keyboard-first, fast, Telugu-reading, prints thermal receipts.

## Core Requirements (static)
1. Fast keyboard billing with shortcut codes
2. Bulk CSV price update with preview/diff
3. Khata credit ledger with settlement
4. Printable day-end report split by payment mode
5. Telugu UI + English→Telugu typing

## Implemented (2026-06)
- Billing: code/name search, `b1*3` qty syntax, quick-item grid by category, inline qty & price edit, discount, 4 payment modes, save + auto thermal receipt print, reprint.
- Items master: add item (Telugu typing), inline price edit, delete, search. 25 seeded items (a1–e5).
- Bulk Price Import: CSV file upload or paste, tolerant parser, dry-run preview with old→new diff and created-item highlighting, one-click apply.
- Khata: customer list with balances, total due, ledger of bills/payments, settlement by cash/UPI/card, add customer with Telugu typing.
- Daily Report: cash/UPI/card/khata totals, bill count, gross, khata collected, cash in hand, top items, bill list, print CSS.
- Tested: backend 7/7 pytest, all frontend flows, mobile responsive at 390x844.

- Bill History (2026-06): date-range + search by bill number / customer / item code-name, bill detail panel, thermal reprint of any old bill. Backend `GET /api/bills?from_day&to_day&q` and `GET /api/bills/{id}`.

## Added later (2026-06)
- Shop settings (`GET/PUT /api/settings`): name (ఉష కిరాణా), phone, address, footer, ui_scale, receipt_font. Printed on every receipt. NO GST number. Receipt always prints "ఇది అంచనా బిల్లు మాత్రమే / THIS IS AN ESTIMATE BILL".
- Admin JWT auth: bcrypt + PyJWT, httpOnly cookie + Bearer fallback, brute-force lockout (5 tries/15 min), idempotent admin seed from env. All `/api/*` except `/api/auth/*` require the token. Login page + logout in header.
- Easy daily rate changes: QuickRate bar on Items page (code → Enter → price → Enter, or one-shot `b2 172`), inline click-to-edit price AND shortcut code per row (duplicate-code protected), paste/CSV bulk import accepting comma / space / tab / `=` separators.
- Flexibility: editable shortcut codes, screen text size (85–140%, persisted) and receipt print font size (8–16px).
- POS: category filter chips, `/` hotkey to focus search.
- Paper bills only — no WhatsApp/SMS sharing (explicit user decision).

- Stock tracking (2026-06): `stock` + `min_stock` per item, auto-decrement on every bill line, inline stock edit, low-stock banner on Items page and red stock note on POS quick cards. `POST /api/items/{id}/stock`.
- Khata month statement: `GET /api/customers/{id}/statement?month=YYYY-MM` (opening / billed / paid / closing) + printable thermal statement.
- Monthly item-wise sales report: `GET /api/report/monthly?month=YYYY-MM` → item × day quantity matrix, day totals, payment-mode split; printable page at `/month`.
- Custom shortcuts from the billing screen: "కోడ్‌లు మార్చు" toggle turns every quick-item card's code into an editable field.
- Printer setup guide (Telugu, step-by-step) inside the Settings page.

- Weekly report (2026-06): `GET /api/report/weekly?week_start=YYYY-MM-DD` (Monday-based) → 7-day item × day quantity matrix, day totals/counts, payment-mode split, daily average, best day. Page `/week` with prev/next week navigation and print.
- Verified iteration 5: backend 22/22 pytest, frontend 100% (all 9 routes compile, mobile-safe at 390px, e2e smoke pass). LAUNCH-READY, awaiting user go-ahead.

- Bill accountability (2026-06): up to 7 staff names in Settings (`Shop.staff`), `billed-by-select` on Billing (remembered in localStorage), `Bill.billed_by` printed on the receipt as "బిల్లు వేసినవారు" plus blank "పరిశీలించినవారు" and "కస్టమర్ సంతకం" signature lines; per-staff totals in daily report (`by_staff`) and a column in bill history.
- Shop logo/symbol: uploaded in Settings, resized client-side to 320px PNG data URL, stored in `Shop.logo`, shown in the app header and printed at the top of every receipt.
- Pre-launch hardening: CORS via `allow_origin_regex` when `CORS_ORIGINS="*"` (works on any production domain with cookie auth), bulk_price and stock decrement now use single `bulk_write`/`insert_many` calls (N+1 removed). Deployment check: PASS, `yarn build` succeeds.

## Backlog
- P1: WhatsApp/SMS bill share; per-customer khata statement print.
- P1: Barcode scanner input; stock/inventory tracking with low-stock alerts.
- P2: Multi-user login for staff; GST/tax breakdown; weekly & monthly reports with charts; export report to CSV/PDF.
- P2: Expand transliteration dictionary for more grocery words; custom on-screen Telugu keyboard.
