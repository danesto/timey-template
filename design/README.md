# Design

Open [`index.html`](./index.html) in a browser. Every screen, desktop and
phone, on one scrollable page.

## Editing them

The artboards are the `.dc.html` files here — plain HTML with inline styles,
one file per screen. Edit one, then rebuild the page:

```bash
node design/build-gallery.mjs
```

`index.html` is generated; do not edit it by hand.
