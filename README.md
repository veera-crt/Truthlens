# Truthlens Static Clone

This project is now a plain static site built with HTML, CSS, and vanilla JavaScript.

## Project Structure

- `index.html` and the route folders contain the generated static pages.
- `assets/styles.css` contains the shared styling.
- `assets/app.js` contains the shared client-side behavior.
- `assets/site-data.js` contains the shared post/category data.
- `scripts/build-static-site.mjs` regenerates the route HTML files.

## Commands

1. Run `npm run build` to regenerate the static route pages.
2. Run `npm run serve` to serve the site locally at `http://127.0.0.1:4173/`.
