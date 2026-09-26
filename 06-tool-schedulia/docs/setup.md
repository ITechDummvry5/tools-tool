# Schedulia Setup Guide

## Requirements

Schedulia is a browser-based web application.

Recommended:

-   A modern web browser
-   A local web server for development when required by JavaScript
    modules or browser behavior
-   Internet access for the CDN-hosted libraries used by the supplied
    HTML

## Project Structure

Use the following structure:

``` text
schedulia/
├── index.html
├── favicon.ico
├── css/
│   └── style.css
├── js/
│   ├── script.js
│   └── script-customn.js
└── img/
    ├── rocket_3d.png
    └── student_study.png
```

The exact filenames and paths should match the references in the HTML.

## 1. Add the HTML

Save the supplied application markup as:

``` text
index.html
```

## 2. Add the Stylesheet

Create the CSS directory and place the application's stylesheet at:

``` text
css/style.css
```

The HTML expects this file with:

``` html
<link rel="stylesheet" href="css/style.css">
```

## 3. Add JavaScript

Place the application's JavaScript files in:

``` text
js/script.js
js/script-customn.js
```

The main application is loaded as an ES module:

``` html
<script type="module" src="js/script.js"></script>
```

The custom dropdown script is loaded separately with `defer`.

## 4. Add Images and Favicon

Place the referenced assets at:

``` text
favicon.ico
img/rocket_3d.png
img/student_study.png
```

The dashboard references the rocket image and student-study image
directly.

## 5. External CDN Dependencies

The HTML loads these resources from external CDNs:

-   Tabler Icons
-   SheetJS/XLSX
-   html2canvas
-   html2pdf.js

An internet connection is therefore needed when these CDN resources are
not available from a local copy.

## 6. Run Locally

For simple testing, you can open `index.html` directly.

For development, a local HTTP server is preferable, especially because
the main JavaScript file uses ES modules.

### VS Code

If using Visual Studio Code, a local development server such as Live
Server can be used.

Start the server and open the project through the local server URL.

## 7. Verify the Application

Check the following after launching:

### Navigation

-   Sidebar pages switch correctly.
-   Mobile sidebar toggle works.

### Dashboard

-   Statistics appear.
-   Today's schedule renders.
-   Quick actions respond.

### Scheduler

-   Weekly grid renders.
-   Classes can be manipulated as intended.
-   Export controls work.

### Master Data

-   Rooms can be managed.
-   Instructors can be managed.
-   Sections can be managed.
-   Subjects can be managed.

### Semesters

-   Semesters can be created and selected.

### Settings

-   Theme and layout controls work.
-   Calendar settings apply.
-   Backup and restore controls work.

## Troubleshooting

### Blank or broken application

Check that:

-   `js/script.js` exists.
-   `js/script-customn.js` exists.
-   `css/style.css` exists.
-   The browser console has no JavaScript errors.
-   File paths match the HTML exactly.

### Icons do not appear

Check the Tabler Icons CDN connection.

### Excel/PDF/Image export does not work

Check that the corresponding CDN libraries have loaded successfully:

-   SheetJS/XLSX
-   html2canvas
-   html2pdf.js

### Images do not appear

Verify:

``` text
img/rocket_3d.png
img/student_study.png
```

and make sure their names and capitalization match the HTML references.

### Data is missing

The supplied HTML identifies IndexedDB as the storage mechanism. Check
browser storage and the application's JavaScript implementation before
clearing site data.

## Backup Recommendation

Use **Download JSON Backup** before:

-   Deleting management data
-   Changing major settings
-   Clearing browser data
-   Moving the application to another browser or machine

The supplied HTML confirms the backup interface, while the exact JSON
schema is defined by the application's JavaScript implementation.
