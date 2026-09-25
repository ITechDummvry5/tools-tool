# Setup Guide

## Requirements

The project is a static HTML application.

You need:

-   A modern web browser
-   The project files
-   The `icons/` directory and its image files

No backend server, package manager, or database is required for the
basic application.

## Recommended Folder Setup

Keep the project files together:

``` text
mom-expense-tracker/
├── index.html
├── notes.html
├── iconlib.html
├── icons/
└── docs/
```

The main application expects icon images at:

``` text
icons/<filename>.png
```

## Option 1: Open Directly

The simplest setup is to open:

``` text
index.html
```

in a browser.

This works for the main client-side features because the application
uses HTML, CSS, JavaScript, canvas, and localStorage.

## Option 2: Use VS Code

1.  Open the project folder in Visual Studio Code.
2.  Open `index.html`.
3.  Run the file using your preferred local development extension or
    browser workflow.
4.  Confirm that the `icons/` folder is beside `index.html`.

## Option 3: Use a Local HTTP Server

A local server can provide a more consistent development environment.

For example, with Python installed:

``` bash
python -m http.server 8000
```

Then open:

``` text
http://localhost:8000
```

The project itself does not require Python; this is only an optional
development server.

## Icon Setup

The application contains an icon library with filenames such as:

``` text
rice.png
kape.png
agahan.png
miryenda.png
ulam.png
baon.png
bills.png
lazada.png
shopee.png
groceries.png
tubig.png
egg.png
fastfooddelivery.png
gamot.png
delata.png
gas.png
school.png
default.png
```

Place the matching files inside:

``` text
icons/
```

The application references them using paths such as:

``` text
icons/rice.png
```

If an icon file is missing, the application can still run, but its image
preview may not display correctly.

## First Run

On the first visit:

1.  The dedication screen is shown.
2.  The application initializes its local data.
3.  The current week is loaded.
4.  The saved theme is applied.
5.  The dashboard is rendered.

The first-visit state is stored using:

``` text
mom_seen
```

## Storage

The application uses browser `localStorage`.

Primary keys include:

``` text
mom_weekHistory
mom_currentWeek
mom_dailyLimit
mom_theme
mom_seen
```

Avoid clearing site data if you want to keep locally stored expenses.

## Backup Before Moving Browsers

Before changing browsers, clearing site data, or moving to another
computer:

1.  Open the tracker.
2.  Export the current data as JSON.
3.  Save the downloaded JSON file.
4.  Open the tracker on the new browser/device.
5.  Use **Import**.
6.  Paste the JSON backup.
7.  Confirm the imported products and budget.

## Development Notes

The main application is contained in the provided HTML file, including:

-   Markup
-   CSS
-   JavaScript

The application does not depend on a JavaScript framework.

The page loads Google Fonts for:

``` text
DM Sans
DM Serif Display
```

If the fonts cannot be loaded, the browser falls back to the declared
fallback fonts.

## Troubleshooting

### Icons do not appear

Check that:

``` text
index.html
icons/
```

are at the expected locations and that the filename entered in the icon
library exactly matches the image filename.

### Data disappeared

Check whether browser site data or localStorage was cleared.

If you have a JSON backup, use **Import** to restore it.

### Imported data fails

Make sure the pasted content is valid JSON.

The importer accepts either an array of products or an object containing
a `products` array.

### Theme resets

The theme is saved in localStorage. If browser site data is cleared, the
theme returns to its default state.

## Deployment

Because the application is client-side, it can be deployed to a static
hosting service.

The deployment must preserve the relative structure of:

``` text
index.html
icons/
```

and any linked pages such as:

``` text
notes.html
iconlib.html
```

No server-side runtime is required for the core tracker.
