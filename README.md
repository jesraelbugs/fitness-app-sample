# Fitness Tracker

A simple personal fitness app: follow workout plans, log workouts, track body weight, and see progress charts.

No install or build step. It's plain HTML, CSS and JavaScript. Charts use [Chart.js](https://www.chartjs.org/) 4.4.1, bundled in `vendor/` so it works offline.

## Use it

- **Locally:** open `index.html` in a browser.
- **Online:** enable GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root) and open the URL it gives you.

## Data

Everything is saved in your browser's local storage, so data is per browser and per device. Clearing site data erases it.

## Files

- `index.html`: page layout and tabs
- `style.css`: styling
- `app.js`: plans, workout log, body weight, and charts
