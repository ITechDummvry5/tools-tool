# Usage

## 1. Upload an Image

Use the **Model Image** area to select an image or drag one into the upload zone. The selected image updates the hero preview and product card. fileciteturn2file0L312-L329

## 2. Select a Gear Color

Choose a predefined swatch or use the custom color picker.

The available palette includes:

```text
Glacier Blue
Arctic Sky
Ember Red
Flame
Solar Gold
Teal Strike
Deep Violet
Neon Rose
Snow White
Midnight
```

fileciteturn2file0L518-L524

## 3. Adjust Intensity

Use the Intensity slider. Its supplied HTML range is 0 to 80, with a default value of 28. fileciteturn2file0L344-L348

## 4. Choose Blend Mode

Select:

```text
Color
Multiply
Screen
Overlay
Hue
Luminosity
```

fileciteturn2file0L360-L370

## 5. Choose Apply To

Select:

```text
Image
Container
Section
```

fileciteturn2file0L373-L380

## 6. Choose Effect Type

Select:

```text
Solid
Gradient
```

Gradient mode reveals the second color picker. fileciteturn2file0L383-L389

## 7. Customize a Gradient

When Gradient is selected, choose a second color. The supplied JavaScript creates a 135-degree linear gradient using the two selected colors. fileciteturn2file0L652-L668

## 8. Remove the Uploaded Image

Click the `✕` button on the image thumbnail. The application restores the default `/images/man.png` image. fileciteturn2file0L701-L709

## 9. Reset

Click **Reset** to restore the default customization settings, including Glacier Blue, 28% intensity, Color blend, Image target, and Solid effect. fileciteturn2file0L712-L732

## 10. Copy CSS

Click **Export CSS** or **Copy CSS**. The application builds CSS from the current color, opacity, blend mode, and effect type, then copies it using the Clipboard API. fileciteturn2file0L735-L749

## Recommended Workflow

```text
Upload Image
    ↓
Choose Gear Color
    ↓
Adjust Intensity
    ↓
Choose Blend Mode
    ↓
Choose Apply To
    ↓
Choose Solid / Gradient
    ↓
Review Live Preview
    ↓
Copy CSS
```
