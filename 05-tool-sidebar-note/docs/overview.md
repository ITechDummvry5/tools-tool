# Overview

## Project Identity

**USERMANUAL 2026 --- Admin Portal** is a browser-based administrative
interface designed around a structured note-management system.

The page title identifies the application as:

``` text
USERMANUAL 2026 — Admin Portal
```

## Application Layout

The interface is divided into two primary areas:

``` text
┌───────────────────────┬──────────────────────────────────┐
│ Sidebar               │ Main Content                     │
│                       │                                  │
│ All Notes             │ Top Bar                          │
│ Starred Notes         │ Search / Sort / Filters          │
│ Bug Reports           │ Module Coverage                  │
│ Dynamic Modules       │ Notes                             │
│                       │                                  │
│ Utilities             │                                  │
│  Manage Modules       │                                  │
│  Generate Flowchart   │                                  │
│  Import / Export      │                                  │
│  Clear Saved Data     │                                  │
└───────────────────────┴──────────────────────────────────┘
```

## Sidebar

The sidebar is a dark navigation panel with:

-   Application branding
-   All Notes
-   Starred Notes
-   Bug Reports
-   Dynamic modules
-   Utility actions
-   Auto-save indicator
-   Admin area

The sidebar width is defined by a CSS variable and changes for
tablet/mobile layouts.

## Notes

Notes are represented by cards in grid view or rows in list view.

The visual structure supports:

-   Note title
-   Description/content
-   Tags
-   Images
-   Star status
-   Bug status
-   Connections
-   Date
-   Author
-   Note actions

The exact data model and persistence logic are handled by the external
JavaScript files.

## Search, Sorting, and Filtering

The toolbar provides a combined note-management workflow:

``` text
Search
  ↓
Sort
  ↓
Tag Filter
  ↓
Image Filter
  ↓
Rendered Notes
```

Available sort modes are based on the labels defined in the HTML:

-   Most Linked
-   Most Recent
-   Most Oldest
-   A--Z
-   Z--A

## Modules and Submodules

The application supports a hierarchical navigation structure:

``` text
Module
├── Submodule
├── Submodule
└── Submodule
```

A module has:

-   Name
-   Unique key
-   Icon
-   Submodules

A submodule has:

-   Label
-   Key
-   Icon

The Module Manager provides creation, editing, saving, and deletion
controls.

## Module Coverage

The main interface includes a progress indicator labeled:

``` text
Module coverage
```

The percentage is displayed beside a progress bar.

The calculation is implemented by the external JavaScript.

## Note Connections

The interface includes a dedicated connection modal.

Its purpose is to associate one note with other notes.

The connection interface contains:

-   Connected-note selection
-   Cancel
-   Save Connections

This supports relationships between related documentation items.

## Import and Export

The sidebar provides JSON import/export controls.

The import input is restricted to:

``` text
.json
```

files.

The application therefore supports moving or backing up its saved data
through JSON.

## Flowchart

The sidebar provides:

``` text
Generate Flowchart
```

This indicates that the application can generate a visual representation
from its managed structure.

The implementation is located in the referenced JavaScript rather than
the uploaded HTML.

## Appearance

The interface supports:

-   Light mode
-   Dark mode
-   Responsive layouts
-   Grid/list switching
-   Compact controls
-   Animated cards and modals

The primary visual system uses:

-   DM Sans
-   DM Mono
-   Tabler Icons
-   Green utility/action accents
-   Dark sidebar
-   Light/dark content surfaces

## Browser Architecture

The uploaded page is a static front-end document:

``` text
HTML
 │
 ├── CSS
 │
 ├── Google Fonts
 │
 ├── Tabler Icons
 │
 └── JavaScript
      ├── script.js
      └── script-sidebar.js
```

The HTML itself does not define a server-side backend.

## Important Scope Note

The uploaded source contains the interface markup and styling but
references the main behavior through:

``` text
js/script.js
js/script-sidebar.js
```

Therefore, behavior that cannot be verified from the HTML alone is
intentionally not documented as a confirmed implementation detail.
