# Area Map Feature Card Mockups
## Visual Mockups for Issue 2.1

**Related Document:** AREA_MAP_DESIGN.md
**Created:** 2025-11-28

---

## Feature Card Visual States

This document provides visual mockups of Feature cards in their various states.

---

### 1. Unlocked & Inactive (Default State)

**Description:** Standard state for accessible Features that are not currently active.

```
┌───────────────────────────────────────────┐
│ ╔══════════════════════════════════════╗  │ ← Solid border (1 unit, #333333)
│ ║ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ║  │
│ ║ ┃  🔨 Foundry                     ┃  ║  │ ← Title Bar (blue #4a90e2)
│ ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ║  │   Icon left-aligned, text beside
│ ║ ┌──────────────────────────────────┐ ║  │
│ ║ │                                  │ ║  │
│ ║ │  [Feature-Specific Content]      │ ║  │ ← Card Body (white #ffffff)
│ ║ │                                  │ ║  │
│ ║ │  • Resource cost: 10 wood        │ ║  │
│ ║ │  • Action: Craft items           │ ║  │
│ ║ │                                  │ ║  │
│ ║ │  [Craft Button]                  │ ║  │
│ ║ │                                  │ ║  │
│ ║ └──────────────────────────────────┘ ║  │
│ ╚══════════════════════════════════════╝  │
└───────────────────────────────────────────┘

Specs:
- Opacity: 1.0
- Title Bar Background: #4a90e2
- Body Background: #ffffff
- Border: 1 unit solid #333333
- Cursor: pointer
- Clickable: Yes
```

---

### 2. Unlocked & Active

**Description:** Currently selected/active Feature with highlighted appearance.

```
┌───────────────────────────────────────────┐
│ ╔══════════════════════════════════════╗  │ ← Thicker border (2 units, #357abd)
│ ║ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ║  │
│ ║ ┃  🔨  Foundry                      ┃ ║  │ ← Title Bar (darker blue #357abd)
│ ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ║  │
│ ║ ┌──────────────────────────────────┐ ║  │
│ ║ │                                  │ ║  │
│ ║ │  [Feature-Specific Content]      │ ║  │ ← Card Body (light blue #f8fcff)
│ ║ │                                  │ ║  │   Subtle highlight
│ ║ │  • Resource cost: 10 wood        │ ║  │
│ ║ │  • Action: Craft items           │ ║  │
│ ║ │                                  │ ║  │
│ ║ │  [Craft Button] ← ACTIVE         │ ║  │
│ ║ │                                  │ ║  │
│ ║ └──────────────────────────────────┘ ║  │
│ ╚══════════════════════════════════════╝  │
└───────────────────────────────────────────┘

Specs:
- Opacity: 1.0
- Title Bar Background: #357abd (darker)
- Body Background: #f8fcff (subtle highlight)
- Border: 2 units solid #357abd
- Box Shadow: 0 4px 8px rgba(0,0,0,0.15)
- Cursor: pointer
- Clickable: Yes (may close or toggle)
```

---

### 3. Locked with Preview

**Description:** Feature is visible but not yet accessible. Shows requirements.

```
┌───────────────────────────────────────────┐
│ ╔══════════════════════════════════════╗  │ ← Dashed border (1 unit, #999999)
│ ║ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ║  │
│ ║ ┃  🔧  Workshop                   ┃  ║  │ ← Title Bar (muted gray #999999)
│ ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ║  │   Icon and text slightly faded
│ ║ ┌──────────────────────────────────┐ ║  │
│ ║ │                                  │ ║  │
│ ║ │          🔒                      │ ║  │ ← Lock icon centered
│ ║ │                                  │ ║  │
│ ║ │      Requires:                   │ ║  │
│ ║ │   • Complete Foundry tutorial    │ ║  │ ← Requirements list
│ ║ │   • Gather 20 wood               │ ║  │
│ ║ │                                  │ ║  │
│ ║ └──────────────────────────────────┘ ║  │
│ ╚══════════════════════════════════════╝  │ ← Body: gray #e0e0e0
└───────────────────────────────────────────┘

Specs:
- Opacity: 0.7
- Title Bar Background: #999999 (gray)
- Body Background: #e0e0e0 (light gray)
- Border: 1 unit dashed #999999
- Cursor: help
- Clickable: Yes (shows tooltip with details)
- Content: Locked overlay with requirements
```

---

### 4. Locked & Hidden

**Description:** Feature is completely hidden from view.

```
[Feature does not render at all]

Specs:
- Not rendered in DOM
- Player is unaware of Feature's existence
- Appears when discovery conditions are met
```

