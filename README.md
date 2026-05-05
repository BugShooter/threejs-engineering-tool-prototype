# Three.js Engineering Tool Prototype

A browser-based engineering tool prototype built as my first practical Three.js project.

It explores assembly-style interaction in the browser: creating parts, connecting compatible ports, adjusting transforms, and saving scene state.

This prototype grew out of an on-site observation day where I got to observe the workflow of the Digital Services team at item Industrietechnik GmbH. It was loosely inspired by industrial web configuration tools such as the [item Engineering Tool](https://tools.item24.com/).

## Features

- Create and edit a 3D assembly directly in the browser
- Connect compatible part ports with alignment and snap behavior
- Use a cursor-driven target selection workflow for connections
- Adjust position, rotation, and part-specific parameters
- Export and import assemblies as JSON

## Tech Stack

- Vanilla JavaScript
- Three.js
- HTML and CSS

## Run Locally

No build step or backend is required.

You can open `index.html` directly in your browser.

If you want the same access pattern as static hosting, run a simple local server instead:

```bash
python3 -m http.server 8000
```

Run the command from this repository folder, then open `http://localhost:8000/` in your browser.