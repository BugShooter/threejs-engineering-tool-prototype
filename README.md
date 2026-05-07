# Three.js Engineering Tool Prototype

A browser-based engineering tool prototype built as my first practical Three.js project.

It explores assembly-style interaction in the browser: starting from an empty scene, creating parts, connecting compatible ports, adjusting transforms, and saving scene state.

This prototype grew out of an on-site observation day where I got to observe the workflow of the Digital Services team at item Industrietechnik GmbH. It was loosely inspired by industrial web configuration tools such as the [item Engineering Tool](https://tools.item24.com/DEen/tools/engineeringtool/).

## Features

- Create and edit a 3D assembly directly in the browser
- Start from an empty scene and build assemblies incrementally
- Use a structured editor shell with `Structure`, `Properties`, and `Library` tabs plus bottom `Hints`, `Parts`, and `Assemblies` work areas
- Connect compatible part ports with alignment, snap behavior, and cursor-driven target selection
- Adjust position, rotation, and profile length through gizmos, callouts, and the unified Properties inspector
- Reuse saved assemblies, undo/redo changes, clear the scene, and export/import assemblies as JSON

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