---

### 5. Hover State (Unlocked Features Only)

**Description:** Subtle highlight when hovering over unlocked Features.

```
┌───────────────────────────────────────────┐
│ ╔══════════════════════════════════════╗  │ ← Border begins to glow
│ ║ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ║  │   (subtle box-shadow)
│ ║ ┃  🔨  Foundry                    ┃  ║  │
│ ║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ║  │
│ ║ ┌──────────────────────────────────┐ ║  │
│ ║ │                                  │ ║  │ ← Entire card slightly transparent
│ ║ │  [Feature-Specific Content]      │ ║  │   Similar to hex hover effect
│ ║ │                                  │ ║  │
│ ║ │  • Resource cost: 10 wood        │ ║  │
│ ║ │  • Action: Craft items           │ ║  │
│ ║ │                                  │ ║  │
│ ║ │  [Craft Button]                  │ ║  │
│ ║ │                                  │ ║  │
│ ║ └──────────────────────────────────┘ ║  │
│ ╚══════════════════════════════════════╝  │
└───────────────────────────────────────────┘

Specs:
- Opacity: 0.85 (slight transparency)
- Box Shadow: 0 2px 6px rgba(74, 144, 226, 0.3)
- Transition: opacity 0.2s ease, box-shadow 0.2s ease
- Cursor: pointer
- Same colors as default unlocked state
```

---

## Feature Card Size Comparison

**Relative to ViewBox (300×300 units total):**

```
ViewBox: 300 units wide × 300 units tall

┌─────────────────────────────────────────────────────────────┐
│                      ViewBox (-150 to 150)                  │
│  -150                        0                       150    │
│    │                         │                         │    │
│    ▼                         ▼                         ▼    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │    ┌──────────────┐            ┌──────────────┐         │ │
│ │    │   Feature    │            │   Feature    │         │ │
│ │    │   120 units  │            │   120 units  │         │ │
│ │    │   wide       │            │   wide       │         │ │
│ │    │              │            │              │         │ │
│ │    │   80+ units  │            │   80+ units  │         │ │
│ │    │   tall       │            │   tall       │         │ │
│ │    │              │            │              │         │ │
│ │    └──────────────┘            └──────────────┘         │ │
│ │                                                         │ │
│ │                         (0, 0)                          │ │
│ │                           •                             │ │
│ │                                                         │ │
│ │    ┌──────────────┐            ┌──────────────┐         │ │
│ │    │   Feature    │            │   Feature    │         │ │
│ │    │              │            │              │         │ │
│ │    │              │            │              │         │ │
│ │    └──────────────┘            └──────────────┘         │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

4 Features in 2×2 grid comfortably fit within 300×300 viewBox
Spacing: ~120 units between Feature centers
Each Feature: 120 units wide × 80+ units tall
Margins: ~20-30 units from edges
```

---

## Academy Area Map Layout Mockup

**Full Academy view with header bar and 4 Features positioned:**

```
┌───────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════════╗ │ ← Header Bar
│ ║  Academy                                              ✕  ║ │   (60px, #2c3e50)
│ ╚═══════════════════════════════════════════════════════════╝ │   Left: Title
│                                                               │   Right: Close btn
│ ╔═══════════════════════════════════════════════════════════╗ │
│ ║            SVG Canvas Area (ViewBox: 300×300)             ║ │
│ ║          Background: #e8dcc4 (light beige stone)          ║ │ ← SVG Canvas
│ ╚═══════════════════════════════════════════════════════════╝ │   (scrollable)
│                                                               │
│         -150                    0                    150      │
│           │                     │                     │       │
│    -150 ──┼─────────────────────┼─────────────────────┼──     │
│           │                     │                     │       │
│           │  ┌──────────────┐   │   ┌──────────────┐  │      │
│           │  │ 🔨 Foundry   │   │   │ 🔧 Workshop   │  │      │
│    -80 ───┼──│              │───┼───│              │─-┼──     │
│           │  │  [Unlocked]  │   │   │  [Locked w/  │  │      │
│           │  │              │   │   │   Preview]   │  │      │
│           │  │              │   │   │              │  │      │
│           │  └──────────────┘   │   └──────────────┘  │      │
│           │                     │                     │       │
│       0 ──┼─────────────────────┼─────────────────────┼──     │
│           │                     │                     │       │
│           │  ┌──────────────┐   │   ┌──────────────┐  │      │
│           │  │ ⚗️ Alchemist │   │   │ 🏪 Shop       │  │      │
│     40 ───┼──│              │───┼───│              │─-┼──     │
│           │  │  [Locked w/  │   │   │  [Unlocked]  │  │      │
│           │  │   Preview]   │   │   │              │  │      │
│           │  │              │   │   │              │  │      │
│           │  └──────────────┘   │   └──────────────┘  │      │
│           │                     │                     │       │
│    150 ───┼─────────────────────┼─────────────────────┼──     │
│           │                     │                     │       │
│                                                               │
│                                                       ✕       │ ← Optional floating
└───────────────────────────────────────────────────────────────┘   close button


Layout Elements:
  Header Bar:
    - Height: 60px fixed
    - Background: #2c3e50 (dark gray)
    - Title: "Academy" (left-aligned, white text)
    - Close button: ✕ (right-aligned, white)

  SVG Canvas:
    - ViewBox: 300×300 units
    - Background: #e8dcc4
    - Position: Below header bar
    - Overflow: scrollable

Feature Coordinates:
  Foundry:    (-100, -80)  Top-left     [Unlocked]
  Workshop:   (  20, -80)  Top-right    [Locked with Preview]
  Alchemist:  (-100,  40)  Bottom-left  [Locked with Preview]
  Shop:       (  20,  40)  Bottom-right [Unlocked]

Spacing:
  Horizontal gap between columns: 120 units
  Vertical gap between rows: 120 units
  Margins from edges: ~20-30 units

Navigation:
  - Header close button (✕) returns to World Map
```

