# Project Overview

## Project Name

**Mom's Expense Tracker**

## Purpose

Mom's Expense Tracker is a lightweight family expense management
application designed for everyday purchases, grocery trips, weekly
budgeting, and household spending.

The application focuses on keeping the workflow simple:

1.  Add products.
2.  Record quantity and price.
3.  Organize purchases by category.
4.  Set spending limits.
5.  Check items off while shopping.
6.  Review spending.
7.  Export or print the results.

## Main Interface

### Navigation

The top navigation provides access to:

-   Overview
-   Notes
-   Icon Library
-   Dark/light theme controls

### Dashboard

The dashboard summarizes the current week's spending through:

-   Total spent
-   Budget left
-   Number of items
-   Checked-off items
-   Cheapest item
-   Most expensive item
-   Daily spending
-   Daily remaining amount

### Budget System

The tracker supports both weekly and daily limits.

Weekly budgets are stored together with each week's product history.
Daily limits are stored separately and used to calculate the current
day's spending.

### Product System

Each product can contain:

-   ID
-   Name
-   Quantity
-   Price
-   Category
-   Note
-   Icon path
-   Minimum price
-   Maximum price
-   Checked state
-   Starred state
-   Added timestamp

The total cost of a product is calculated as:

``` text
quantity × price
```

### Categories

The application provides five product categories:

  Category   Purpose
  ---------- ------------------------------------------------
  Food       Food and grocery purchases
  Home       Household products
  Personal   Personal-use products
  Bills      Bills and recurring expenses
  Other      Purchases that do not fit the other categories

### Weekly History

The application identifies weeks using a Monday-based week key.

Each stored week contains:

``` text
week key
├── products
└── budget
```

This allows users to review previous weekly purchase data.

### Persistence

Application state is persisted using browser `localStorage`.

The application stores:

-   Weekly history
-   Current week
-   Daily limit
-   Theme preference
-   First-visit state

There is no server-side persistence in the provided application.

### Import and Export

JSON export provides a backup of the current week's data.

The application can restore data through its JSON import modal.

The receipt system also provides CSV export.

### Receipt System

The receipt preview calculates the current week's product total and
displays item information.

Receipts can be:

-   Viewed in the application
-   Grouped by category
-   Printed
-   Exported as CSV

### Visual Design

The interface uses:

-   DM Sans for general interface text
-   DM Serif Display for major display typography
-   Dark and light themes
-   Rounded cards and controls
-   Responsive layouts
-   Browser-native canvas drawing for the spending trend

### Browser Architecture

The project is client-side only.

``` text
Browser
│
├── HTML
│   └── Interface
│
├── CSS
│   └── Layout + themes + responsive design
│
├── JavaScript
│   ├── Application state
│   ├── Product management
│   ├── Budget calculations
│   ├── Weekly history
│   ├── Receipt generation
│   ├── Import/export
│   └── localStorage
│
└── icons/
    └── Product images
```

## Limitations

The current implementation does not include:

-   User accounts
-   Cloud synchronization
-   Server-side database storage
-   Multi-device synchronization
-   Authentication
-   Online receipt storage

Data is tied to the browser's local storage unless the user exports a
backup.
