# Area Map Layout Design
## Issue 2.1: Area Map Layout Structure

**Status:** Design Phase
**Created:** 2025-11-28
**Related Issue:** #26

---

## Overview

This document defines the visual organization and layout structure for Area Maps in Idle Artifice. Area Maps represent individual hexes from the World Map, displaying Features (buildings, interactive elements) positioned at fixed coordinates on a spatial canvas.

---

## Design Principles

1. **Consistency with World Map**: Use the same SVG-based coordinate system as World Map for maintainability
2. **Fixed Positioning**: Features have fixed positions that remain consistent across browser resizes
3. **Static View**: No pan/zoom functionality; use scrollbars for overflow content
4. **Card-Based Features**: Features render as interactive cards with clear visual states
5. **Area Type Flexibility**: Support different backgrounds/colors for different area types while maintaining consistent canvas dimensions

---

## Architecture Decisions

### 1. Layout System: Spatial SVG Canvas with Header Bar

**Decision:** Replace current grid-based panel layout with SVG canvas similar to World Map, plus add header bar for navigation

**Rationale:**
- Consistent coordinate system across components
- Precise positioning control for Features
- Scalable graphics for different screen sizes
- Clean interaction patterns (click, hover)
- Clear navigation hierarchy with header bar

**Changes from Current Implementation:**
```
BEFORE (AreaMap.vue):
- CSS Grid layout (2-column)
- Panel-based UI (info panel, resources panel)
- Responsive breakpoints
- Floating close button only

AFTER:
- Header bar with area title and close button
- SVG canvas with viewBox coordinate system
- Features positioned at (x, y) coordinates
- Scrollable container instead of responsive scaling
- Both header close button AND floating close button for redundancy
```