---

## Feature Card Content Examples

### Foundry Card (Unlocked, Inactive)

```
┌───────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃  🔨  Foundry                      ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│ ┌───────────────────────────────────┐ │
│ │ Craft magical items by solving    │ │
│ │ grid-based puzzles.               │ │
│ │                                   │ │
│ │ Available resources:              │ │
│ │   Wood: 25  Stone: 12             │ │
│ │                                   │ │
│ │ ┌───────────────────────────────┐ │ │
│ │ │     [Open Foundry Puzzle]     │ │ │
│ │ └───────────────────────────────┘ │ │
│ │                                   │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘

Interaction: Clicking "Open Foundry Puzzle" button
navigates to dedicated Foundry screen (complex Feature)
```

---

### Shop Card (Unlocked, Inactive)

```
┌──────────────────────────────────-────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃  🏪  Shop                         ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│ ┌───────────────────────────────────┐ │
│ │ Trade resources and set profit    │ │
│ │ margins.                          │ │
│ │                                   │ │
│ │ Profit Margin:                    │ │
│ │ ┌─────────────────────────────┐   │ │
│ │ │ ●═══════════════○───────────│   │ │ ← Slider (inline)
│ │ └─────────────────────────────┘   │ │
│ │ Current: 65%                      │ │
│ │                                   │ │
│ │ Revenue today: 120 gold           │ │
│ │                                   │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘

Interaction: Inline controls within Area Map
(simple Feature - no navigation)
```

---

### Workshop Card (Locked with Preview)

```
┌───────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃  🔧  Workshop                     ┃ │ (Muted gray title)
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│ ╔═══════════════════════════════════╗ │
│ ║                                   ║ │
│ ║              🔒                   ║ │
│ ║                                   ║ │
│ ║         Requires:                 ║ │
│ ║   • Complete Foundry tutorial     ║ │
│ ║   • Gather 20 wood                ║ │
│ ║   • Gather 15 stone               ║ │
│ ║                                   ║ │
│ ║                                   ║ │
│ ╚═══════════════════════════════════╝ │ (Gray locked overlay)
└───────────────────────────────────────┘

Interaction: Hover shows tooltip with more details
Click shows unlock requirements in modal/toast
```

---

## Color Palette Reference

### Feature Cards

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| **Unlocked Title Bar** | Medium Blue | #4a90e2 | Default state title bar |
| **Active Title Bar** | Dark Blue | #357abd | Active state title bar |
| **Unlocked Body** | White | #ffffff | Default state card body |
| **Active Body** | Light Blue Tint | #f8fcff | Active state subtle highlight |
| **Locked Title Bar** | Medium Gray | #999999 | Locked state title bar |
| **Locked Body** | Light Gray | #e0e0e0 | Locked state card body |
| **Border (Normal)** | Dark Gray | #333333 | Default border |
| **Border (Active)** | Dark Blue | #357abd | Active state border |
| **Border (Locked)** | Medium Gray | #999999 | Locked state dashed border |
| **Text (Primary)** | Dark Gray | #333333 | Main text color |
| **Text (Muted)** | Gray | #666666 | Secondary text color |

### Area Backgrounds

