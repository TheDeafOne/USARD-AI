# USARD Netlify demo

This folder is a standalone static website. Upload the entire `netlify-demo` folder to Netlify Drop.

The site uses a fixed dark theme. The cosine-similarity, full Lab 2 pipeline, and RAG retrieval walkthroughs are powered entirely by local HTML, CSS, and JavaScript, so no build step or external library is required.

The homepage also links to the CSV files in `data/`. Each dataset has a sortable, searchable browser view and a direct download link. The shared viewer is `data-viewer.html`; its `dataset` query parameter accepts `raw`, `clean`, or `summary`.

## Add another page

1. Duplicate `other.html` and give it a descriptive lowercase filename, such as `recommendations.html`.
2. Update the page title, heading, and content.
3. Add a card linking to it in `index.html`.

Use relative links such as `href="recommendations.html"` and keep images, CSS, and other shared files inside `assets/` so they are included in the upload.

## Preview locally

Because the data viewer fetches local CSV files, preview the folder through a local web server rather than opening the HTML file directly:

```sh
python3 -m http.server 8000 --directory netlify-demo
```

Then open `http://localhost:8000`.
