# Schedulia

Schedulia is a premium student class scheduling web application designed
to organize weekly classes, subjects, instructors, rooms, sections,
semesters, and related academic data in one interface.

## Features

-   Dashboard with total classes, class hours, weekly free hours, and
    longest subject
-   Today's schedule
-   Weekly drag-and-drop calendar
-   Subject directory with instructor and room filters
-   Add, edit, delete, copy, and duplicate class schedules
-   Conflict detection area in the subject editor
-   Room, instructor, section, and subject catalog management
-   Semester management and semester switching
-   Search across classes, rooms, and teachers
-   Excel, PNG, PDF, and JSON export/import tools
-   Custom subject colors
-   Subject, instructor, and logo image attachments
-   Configurable theme, layout density, sidebar, and font scale
-   Glassmorphism option
-   Calendar start/end hours and time intervals
-   Selectable days of the week
-   Browser-based IndexedDB storage
-   JSON backup and restore
-   Keyboard shortcuts
-   Responsive mobile sidebar

## Technology

-   HTML5
-   CSS3
-   JavaScript ES Modules
-   Tabler Icons
-   SheetJS/XLSX for Excel export
-   html2canvas for image export
-   html2pdf.js for PDF export
-   IndexedDB for browser storage

## Project Structure

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

The HTML also loads external libraries from CDNs.

## Main Areas

### Dashboard

Provides summary statistics, today's schedule, and quick actions.

### Weekly Grid

Displays the weekly calendar and supports schedule manipulation. Export
buttons are provided for Excel, image, and PDF output.

### Subjects List

Shows scheduled subjects in a table with instructor and room filtering.

### Master Data

Maintains reusable records for:

-   Rooms
-   Instructors
-   Sections
-   Subjects

### Semesters

Allows separate schedules to be managed for different semesters or
years.

### Settings

Controls appearance, calendar rules, visible days, storage backups, and
management-data deletion.

## Important Scope

This documentation is based on the supplied `index.html`. The detailed
implementation of scheduling, storage, conflict detection, and export
behavior is handled by the referenced JavaScript files, especially
`js/script.js`. Where the HTML only exposes an interface element, this
documentation does not assume undocumented internal behavior.
