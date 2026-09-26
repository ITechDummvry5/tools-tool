# Setup

## Requirements

The Calculator App is a front-end project. The supplied HTML references CSS and JavaScript files, so the project should contain the following files:

```text
src/index.html
src/css/style.css
src/js/script.js
src/favicon.ico
```

A modern web browser is sufficient for running the interface.

## Project Structure

Create the documentation and source structure with:

```bash
mkdir -p 08-calculator-app/{docs,src/css,src/js}

touch 08-calculator-app/{README.md,LICENSE,.gitignore}

touch 08-calculator-app/docs/{overview.md,setup.md,usage.md}

touch 08-calculator-app/src/index.html

touch 08-calculator-app/src/css/style.css

touch 08-calculator-app/src/js/script.js
```

If using the favicon referenced by the supplied HTML, place it at:

```text
src/favicon.ico
```

## HTML Dependencies

The supplied HTML references:

```html
<link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
<link rel="stylesheet" href="css/style.css">
```

and:

```html
<script src="js/script.js"></script>
```

Because these paths are relative to `index.html`, the CSS and JavaScript files should be located beside the HTML file's `css` and `js` directories.

## Running the Project

### Option 1 — Open in a Browser

Open:

```text
src/index.html
```

directly in a modern browser.

### Option 2 — Local Development Server

From the `src` directory, a simple Python server can be used:

```bash
cd 08-calculator-app/src
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Development Notes

The supplied HTML provides the interface structure but does not include the CSS or JavaScript implementation.

Therefore, the exact visual styling and calculator behavior are defined by the contents of:

```text
css/style.css
js/script.js
```

Those files should implement the classes, controls, and interactions used by the HTML.
