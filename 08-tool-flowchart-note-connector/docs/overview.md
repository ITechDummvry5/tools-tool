# Project Overview

## What is FlowNotes?

FlowNotes is a visual flowchart workspace implemented as a browser interface. The main canvas contains movable cards, while SVG paths are used to display relationships between cards.

The uploaded application defines the FlowNotes interface, card layouts, connection system, canvas controls, and add-card modal in the HTML document.

## Main Interface

### Toolbar

The toolbar provides:

- **Add Card** — opens the card creation modal.
- **Zoom controls** — increase or decrease canvas zoom.
- **Reset** — resets the canvas view.
- **Clear** — clears the current board.
- **Connections** — opens or closes the connections panel.

The application also displays a short interaction hint in the toolbar.

## Canvas

The canvas contains:

- A background grid.
- Movable cards.
- An SVG layer for connections.
- Pan and zoom behavior.

Cards are positioned with `x` and `y` coordinates and rendered inside the canvas.

## Card System

Cards are represented as nodes. Each node can contain properties such as:

```text
id
type
title
description
color
x
y
```

Some card types also support additional data such as:

```text
url
price
```

## Connections

Connections are stored separately from cards. A connection contains:

```text
id
from
to
color
label
```

The connection system supports:

- Selecting a source card.
- Selecting one or more target cards.
- Assigning a shared label.
- Choosing a connection color.
- Displaying directional arrows.
- Editing labels and colors from the connections panel.
- Removing connections.

## Visual Design

The interface uses a dark theme with:

- Inter for general interface text.
- JetBrains Mono for URL-style text.
- A blue primary accent.
- Rounded cards and controls.
- A subtle grid background.

The card styles are defined for each supported card type so that every node can represent a different stage or piece of a user flow.