| Area Type | Background Color | Hex Code |
|-----------|-----------------|----------|
| **Academy** | Light Beige/Stone | #e8dcc4 |
| **Forest** | (Future) | TBD |
| **Mountain** | (Future) | TBD |

---

## SVG Implementation Notes

### Feature Card as SVG Element

```xml
<!-- Example: Foundry Feature Card (Unlocked, Inactive) -->
<g class="feature-card" data-feature-id="foundry" transform="translate(-100, -80)">
  <!-- Card Background -->
  <rect
    x="0" y="0"
    width="120" height="100"
    fill="#ffffff"
    stroke="#333333"
    stroke-width="1"
    rx="2" ry="2"
  />

  <!-- Title Bar -->
  <rect
    x="0" y="0"
    width="120" height="16"
    fill="#4a90e2"
    rx="2" ry="2"
  />

  <!-- Icon (simplified as circle here) -->
  <circle cx="8" cy="8" r="6" fill="#ffffff" />
  <!-- In real implementation: use SVG icon or image -->

  <!-- Title Text -->
  <text
    x="18" y="11"
    font-size="5"
    fill="#ffffff"
    font-weight="600"
  >
    Foundry
  </text>

  <!-- Card Body Content (foreignObject for HTML content) -->
  <foreignObject x="4" y="20" width="112" height="76">
    <div xmlns="http://www.w3.org/1999/xhtml">
      <!-- Feature-specific content here -->
    </div>
  </foreignObject>
</g>
```

**Key Points:**
- Use `<g>` group with `transform="translate(x, y)"` for positioning
- `<rect>` for card background and title bar
- `<foreignObject>` to embed HTML content for complex interfaces
- Event handlers on `<g>` element for click/hover interactions

---

## Responsive Considerations

### Desktop (>1200px)
```
┌───────────────────────────────────────┐
│                                       │
│  All 4 Features visible               │
│  No scrolling needed                  │
│                                       │
│   [Feature] [Feature]                 │
│                                       │
│   [Feature] [Feature]                 │
│                                       │
└───────────────────────────────────────┘
```

### Tablet (768-1200px)
```
┌─────────────────────────┐
│  ↓                      │ ← Vertical scrollbar appears
│  [Feature] [Feature]    │
│                         │
│  [Feature] [Feature]    │
│  ↓                      │
└─────────────────────────┘
```

### Mobile (<768px)
```
┌───────────┐
│  ↓      → │ ← Both scrollbars appear
│  [Feat    │
│           │
│  [Feat    │
│  ↓      → │
└───────────┘
```

**Implementation:**
- Features maintain absolute size (120×80+ viewBox units)
- Container uses `overflow: auto`
- SVG `min-width` and `min-height` ensure Features don't shrink
- Scrollbars appear automatically when viewport is smaller than content

---

## Accessibility Considerations

### Keyboard Navigation
- Tab order: Close button → Features (left-to-right, top-to-bottom)
- Enter/Space: Activate Feature (same as click)
- Escape: Deactivate Feature / Return to World Map

### Screen Readers
```html
<!-- Example ARIA labels -->
<g
  role="button"
  aria-label="Foundry - Craft magical items (unlocked)"
  tabindex="0"
>
  <!-- Feature card content -->
</g>

<g
  role="button"
  aria-label="Workshop - Requires Foundry tutorial (locked)"
  aria-disabled="true"
  tabindex="0"
>
  <!-- Locked feature card content -->
</g>
```

### Focus Indicators
- Unlocked Features: Blue outline on focus (2px, #357abd)
- Locked Features: Gray outline on focus (2px, #999999)
- Clear visual distinction from hover state

---

## Animation & Transitions (Future Enhancement)

### State Transitions (Not in 2.1 Scope)

```
Locked → Unlocked:
  - Lock overlay fades out (300ms ease-out)
  - Card body background transitions from gray to white (300ms)
  - Border changes from dashed gray to solid dark gray (200ms)

Inactive → Active:
  - Border thickens (100ms ease-out)
  - Box shadow appears (150ms ease-out)
  - Background color shifts (200ms ease-out)

Feature Discovery (Hidden → Locked):
  - Card fades in (400ms ease-out)
  - Slight scale animation (scale 0.9 → 1.0 over 300ms)
```

---

## Next Steps

1. **Stakeholder Review:** Review mockups and provide feedback
2. **Answer Open Questions:** Clarify any ambiguous design decisions
3. **Refine Mockups:** Adjust based on feedback
4. **Begin Implementation:** Create FeatureCard component based on approved mockups
5. **Prototype Testing:** Build interactive prototype for user testing
