# Setup Guide

## Requirements

A basic setup requires:

-   A modern web browser
-   The main HTML file
-   The referenced JavaScript files
-   The favicon
-   Internet access for the external font/icon CDN resources, unless
    those resources are replaced with local copies

No server-side technology is shown in the uploaded HTML.

## Recommended Project Structure

Keep the referenced files in this structure:

``` text
project/
├── index.html
├── favicon.ico
└── js/
    ├── script.js
    └── script-sidebar.js
```

Additional project files may be placed alongside these files as required
by the JavaScript implementation.

## Step 1 --- Place the HTML File

Save the uploaded HTML as your main page, for example:

``` text
index.html
```

The exact filename can be different if your project uses another entry
point, but the browser must load the page containing the Admin Portal
markup.

## Step 2 --- Add JavaScript Files

The HTML explicitly references:

``` html
<script src="js/script.js"></script>
<script src="js/script-sidebar.js"></script>
```

Therefore, create:

``` text
js/script.js
js/script-sidebar.js
```

at those exact relative paths.

These files contain the application's interactive behavior.

## Step 3 --- Add the Favicon

The page references:

``` html
<link rel="icon" href="favicon.ico">
```

Place the favicon beside the HTML file:

``` text
favicon.ico
```

## Step 4 --- External Resources

The page references:

-   Google Fonts
-   Tabler Icons Webfont through jsDelivr

The HTML uses:

``` text
DM Sans
DM Mono
```

If you want the interface to work without an internet connection,
replace the external resources with locally hosted copies.

## Step 5 --- Open the Application

For a simple static test, open the HTML file directly in a browser.

For example:

``` text
index.html
```

If interactive behavior has problems when using `file://`, run the
project through a local HTTP server instead.

## Step 6 --- VS Code

A simple workflow is:

1.  Open the project folder in VS Code.
2.  Confirm the HTML file is in the project root.
3.  Confirm `js/script.js` exists.
4.  Confirm `js/script-sidebar.js` exists.
5.  Confirm `favicon.ico` exists.
6.  Open the HTML in a browser or use a local development server.

## Step 7 --- Test the Interface

Check these areas:

### Navigation

-   All Notes
-   Starred Notes
-   Bug Reports
-   Dynamic modules

### Toolbar

-   Search
-   Sort
-   Tag filter
-   Image filter

### Display

-   Grid view
-   List view
-   Dark/light mode

### Utilities

-   Manage Modules
-   Generate Flowchart
-   Import
-   Export
-   Clear Saved Data

### Modals

-   Add Note
-   Module Manager
-   Connect Notes

## Troubleshooting

### JavaScript buttons do nothing

Check that these files exist:

``` text
js/script.js
js/script-sidebar.js
```

Also open the browser developer console and check for JavaScript errors.

### Icons do not appear

The page loads Tabler Icons from jsDelivr.

Check your internet connection or replace the CDN dependency with a
local copy.

### Fonts look different

The page loads DM Sans and DM Mono from Google Fonts.

If the fonts cannot be loaded, the browser will use fallback fonts.

### Favicon is missing

Confirm:

``` text
favicon.ico
```

is beside the HTML file.

### Mobile sidebar does not work

Check that `js/script-sidebar.js` is loaded and that the browser console
does not report errors.

## Deployment

Because the uploaded HTML is a front-end document, it can be hosted on a
static web host if the required JavaScript and asset paths are
preserved.

Keep the relative structure intact:

``` text
/index.html
/favicon.ico
/js/script.js
/js/script-sidebar.js
```

If additional assets are referenced by the JavaScript files, include
those assets in the deployed project as well.