**Header Bar Specification:**
- **Height:** Fixed 60px
- **Background:** Dark gray (#2c3e50)
- **Content:**
  - Left: Area title (e.g., "Academy")
  - Right: Close button (✕) to return to World Map
- **Position:** Fixed at top of viewport
- **Z-index:** Above SVG canvas
- **Layout:** Flexbox with space-between

### 2. Coordinate System

**Decision:** Use same viewBox coordinate system as World Map

**Specifications:**
- **ViewBox Dimensions:** 300 × 300 units
- **Coordinate Origin:** Center of canvas at (0, 0)
- **Coordinate Range:** -150 to +150 in both X and Y axes
- **Position Format:** Features positioned using `{ x: number, y: number }` in viewBox units

**Example Feature Positions:**
```javascript
// Academy Features positioned in viewBox space
{
  foundry: { x: -100, y: -80 },
  workshop: { x: 20, y: -80 },
  alchemist: { x: -100, y: 40 },
  shop: { x: 20, y: 40 }
}
```

**Benefits:**
- Familiar system for developers working across both components
- Predictable positioning calculations
- Easy to maintain and debug

### 3. Canvas Interaction

**Decision:** Static view with scrollbars for overflow (no pan/zoom)

**Specifications:**
- SVG canvas rendered at fixed size within viewport
- Container uses `overflow: auto` for scrolling
- Features do NOT scale down on smaller screens
- Features maintain their absolute size in viewBox units

**Rationale:**
- Simpler implementation for initial version
- Features remain readable and interactive at consistent sizes
- Clear mental model for users (scroll to see more vs. pan/zoom)
- Future enhancement: can add pan/zoom later if needed

### 4. Responsive Behavior

**Decision:** Use scrollbars instead of scaling Features down

**Behavior by Screen Size:**

| Screen Size | Canvas Behavior | Feature Behavior |
|------------|----------------|------------------|
| Desktop (>1200px) | Full canvas visible | All Features visible |
| Tablet (768-1200px) | Vertical scroll if needed | Full-sized Features |
| Mobile (<768px) | Horizontal & vertical scroll | Full-sized Features |

**Implementation:**
```css
.area-map-container {
  width: 100vw;
  height: 100vh;
  overflow: auto;
}

.area-map-svg {
  min-width: 800px;
  min-height: 600px;
  /* Features maintain size, scrollbars appear as needed */
}
```

### 5. Area Type Support

**Decision:** Different area types share same canvas dimensions but have different backgrounds

**Initial Focus:** Academy area type only

**Area Type Properties:**
```typescript
interface AreaType {
  id: string              // 'academy', 'forest', 'mountain', etc.
  background: string      // Background color or gradient
  backgroundImage?: string // Optional background image/pattern
  canvasDimensions: {     // Always 300x300 for now
    width: number
    height: number
  }
  features: Feature[]     // Area-specific Features
}
```

**Academy Specifications:**
- **Background:** Light stone/beige color (#e8dcc4) with subtle texture
- **Theme:** Organized campus layout with distinct building zones
- **Features:** Foundry, Workshop, Alchemist, Shop (4 initial Features)

**Future Area Types** (not implemented yet):
- Forest: Green/natural background, resource gathering Features
- Mountain: Rocky/gray background, mining Features
- etc.

---

## Feature Card Design

### Visual Structure

Features render as interactive SVG cards with the following structure:

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │ ← Outer card border
│ │ [Icon] Feature Name         │ │ ← Title Bar (always visible when unlocked)
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │   Feature-Specific          │ │ ← Card Body
│ │   Interface/Controls        │ │   (hidden when locked with preview)
│ │                             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Card Dimensions

**Standard Feature Card:**
- **Width:** 120 viewBox units (~400px on desktop)
- **Height:** Variable based on content (min 80 units, ~270px)
- **Padding:** 4 units internal padding
- **Border Radius:** 2 units for rounded corners

**Title Bar:**
- **Height:** 16 viewBox units (~50px)
- **Icon Size:** 12 units (square)
- **Icon Position:** Left-aligned, 4 units from left edge
- **Text:** 4 units from icon, vertically centered

### Visual States

#### 1. Unlocked & Inactive (Default State)
- **Visibility:** Full card visible (title bar + body)
- **Title Bar:** Standard background (#4a90e2 blue)
- **Card Body:** White background (#ffffff)
- **Border:** 1 unit solid border (#333333)
- **Opacity:** 1.0
- **Interaction:** Clickable

#### 2. Unlocked & Active
- **Visibility:** Full card visible
- **Title Bar:** Highlighted background (#357abd darker blue)
- **Card Body:** White background with subtle highlight (#f8fcff)
- **Border:** 2 unit border (#357abd)
- **Opacity:** 1.0
- **Interaction:** Clickable (may close or toggle state)

#### 3. Locked with Preview
- **Visibility:** Title bar visible, body hidden/grayed
- **Title Bar:** Muted background (#999999 gray)
- **Card Body:** Locked overlay showing requirements
  - Gray background (#e0e0e0)
  - Lock icon centered
  - Text: "Requires: [prerequisite]"
- **Border:** 1 unit dashed border (#999999)
- **Opacity:** 0.7
- **Interaction:** Shows tooltip with unlock requirements

#### 4. Locked & Hidden
- **Visibility:** Completely hidden (not rendered)
- **Rationale:** Feature doesn't exist in player's awareness yet
- **Discovery:** Feature appears when prerequisites are met

#### 5. Hover State (when unlocked)
- **Effect:** Subtle highlight similar to World Map hexes
- **Opacity:** 0.85 (slight transparency)
- **Border:** Slight glow effect
- **Cursor:** Pointer
- **Transition:** 0.2s ease

### State Transition Examples

```
Hidden → Locked with Preview
  Trigger: Player discovers new area or reaches milestone
  Effect: Card fades in with locked appearance

Locked with Preview → Unlocked
  Trigger: Player meets prerequisites
  Effect: Lock overlay fades out, card becomes interactive

Unlocked → Active
  Trigger: Player clicks Feature card
  Effect: Border strengthens, then:
    - Simple Features: Expand inline within Area Map
    - Complex Features: Navigate to dedicated Feature screen

Active → Unlocked
  Trigger: Player clicks elsewhere or closes Feature
  Effect: Returns to default unlocked state
```

**Active State Behavior by Feature Type:**
- **Simple Features (e.g., Shop):** Display inline controls within the Area Map. Border highlights to show active state. No navigation occurs.
- **Complex Features (e.g., Foundry):** Navigate to dedicated Feature screen with full interface. Area Map remains in background/history.

---

## Academy Layout Specification

### Background

**Visual Theme:** Organized magical academy campus
**Background Color:** #e8dcc4 (light beige/stone)
**Optional Elements:**
- Subtle grid pattern or stone texture
- Pathways between Feature locations (future enhancement)

### Feature Positions

**Academy Features (Initial 4):**

| Feature | Position (x, y) | Description |
|---------|----------------|-------------|
| **Foundry** | (-100, -80) | Top-left quadrant - crafting puzzles |
| **Workshop** | (20, -80) | Top-right quadrant - equipment creation |
| **Alchemist** | (-100, 40) | Bottom-left quadrant - potion brewing |
| **Shop** | (20, 40) | Bottom-right quadrant - resource trading |

**Layout Rationale:**
- Symmetrical 2×2 grid pattern
- Clear spacing between Features (120 units horizontal, 120 units vertical)
- Centered within viewBox (-150 to +150 range)
- Room for future expansion (5th+ Features)

**Visual Representation:**
```
        -150                    0                    150
         │                      │                      │
   -150 ─┼──────────────────────┼──────────────────────┼─
         │                      │                      │
         │   ┌───────────┐      │      ┌───────────┐   │
         │   │  Foundry  │      │      │ Workshop  │   │
    -80 ─┼───│   (-100)  │──────┼──────│   (20)    │──-┼─
         │   └───────────┘      │      └───────────┘   │
         │                      │                      │
      0 ─┼──────────────────────┼──────────────────────┼─
         │                      │                      │
         │   ┌───────────┐      │      ┌───────────┐   │
         │   │ Alchemist │      │      │   Shop    │   │
     40 ─┼───│   (-100)  │──────┼──────│   (20)    │──-┼─
         │   └───────────┘      │      └───────────┘   │
         │                      │                      │
    150 ─┼──────────────────────┼──────────────────────┼─
         │                      │                      │
```

### Initial Feature States

**On First Visit to Academy:**
- **Foundry:** Unlocked (tutorial Feature)
- **Workshop:** Locked with Preview (requires Foundry completion)
- **Alchemist:** Locked with Preview (requires specific resources)
- **Shop:** Unlocked (basic functionality available)

---

## Implementation Notes

### Component Structure (Proposed)

```
components/
  AreaMap.vue              # Main Area Map container (SVG canvas)
  FeatureCard.vue          # Reusable Feature card component
  features/
    FoundryFeature.vue     # Foundry-specific interface
    WorkshopFeature.vue    # Workshop-specific interface
    AlchemistFeature.vue   # Alchemist-specific interface
    ShopFeature.vue        # Shop-specific interface
```

### Data Structure (Proposed)

```typescript
// Store: areaMapStore.ts
interface Feature {
  id: string
  type: string              // 'foundry', 'workshop', etc.
  name: string
  icon: string              // Icon identifier or SVG path
  position: { x: number, y: number }
  state: 'hidden' | 'locked' | 'unlocked'
  isActive: boolean
  prerequisites?: string[]  // IDs of required Features/conditions
  interactionType: 'inline' | 'navigation'  // Inline controls vs. navigate to screen
}

interface AreaMap {
  areaType: string          // 'academy', 'forest', etc.
  coordinates: { q: number, r: number }
  background: string
  backgroundImage?: string
  features: Feature[]
}
```

### Navigation Flow

```
World Map (click hex)
    ↓
Area Map (spatial canvas with Features)
    ↓
    ├→ Simple Feature: Inline controls (e.g., Shop slider)
    └→ Complex Feature: Navigate to Feature screen (e.g., Foundry grid)
```

---

## Future Enhancements (Out of Scope for 2.1)

1. **Pan/Zoom Controls:** Optional zoom for desktop users
2. **Feature Animations:** Entrance/exit transitions, idle animations
3. **Pathways:** Visual connections between Features
4. **Dynamic Backgrounds:** Parallax effects, animated elements
5. **Feature Tooltips:** Rich hover information
6. **Mini-map:** Navigation helper for large area maps
7. **Multiple Area Types:** Forest, Mountain, etc. with unique layouts

---

## Final Design Decisions

All key design questions have been resolved:

1. **Feature Card Size:** 120×80+ viewBox units approved. Can adjust during implementation if needed.

2. **Feature Spacing:** 120-unit spacing between Features approved. Can adjust during implementation if needed.

3. **Locked State UX:** "Locked with Preview" cards show full Title Bar, but nothing else. Body is completely hidden/grayed with lock icon and requirements list only.

4. **Active State Behavior:** Both inline expansion and navigation are supported, based on Feature complexity:
   - Simple Features (e.g., Shop): Inline controls within Area Map
   - Complex Features (e.g., Foundry): Navigate to dedicated Feature screen

5. **Close Button Placement:** Both header bar AND floating close button for redundancy and flexibility.

---

## Next Steps

1. **Review & Feedback:** Stakeholder review of this design document
2. **Mockup Creation:** Create visual mockups of Feature cards in different states
3. **Prototype:** Build minimal prototype with one Feature card to validate approach
4. **Implementation:** Full implementation based on approved design
5. **Testing:** Component tests for Feature states and interactions
