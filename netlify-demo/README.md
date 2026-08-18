# USARD Netlify concepts site

This folder is a standalone static website. Upload the entire `netlify-demo` folder to Netlify Drop.

The site uses a fixed dark theme. Its concept explainers and four lab introductions are powered entirely by local HTML, CSS, and JavaScript, so no build step or external library is required.

The homepage also links to the CSV files in `data/`. Each dataset has a sortable, searchable browser view and a direct download link. The shared viewer is `data-viewer.html`; its `dataset` query parameter accepts `raw`, `clean`, `summary`, `school-profiles`, or `action-profiles`.

## Preview locally

Because the data viewer fetches local CSV files, preview the folder through a local web server rather than opening the HTML file directly:

```sh
python3 -m http.server 8000 --directory netlify-demo
```

Then open `http://localhost:8000`.
