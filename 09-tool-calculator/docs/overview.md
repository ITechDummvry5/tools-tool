# Project Overview

## What is the Calculator App?

The Calculator App is a front-end calculator interface built with HTML, CSS, and JavaScript.

The supplied HTML defines the page structure, calculator header, theme switch, display, keypad, decorative shapes, and footer.

## Page Structure

The document contains the following main sections:

### Decorative Shapes

Two decorative elements are included:

```html
<div class="shape-one"></div>
<div class="shape-two"></div>
```

These elements are intended for visual decoration and are styled through the external CSS file.

### Calculator

The main calculator is contained in:

```html
<div class="calculator">
```

It contains the calculator header, display, and keypad.

### Header

The header contains the calculator title:

```text
calculator
```

It also contains the theme control labeled:

```text
THEME
```

The theme switch provides three labels:

```text
1
2
3
```

and a switch indicator:

```html
<div class="switch-dot"></div>
```

### Display

The calculator display starts with:

```text
0
```

and uses the class:

```text
calc-display
```

### Keypad

The keypad contains controls for:

- `7`, `8`, `9`
- `4`, `5`, `6`
- `1`, `2`, `3`
- `.`, `0`
- `+`
- `-`
- `/`
- `x`
- `DEL`
- `RESET`
- `=`

The keypad is contained in:

```html
<div class="calc-keys">
```

### Footer

The footer displays:

```text
Made by TechDummvry!
```

with `TechDummvry!` wrapped in a `<span>` element.

## External Assets

The HTML references:

```text
favicon.ico
css/style.css
js/script.js
```

The page also uses the standard HTML viewport meta tag for browser and device sizing.
