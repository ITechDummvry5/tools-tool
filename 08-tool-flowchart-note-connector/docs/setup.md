# Setup

## Requirements

FlowNotes is a front-end browser application. The supplied project uses HTML, CSS, and JavaScript, so a full backend is not required for the basic interface.

Recommended:

- A modern web browser.
- A local project folder.
- A code editor such as VS Code.

## Project Structure

Create the project with:

```bash
mkdir -p 08-tool-flowchart-note/{docs,src/css,src/js}

touch 08-tool-flowchart-note/{README.md,LICENSE,.gitignore}

touch 08-tool-flowchart-note/docs/{overview.md,setup.md,usage.md}

touch 08-tool-flowchart-note/src/index.html

touch 08-tool-flowchart-note/src/css/style.css

touch 08-tool-flowchart-note/src/js/script.js
```

## Running the Project

### Option 1: Open Directly

Open:

```text
src/index.html
```

in a modern browser.

### Option 2: Use a Local Server

From the project directory, run a simple HTTP server if you prefer browser-server development.

For Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/src/
```

## Development Notes

The supplied HTML currently contains the main interface styles and JavaScript behavior in the same document. If the project is separated into the planned structure, move:

- CSS rules into `src/css/style.css`
- JavaScript logic into `src/js/script.js`
- HTML markup into `src/index.html`

Keep the element IDs and class names consistent unless the JavaScript is updated at the same time.

## Troubleshooting

### Cards do not move

Check that the browser JavaScript is enabled and that the canvas event handlers are loaded.

### Connections are not visible

Make sure the SVG connection layer is present and that both connected cards exist on the canvas.

### External fonts do not load

The interface references Google Fonts. If the fonts cannot be reached, the browser will fall back to the available font stack.

### Layout looks incorrect

Use a current desktop browser and check that the CSS is loaded from the expected path.
