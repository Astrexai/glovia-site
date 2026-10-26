# glovia-site

Landing page for **Glovia** — your AI self-care companion. Live at https://gloviawellness.com/

Plain HTML/CSS/vanilla JS, served by GitHub Pages from `main`.

## Editing

Edit the sources in `src/`, then rebuild:

```
node build.mjs
```

This minifies `src/styles.css` and inlines it into `index.html`, and writes `assets/js/main.min.js`. Commit the built files too — Pages serves them as-is.

## Adding real app screenshots

Each phone mockup in `src/index.html` has a commented `<img class="phone__shot">` slot. Export a screenshot (ideally 1179×2556, WebP), put it in `assets/img/`, uncomment the line, and rebuild. The screenshot covers the placeholder UI automatically.
