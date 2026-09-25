# Mom's Expense Tracker

A simple, browser-based family expense tracker for recording daily
purchases, managing weekly budgets, and keeping spending organized.

## Features

-   Add, edit, duplicate, delete, and check off products
-   Organize products into Food, Home, Personal, Bills, and Other
-   Set a weekly budget and optional daily spending limit
-   View total spending, budget remaining, item count, and checked items
-   See cheapest and most expensive items
-   View daily spending and remaining daily limit
-   View spending breakdown by category
-   View a weekly spending trend
-   Search and filter products
-   Sort by date added, price, or category
-   Mark frequently purchased products with a star
-   Quick-add products from recent purchases
-   Switch between weekly histories
-   Generate and print a receipt
-   Export data as JSON or CSV
-   Import previously exported JSON data
-   Dark and light themes
-   Responsive layout for smaller screens
-   Browser localStorage persistence
-   Custom product icons from the `icons/` folder

## Technology

This project is intentionally lightweight and runs entirely in the
browser.

-   HTML5
-   CSS3
-   Vanilla JavaScript
-   Canvas API for the spending trend
-   Browser localStorage for persistence
-   No backend or database required

## Project Structure

``` text
mom-expense-tracker/
├── index.html
├── notes.html
├── iconlib.html
├── icons/
│   ├── rice.png
│   ├── kape.png
│   ├── agahan.png
│   ├── miryenda.png
│   ├── ulam.png
│   ├── baon.png
│   ├── bills.png
│   ├── lazada.png
│   ├── shopee.png
│   ├── groceries.png
│   ├── tubig.png
│   ├── egg.png
│   ├── fastfooddelivery.png
│   ├── gamot.png
│   ├── delata.png
│   ├── gas.png
│   ├── school.png
│   └── default.png
├── README.md
├── USAGE.md
├── OVERVIEW.md
└── SETUP.md
```

## Data Storage

The application stores its data locally in the browser using
`localStorage`. It does not require a server or external database.

Important storage keys include:

-   `mom_weekHistory`
-   `mom_currentWeek`
-   `mom_dailyLimit`
-   `mom_theme`
-   `mom_seen`

Because the data is stored in the browser, exporting JSON backups is
recommended before clearing browser storage or moving to another device.

## License

Add your preferred license here if this project will be distributed
publicly.
