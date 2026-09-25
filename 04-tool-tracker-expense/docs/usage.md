# Usage Guide

## 1. Start the Tracker

Open `index.html` in a modern web browser.

The first visit displays a short dedication screen before opening the
tracker.

## 2. Add a Product

1.  Select **+ Add Product**.
2.  Enter the product name.
3.  Select a category.
4.  Enter the quantity.
5.  Enter the price per item.
6.  Optionally enter a minimum and maximum price.
7.  Optionally select an icon.
8.  Add a note if needed.
9.  Select **Save product**.

The expense is added to the current week.

## 3. Edit a Product

Select an existing product card to open its edit controls, then update
its information and save the changes.

## 4. Check Off Products

Use the check action on a product after it has been purchased.

You can also use:

-   **Mark all checked**
-   **Uncheck all**

Checked products remain stored but are visually marked as completed.

## 5. Delete Products

Use the delete action on a product.

The tracker temporarily provides an **Undo** option through the toast
notification so the deleted item can be restored.

## 6. Duplicate Products

Use the duplicate action when you want another product with the same
basic information.

The duplicated item receives a new ID and is initially unchecked.

## 7. Star Frequently Purchased Products

Use the star action to mark products as frequently bought.

Starred products appear in the **Frequently bought** section and can be
quickly duplicated.

## 8. Search and Filter

Use the search field to search product names and notes.

Category filters are available for:

-   All
-   Food
-   Home
-   Personal
-   Bills
-   Other

The sort menu supports:

-   Date added
-   Price ascending
-   Price descending
-   Category

## 9. Manage Weekly Budgets

Enter an amount in **Set weekly budget** and select **Set budget**.

You can also:

-   Add extra budget
-   Reset the budget

The budget bar shows the percentage used.

The tracker displays a warning when spending reaches 80% of the weekly
budget and marks the budget as over when spending reaches or exceeds it.

## 10. Set a Daily Limit

Enter a daily amount and select **Set daily limit**.

The tracker calculates:

-   Spending for the current day
-   Remaining daily allowance
-   Whether the daily limit has been exceeded

## 11. Use Weekly History

Weekly tabs allow you to switch between stored weeks.

Select **+ New week** to create or switch to the current week's data.

Each week stores its own products and weekly budget.

## 12. View Spending Breakdown

The breakdown section shows spending across:

-   Food
-   Home
-   Personal
-   Bills
-   Other

Each category displays its relative percentage and amount.

## 13. View the Spending Trend

The weekly spending trend is rendered using a canvas chart based on the
stored weekly data.

## 14. Generate a Receipt

Select **Receipt** to display the receipt preview.

You can optionally enter:

-   Store name
-   Store location

You can also switch between normal receipt display and grouping items by
category.

## 15. Print a Receipt

Select **Print** to generate the current receipt and open the browser
print dialog.

The page includes print-specific styling so that the receipt can be
printed without the rest of the application interface.

## 16. Export Data

### JSON

Select **JSON** to download the current week's data as a JSON file.

The filename follows this format:

``` text
mom_expenses_YYYY-MM-DD.json
```

### CSV

The receipt section provides an **Export CSV** action for exporting the
current receipt data.

## 17. Import Data

1.  Select **Import**.
2.  Paste previously exported JSON.
3.  Select **Import**.

The tracker accepts either:

``` json
[
  {
    "name": "Rice",
    "qty": 1,
    "price": 50
  }
]
```

or the application export structure containing:

``` json
{
  "week": "2026-09-21",
  "budget": 5000,
  "products": []
}
```

## 18. Change Theme

Use the theme toggle in the top navigation to switch between:

-   Dark mode
-   Light mode

The selected theme is saved locally.

## 19. Add Custom Icons

Place PNG icon files inside the `icons/` directory and add their
filenames to the icon library in the application.

For example:

``` text
icons/rice.png
```

Then search for `rice` while adding a product.

## 20. Data Safety

The application uses browser storage rather than a remote database.

Recommended workflow:

1.  Use the tracker normally.
2.  Export JSON regularly.
3.  Keep the exported backup somewhere safe.
4.  Import the backup when restoring data.

Clearing browser storage can remove locally saved tracker data.
