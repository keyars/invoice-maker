# Invoice Maker

A polished, browser-only invoice studio for creating professional invoices with a live A4 preview and print-ready output.

## ✨ Live Demo

**[Open Invoice Maker on GitHub Pages](https://keyars.github.io/invoice-maker/)**

Create, customize, print, and save invoices as PDF directly from your browser. No account and no backend are required.

## Features

- **Professional invoice editor** with a clean editorial interface
- Business profile with logo upload, contact details, website and tax ID
- Customer / company billing details
- Invoice numbering, issue date, due date and payment status
- Multiple products and services with quantity, rate and per-line tax
- Duplicate and remove line items
- Percentage or fixed discounts
- Shipping / additional fees
- Amount paid and automatic balance-due calculation
- USD, EUR, GBP, INR, AUD, CAD, JPY and SGD currency formatting
- Three invoice templates: Modern, Classic and Minimal
- Custom accent color
- Comfortable and Compact print density
- Live A4 invoice preview
- Print / **Save as PDF** using the browser print dialog
- Payment instructions, notes and terms & conditions
- Local autosave using browser storage
- Explicit local draft save / restore
- JSON export and import for portable invoice data
- Responsive desktop, tablet and mobile UI
- No server-side invoice processing

## Privacy-first architecture

Invoice data is handled in the browser. Current invoices and drafts are stored locally on the device using `localStorage`; there is no application backend or database.

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

## Deployment

The project includes GitHub Actions for continuous verification and GitHub Pages deployment from `main`.

## Tech stack

React · TypeScript · Vite · Vitest · CSS

## Output

For a polished PDF invoice, click **Print / PDF** and choose **Save as PDF** in your browser. The print stylesheet is optimized for A4 paper and removes the editor chrome automatically.
