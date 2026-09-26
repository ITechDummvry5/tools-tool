# Setup

## Requirements

Weather App is a front-end HTML, CSS, and JavaScript project.

Recommended:

- Modern web browser
- Code editor
- Local project directory
- Referenced CSS, JavaScript, and image assets

## Project Structure

Create the project with:

```bash
mkdir -p weather-app/{docs,images/extras}

touch weather-app/{README.md,LICENSE,.gitignore}
touch weather-app/docs/{overview.md,setup.md,usage.md}
touch weather-app/weather.html
touch weather-app/weather.css
touch weather-app/weather.js
```

Place the referenced image assets in:

```text
images/sunny.png
images/extras/windy.png
images/extras/frosty.png
images/extras/temp.png
images/extras/heatwave.png
images/extras/humidity.png
images/extras/bad-weather.png
```

## CSS

The supplied HTML loads:

```text
weather.css
```

from the project root. fileciteturn4file0L3-L8

## JavaScript

The supplied HTML loads:

```text
weather.js
```

from the project root. fileciteturn4file0L94-L94

## Run Locally

Open:

```text
weather.html
```

in a modern browser.

Or use a local development server:

```bash
cd weather-app
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000/weather.html
```

## Important Note

The supplied file contains the HTML structure only. The exact weather-data source, search behavior, API configuration, and JavaScript logic are not included in the provided HTML, so they should be documented from `weather.js` if that file is available.
