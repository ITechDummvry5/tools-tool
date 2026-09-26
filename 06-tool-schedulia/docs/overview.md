# Schedulia Overview

## Purpose

Schedulia is a student-focused scheduling interface for organizing
weekly classes and the academic data used by those schedules.

The application combines a dashboard, calendar grid, subject directory,
master-data management, semester management, settings, backup tools, and
export features.

## Application Layout

### Sidebar

The sidebar provides navigation to the application's main pages:

1.  Dashboard
2.  Weekly Grid
3.  Subjects List
4.  Room Management
5.  Instructor Management
6.  Section Management
7.  Subject Management
8.  Semesters
9.  Settings

A Shortcuts Help button is also available.

### Top Navigation

The top navigation contains:

-   Mobile sidebar toggle
-   Semester selector
-   Global search
-   Add Subject button

The search field is labeled for searching classes, rooms, and teachers.

## Dashboard

The dashboard presents four summary cards:

-   Total Classes
-   Class Hours
-   Weekly Free Hours
-   Longest Subject

It also contains:

-   Today's Schedule
-   Quick Actions
-   A scheduler introduction banner
-   A semester-management banner

Quick actions include adding a subject, duplicating a class, exporting a
PDF grid, and importing a JSON backup.

## Weekly Calendar

The Weekly Grid page provides a visual calendar for scheduled classes.

The page describes support for:

-   Dragging classes to reschedule
-   Resizing class duration
-   Excel export
-   PNG/image export
-   Landscape PDF export

The calendar itself is rendered dynamically by the application's
JavaScript.

## Subject Directory

The Subjects List provides a table with:

-   Subject
-   Instructor
-   Room
-   Day
-   Time Span
-   Actions

Instructor and room selectors are available as filters.

## Master Data

Schedulia separates reusable academic records from individual schedule
entries.

The available management areas are:

### Room Management

Maintains rooms available for scheduling.

### Instructor Management

Maintains instructors available for scheduling.

### Section Management

Maintains sections available for scheduling.

### Subject Management

Maintains the catalog of subjects available for scheduling.

## Semester Management

The Semester Manager is designed to keep schedules separated by semester
or year.

A semester can be created from the Semesters page, and the active
semester can be selected from the top navigation.

## Subject Editor

The Add/Edit Subject modal contains the information needed for a class
schedule:

-   Subject
-   Instructor
-   Room
-   Section
-   Day
-   Start time
-   End time
-   Notes
-   Custom colors
-   Image attachments

Image attachment slots are provided for:

-   Subject
-   Teacher
-   Logo

Edit mode also exposes copy-to-day and duplication operations.

## Settings

The Configuration Center is divided into several areas.

### Appearance Styling

Includes theme, layout density, sidebar position, global font scale,
glassmorphism, and accent-color controls.

### Calendar Grid Settings

Includes grid start hour, grid end hour, time-interval snapping, and
visible weekdays.

### Storage & Backups

Includes JSON download and restore controls, plus management-data
deletion.

## Data Storage

The HTML explicitly describes browser storage as IndexedDB.

The exact database schema, object stores, synchronization behavior, and
JavaScript persistence implementation are not visible in the supplied
HTML, so those details should be documented from `js/script.js` if a
complete technical architecture document is required.

## External Libraries

The page references:

-   Tabler Icons Webfont
-   SheetJS/XLSX
-   html2canvas
-   html2pdf.js

These are loaded through external CDNs.

## Related Files

The supplied HTML references:

``` text
css/style.css
js/script.js
js/script-customn.js
favicon.ico
img/rocket_3d.png
img/student_study.png
```
