# USERMANUAL 2026 --- Admin Portal

A browser-based **Admin Portal / User Manual interface** for organizing
notes, bug reports, modules, submodules, images, tags, and note
connections.

The interface is built as a static HTML page and relies on external
JavaScript files for its interactive behavior.

## Features

-   All Notes view
-   Starred Notes view
-   Bug Reports view
-   Dynamic module groups in the sidebar
-   Search notes
-   Sort notes by:
    -   Most Linked
    -   Most Recent
    -   Most Oldest
    -   A--Z
    -   Z--A
-   Filter by tag
-   Filter notes by image presence
-   Grid and list views
-   Add notes
-   Edit notes
-   Star notes
-   Mark notes as bug reports
-   Add and manage note tags
-   Add note images
-   Connect notes together
-   Manage modules and submodules
-   Choose icons for modules and submodules
-   Generate flowcharts
-   Import saved JSON data
-   Export saved data
-   Clear saved data
-   Dark/light mode
-   Responsive mobile sidebar
-   Mobile hamburger navigation
-   Module coverage progress indicator
-   Auto-save status indicator

## Technology

-   HTML5
-   CSS3
-   Vanilla JavaScript
-   DM Sans and DM Mono fonts
-   Tabler Icons Webfont
-   Browser-side application architecture

## Project Structure

``` text
project/
├── index.html
├── favicon.ico
├── js/
│   ├── script.js
│   └── script-sidebar.js
└── ...
```

The uploaded HTML references `js/script.js` and `js/script-sidebar.js`,
so both files are required for the complete interactive application.

## Main Interface

### Sidebar

The sidebar provides navigation for:

-   All Notes
-   Starred Notes
-   Bug Reports
-   Dynamic module groups
-   Manage Modules
-   Generate Flowchart
-   Import
-   Export
-   Clear Saved Data

The sidebar also displays an Auto-saved status and an Admin/sign-out
area.

### Main Area

The main content area provides:

-   Page title and Manual badge
-   Dark/light mode toggle
-   Grid/list view controls
-   Add Note button
-   Search
-   Sorting
-   Tag filtering
-   Image filtering
-   Module coverage progress
-   Note cards/list items

## Module Manager

The Module Manager is opened from the sidebar.

It supports:

-   Creating modules
-   Editing module names
-   Assigning unique module keys
-   Selecting module icons
-   Adding submodules
-   Editing submodules
-   Assigning submodule icons
-   Saving modules
-   Deleting modules

## Note Connections

Notes can be connected to other notes through the **Connect Notes**
interface.

The connection dialog provides:

-   A list of available notes
-   Selection of connections
-   Save Connections
-   Cancel

## Responsive Design

The interface adapts to smaller screens.

On mobile:

-   The sidebar becomes a drawer.
-   A hamburger button opens the sidebar.
-   A close button closes the sidebar.
-   The main content changes to a single-column layout.
-   The Module Manager changes to a mobile-friendly stacked layout.

## External Resources

The page references:

-   Google Fonts for DM Sans and DM Mono
-   Tabler Icons Webfont through jsDelivr
-   A local favicon
-   Local JavaScript files

## Important

This README describes the interface present in the uploaded HTML.
Detailed application logic is implemented in the referenced JavaScript
files and is therefore not inferred here.
