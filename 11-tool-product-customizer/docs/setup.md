# Setup

## Requirements

Product Customizer is a front-end HTML, CSS, and JavaScript application.

Recommended:

- Modern web browser
- Code editor
- Local project directory

## Project Structure

Create the project with:

```bash
mkdir -p product-customizer/{docs,src/css,src/js}

touch product-customizer/{README.md,LICENSE,.gitignore}

touch product-customizer/docs/{overview.md,setup.md,usage.md}

touch product-customizer/src/index.html

touch product-customizer/src/css/style.css

touch product-customizer/src/js/script.js
```

## Separate the Supplied HTML

The uploaded file currently contains both CSS and JavaScript inside `index.html`.

Move the contents of the `<style>` block into:

```text
src/css/style.css
```

Move the contents of the `<script>` block into:

```text
src/js/script.js
```

Then reference them from `src/index.html`:

```html
<link rel="stylesheet" href="css/style.css">
<script src="js/script.js"></script>
```

## Default Image

The supplied application uses:

```text
/images/man.png
```

as its default model image. fileciteturn2file0L400-L404

Make sure the image exists at the expected path when running the project.

## Fonts

The supplied HTML imports Barlow Condensed and Barlow from Google Fonts. fileciteturn2file0L5-L8

## Run Locally

Open:

```text
src/index.html
```

in a modern browser.

Or run a local server:

```bash
cd product-customizer/src
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/
```

## Browser APIs

The application uses file upload, drag-and-drop, object URLs, CSS custom properties, blend modes, and the Clipboard API.
