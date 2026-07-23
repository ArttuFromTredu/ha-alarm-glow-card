# alarm-glow-card
<img width="1594" height="1262" alt="image" src="https://github.com/user-attachments/assets/65b2fd26-04cc-40ab-8395-16c45715e7c4" />

A zero-dependency Home Assistant custom Lovelace card that projects a soft, pulsing glow around the entire browser viewport when an alarm helper is active. The glow colour is driven by a separate `input_select`, and all transitions — turn on, turn off, and colour changes — are smoothly animated.

---

## Features

- Full-viewport inset glow with a three-layer bloom effect
- Smooth **fade in / fade out** when the alarm toggles (1 s ease)
- Smooth **colour crossfade** when the selected colour changes (0.8 s ease)
- Configurable **pulse speed**
- Click-through (`pointer-events: none`) — never blocks the UI
- Works across Lovelace view navigation without dropping the effect

---

## Preview

| Off | On (Cyan) | On (Red) |
|-----|-----------|----------|
| No glow | Soft cyan pulse around edges | Soft red pulse around edges |

---

## Requirements

- Home Assistant with Lovelace dashboards
- The `input_boolean` and `input_select` helpers defined (see [Configuration](#configuration))

---

## Installation

### 1. Copy the card file

Copy `www/alarm-glow-card.js` into your Home Assistant `config/www/` folder.

### 2. Register as a Lovelace resource

Go to **Settings → Dashboards → (⋮ menu) → Resources** and add:

| Field | Value |
|-------|-------|
| URL | `/local/alarm-glow-card.js` |
| Resource type | JavaScript module |

### 3. Add the card to a Lovelace view

Open a dashboard view in the raw YAML editor and add:

```yaml
type: custom:alarm-glow-card
```

Place it **once per view** where you want the effect. Because the overlay uses `position: fixed` and is appended directly to `<body>`, it covers the entire viewport regardless of where in the view the card sits.

---

## Configuration

All keys are optional — the defaults match the helper entities created by the package below.

```yaml
type: custom:alarm-glow-card
alarm_entity:   input_boolean.alarm_active    # boolean that arms the effect
color_entity:   input_select.alarm_glow_color # select whose state is a colour name
pulse_duration: 2                             # seconds per pulse cycle (default 2)
```

---

## Colour palette

14 colours are built in. The `input_select` state must match one of these names (case-insensitive):

| Name | | Name | | Name | |
|------|-|------|-|------|-|
| Red | 🔴 | Green | 🟢 | Purple | 🟣 |
| Amber | 🟠 | Teal | 🩵 | Pink | 🩷 |
| Orange | 🟠 | Cyan | 🔵 | Rose | 🌹 |
| Yellow | 🟡 | Blue | 🔵 | White | ⚪ |
| Lime | 🟡 | Indigo | 🟣 | | |

---

## How it works

The card renders as a hidden element (`display: none`) so it takes no space in the layout. On connection it injects two elements into `<body>`:

```
#alarm-glow-wrapper   ← position: fixed, full viewport
                         opacity transition (fade in/out)
  └── #alarm-glow-overlay  ← CSS keyframe pulse animation
                              box-shadow transition (colour blend)
```

- **Fade in/out** is handled by transitioning the wrapper's `opacity` (0 → 1 or 1 → 0 over 1 s). The pulse animation is only stopped after the fade-out completes, so there is no visual snap.
- **Colour blending** is handled by a `transition: box-shadow 0.8s ease` on the inner overlay. Changing the `input_select` crossfades the three-layer inset bloom from the old colour to the new one.
- The overlay is appended to `<body>` directly, escaping all Lovelace stacking contexts.
