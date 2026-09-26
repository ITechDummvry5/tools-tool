# Usage

## 1. Open Password Feed

Launch `index.html` in a modern web browser.

## 2. Enter a Password

Use the password field with the placeholder:

```text
Enter your password
```

The input is identified as:

```text
password
```

## 3. Check Password Strength

Click the arrow button next to the password field.

The button is identified as:

```text
checkBtn
```

and displays the `images/right-arrow.png` image.

## 4. View the Strength Bar

The interface contains a visual strength area with a bar identified as:

```text
bar
```

The exact way the bar changes is controlled by the external JavaScript file.

## 5. Read the Strength Message

The page provides a text area identified as:

```text
strengthText
```

Its initial displayed text is:

```text
Strength Bar
```

## 6. Read Suggestions

Additional feedback can be displayed in the element:

```text
suggestion
```

## Interface Flow

```text
Enter Password
      ↓
Click Check
      ↓
Password Strength Bar
      ↓
Strength Text
      ↓
Suggestion
```

## Important Note

The provided HTML establishes the interface and element IDs, but it does not include the contents of `js/script.js`. Therefore, the exact strength rules, scoring system, and suggestion messages are not specified by the supplied HTML.
