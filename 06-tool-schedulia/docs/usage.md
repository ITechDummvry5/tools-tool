# Schedulia Usage Guide

## 1. Open Schedulia

Place the project files in the expected folder structure and open
`index.html` in a modern browser.

For the complete application, keep the referenced JavaScript, CSS,
image, and favicon files available.

## 2. Navigate the Application

Use the left sidebar to switch between:

-   Dashboard
-   Weekly Grid
-   Subjects List
-   Room Management
-   Instructor Management
-   Section Management
-   Subject Management
-   Semesters
-   Settings

On smaller screens, the sidebar can be opened using the sidebar toggle.

## 3. Select a Semester

The top navigation contains a Semester selector. Use it to switch the
active academic schedule.

## 4. Add a Subject

Click **Add Subject** from the top navigation, dashboard, or subject
directory.

The subject form provides:

-   Subject
-   Instructor
-   Room
-   Section
-   Day
-   Start time
-   End time
-   Notes or description
-   Background color
-   Text color
-   Border color
-   Image attachments

Click **Save Subject** to save the schedule entry.

## 5. Edit or Duplicate Classes

The subject editor includes schedule operations for editing mode:

-   Copy to Day
-   Duplicate

These controls are intended for quickly reusing an existing class
schedule.

## 6. Weekly Calendar

Open **Weekly Grid** to view the schedule.

The interface indicates that classes can be dragged to reschedule them
and resized to change their duration.

Export options are available for:

-   Excel
-   Image
-   PDF

## 7. Subjects Directory

Open **Subjects List** to browse scheduled subjects.

Use the available filters to narrow the list by:

-   Instructor
-   Room

## 8. Manage Master Data

Use the Master Data pages to maintain reusable records.

### Rooms

Add and manage available rooms.

### Instructors

Add and manage instructors.

### Sections

Add and manage sections.

### Subjects

Maintain the catalog of subjects available for scheduling.

## 9. Manage Semesters

Open **Semesters** to create and manage separate schedules for semesters
or years.

Use the semester selector in the navigation bar to switch schedules.

## 10. Customize the Interface

The Settings page provides controls for:

-   System, light, dark, and high-contrast themes
-   Comfortable, compact, and dense layouts
-   Icons + text, icons-only, or hidden sidebar
-   Small, normal, or large fonts
-   Glassmorphism overlay
-   Accent colors
-   Calendar start hour
-   Calendar end hour
-   15, 30, or 60-minute time intervals
-   Visible days

## 11. Back Up Data

The Storage & Backups section provides:

-   **Download JSON Backup**
-   **Restore JSON Backup**

The interface states that application data is stored in the browser
using IndexedDB.

Regular JSON backups are recommended before clearing management data or
making major changes.

## 12. Delete Management Data

Settings provides a management-data deletion control for:

-   Instructors
-   Rooms
-   Sections
-   Subjects
-   All management data

The interface warns that existing schedules keep their saved values but
lose the associated quick dropdown when management data is deleted.

## 13. Keyboard Shortcuts

Open **Shortcuts Help** to view:

  Shortcut     Action
  ------------ ------------------------
  `Ctrl + Z`   Undo last action
  `Ctrl + Y`   Redo last action
  `Ctrl + N`   Create new class block
  `Ctrl + P`   Print visual schedule
  `ESC`        Close active modal
