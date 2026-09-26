# Usage Guide

## 1. Open the Admin Portal

Make sure the HTML file and its referenced files are kept in the
expected folder structure.

Open the main HTML page in a modern browser.

For full functionality, keep these files available:

``` text
index.html
favicon.ico
js/script.js
js/script-sidebar.js
```

## 2. Navigate Notes

Use the sidebar to switch between:

-   **All Notes** --- displays all available notes.
-   **Starred Notes** --- displays notes marked as starred.
-   **Bug Reports** --- displays notes marked as bug reports.
-   **Modules** --- dynamic navigation generated from the configured
    modules.

On mobile, use the hamburger button to open the sidebar.

## 3. Search Notes

Use the search field in the toolbar.

The search input is labeled:

``` text
Search notes… (Ctrl+K)
```

Type a search term and the note list updates through the application's
JavaScript.

## 4. Sort Notes

The sort menu provides:

``` text
Most Linked
Most Recent
Most Oldest
Ascending Order (A-Z)
Descending Order (Z-A)
```

Choose an option to change the note ordering.

## 5. Filter Notes

Two filters are available:

### Tag filter

Choose:

``` text
All tags
```

or a specific available tag.

### Image filter

Choose:

``` text
All notes
Has image
No image
```

## 6. Change the View

Use the view buttons in the top bar:

-   Grid view
-   List view

Grid view displays note cards.

List view displays compact note rows.

## 7. Add a Note

Click:

``` text
Add Note
```

The note editor allows the application to collect note information such
as:

-   Module information
-   Note content
-   Tags
-   Images
-   Connections

The exact save behavior is handled by the external JavaScript files.

## 8. Star and Report Bugs

The note interface includes:

-   A star control for starred notes.
-   A bug control for bug reports.

Starred notes appear under **Starred Notes**.

Bug-marked notes appear under **Bug Reports**.

## 9. Connect Notes

Use the connection control on a note to open **Connect Notes**.

The dialog provides:

``` text
Cancel
Save Connections
```

Select the notes that should be connected, then save the connections.

## 10. Manage Modules

Open:

``` text
Manage Modules
```

The Module Manager contains two main areas.

### Module list

The left panel contains existing modules and an:

``` text
Add Module
```

button.

### Module editor

The editor supports:

-   Module Name
-   Module Key
-   Module Icon
-   Submodules

Module keys are described by the interface as unique identifiers with no
spaces.

## 11. Manage Submodules

Inside a module, click:

``` text
Add Submodule
```

A submodule form provides:

-   Submodule label
-   Submodule key
-   Icon

Use:

``` text
Save Submodule
```

to save the submodule or:

``` text
Cancel
```

to close the editor.

## 12. Generate a Flowchart

Use:

``` text
Generate Flowchart
```

from the sidebar Utilities section.

The actual flowchart generation is provided by the external JavaScript
implementation.

## 13. Import Data

Choose:

``` text
Import
```

from the Utilities section.

The interface accepts:

``` text
.json
```

files.

Select the JSON file through the browser file picker.

## 14. Export Data

Choose:

``` text
Export
```

from the Utilities section.

The application exports its saved application data through the external
JavaScript implementation.

## 15. Clear Saved Data

Use:

``` text
Clear Saved Data
```

to remove saved application data.

Because this action is destructive, use it carefully.

## 16. Dark and Light Mode

Use the moon button in the top bar to switch between dark and light
appearance.

The page defines separate CSS variables for both themes.

## 17. Mobile Usage

At widths of 768px and below:

-   The sidebar becomes a drawer.
-   The hamburger button appears.
-   The sidebar close button appears.
-   The toolbar becomes more compact.
-   Notes use a single-column layout.
-   The Module Manager switches to a stacked layout.
