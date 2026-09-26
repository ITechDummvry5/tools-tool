# Usage

## Calculator Layout

The calculator interface contains:

1. A calculator title
2. A theme selector
3. A display
4. A numeric and operator keypad
5. A footer

## Theme Selector

The header includes a theme control with three positions:

```text
1   2   3
```

The selected theme is represented by the `switch-dot` element.

The supplied HTML defines the control structure, while the behavior and visual changes are handled by the project CSS and JavaScript.

## Calculator Buttons

### Numbers

Use the numeric buttons:

```text
0 1 2 3 4 5 6 7 8 9
```

### Decimal

The `.` button provides the decimal-point control.

### Operators

The calculator provides four operator buttons:

```text
+
-
/
x
```

### Delete

The `DEL` button is provided for deleting calculator input.

### Reset

The `RESET` button is provided for resetting the calculator.

### Equals

The `=` button is provided for completing a calculation.

## Display

The calculator display initially shows:

```text
0
```

The JavaScript file is responsible for updating the display as the calculator is used.

## Suggested Interaction Flow

A typical calculation follows this structure:

```text
Enter number
    ↓
Choose operator
    ↓
Enter second number
    ↓
Press =
    ↓
View result
```

For a decimal calculation:

```text
Enter number
    ↓
Press .
    ↓
Enter decimal digits
    ↓
Choose operator
    ↓
Enter next value
    ↓
Press =
```

## Resetting or Editing Input

Use `DEL` when input needs to be deleted.

Use `RESET` when the calculator should be returned to its initial state.

## Notes

The supplied HTML establishes the available controls and their labels. It does not itself define the calculation algorithm, theme-switching behavior, or button event handling. Those behaviors belong to `js/script.js`.
