# Area Map Implementation Checklist
## Roadmap from Design to Implementation

**Related Documents:**
- AREA_MAP_DESIGN.md - Architecture and layout decisions
- AREA_MAP_MOCKUPS.md - Visual mockups and examples

**Status:** Ready for implementation (pending design approval)
**Created:** 2025-11-28

---

## Phase 1: Core Infrastructure

### 1.1 Data Structures & Types

- [ ] Create `types/feature.ts` with Feature interfaces
  ```typescript
  interface Feature {
    id: string
    type: string
    name: string
    icon: string
    position: { x: number, y: number }
    state: 'hidden' | 'locked' | 'unlocked'
    isActive: boolean
    prerequisites?: string[]
    interactionType: 'inline' | 'navigation'
  }
  ```

- [ ] Create `types/areaMap.ts` with AreaMap interfaces
  ```typescript
  interface AreaMap {
    areaType: string
    coordinates: { q: number, r: number }
    background: string
    backgroundImage?: string
    features: Feature[]
  }
  ```

- [ ] Update existing hex types if needed for integration

### 1.2 Store Setup

- [ ] Create `stores/areaMapStore.ts`
  - State: Current area maps (keyed by coordinates)
  - Getters: Get area by coordinates, get Features by area
  - Actions: Load area, toggle Feature state, unlock Feature

- [ ] Create `stores/featureStore.ts` (optional, depending on complexity)
  - State: Global Feature states and data
  - Actions: Update Feature progress, unlock conditions

- [ ] Add area map data to existing stores as needed

### 1.3 Composables

- [ ] Create `composables/useAreaMap.ts`
  - Helper functions for area map operations
  - Feature position calculations if needed
  - Area type utilities

- [ ] Update `composables/useHexGrid.ts` if coordinate utilities needed

---

## Phase 2: Component Structure

### 2.1 AreaMap Component Refactor

- [ ] Refactor `components/AreaMap.vue` from grid layout to SVG canvas with header bar
  - Remove current grid-based structure
  - Add header bar component/section
  - Add SVG element with viewBox="..."
  - Implement scrollable container
  - Add both header close button AND optional floating close button

- [ ] Implement header bar
  - Fixed height: 60px
  - Background: #2c3e50 (dark gray)
  - Left: Area title (e.g., "Academy") - white text
  - Right: Close button (✕) - white, returns to World Map
  - Flexbox layout with space-between
  - Z-index above SVG canvas

- [ ] Implement background rendering
  - Academy background color (#e8dcc4)
  - Optional: Background pattern/texture

- [ ] Add Feature rendering loop
  - Iterate over area's Features
  - Position Features using transform="translate(x, y)"
  - Filter out hidden Features

### 2.2 FeatureCard Component

- [ ] Create `components/FeatureCard.vue`
  - Props: feature (Feature object), isActive (boolean)
  - Emits: click, activate, deactivate
  - Render SVG card structure (rect, title bar, etc.)
  - Support all visual states (unlocked, active, locked, hover)

- [ ] Implement title bar
  - Icon rendering (SVG or image)
  - Feature name text
  - Proper styling per state

- [ ] Implement card body
  - Use `<foreignObject>` for HTML content
  - Slot for Feature-specific content
  - Locked overlay for locked state

- [ ] Implement state transitions
  - CSS transitions for hover effects
  - Opacity changes
  - Border/shadow changes

### 2.3 Feature-Specific Components

- [ ] Create `components/features/FoundryFeature.vue`
  - Content for Foundry card body
  - Button to navigate to Foundry screen (if complex)

- [ ] Create `components/features/ShopFeature.vue`
  - Inline controls (e.g., profit margin slider)
  - No navigation (simple Feature)

- [ ] Create `components/features/WorkshopFeature.vue`
  - Placeholder/coming soon content
  - Initial state: locked with preview

- [ ] Create `components/features/AlchemistFeature.vue`
  - Placeholder/coming soon content
  - Initial state: locked with preview

---

## Phase 3: Interaction & Navigation

### 3.1 Feature Interactions

- [ ] Implement click handling on FeatureCard
  - Distinguish between clicks and potential drags (if pan added later)
  - Activate Feature on click
  - Deactivate when clicking elsewhere

- [ ] Implement hover states
  - Mouse enter/leave handlers
  - Opacity and shadow transitions
  - Cursor changes

- [ ] Implement keyboard navigation
  - Tab order: close button → Features (left-to-right, top-to-bottom)
  - Enter/Space to activate Feature
  - Escape to deactivate/go back

### 3.2 Navigation Flow

- [ ] Update `stores/navigation.ts` to support Feature navigation
  - Add `currentFeature` state
  - Add `navigateToFeature` action
  - Add `navigateToAreaMap` action (return from Feature)

- [ ] Implement navigation for complex Features (e.g., Foundry)
  - Click Foundry → Navigate to FoundryScreen
  - Back button → Return to AreaMap

- [ ] Implement inline interaction for simple Features (e.g., Shop)
  - Controls render directly in FeatureCard body
  - No navigation, just state updates

### 3.3 State Management

- [ ] Implement Feature unlock logic
  - Check prerequisites when area loads
  - Update Feature state (hidden → locked → unlocked)
  - Persist unlock state in store

- [ ] Implement active/inactive toggling
  - Only one Feature active at a time
  - Click elsewhere to deactivate
  - Visual feedback for active state

---

## Phase 4: Academy-Specific Implementation

### 4.1 Academy Area Data

- [ ] Create Academy area definition in store
  - Area type: 'academy'
  - Background: #e8dcc4
  - 4 Features with positions:
    - Foundry: (-100, -80)
    - Workshop: (20, -80)
    - Alchemist: (-100, 40)
    - Shop: (20, 40)

- [ ] Set initial Feature states
  - Foundry: unlocked
  - Workshop: locked with preview
  - Alchemist: locked with preview
  - Shop: unlocked

### 4.2 Academy Features Content

- [ ] Implement Foundry content
  - Description text
  - Resource display
  - "Open Foundry Puzzle" button
  - Click → Navigate to Foundry screen (future)

- [ ] Implement Shop content
  - Description text
  - Profit margin slider (inline)
  - Revenue display
  - Interactive without navigation

- [ ] Implement locked previews for Workshop and Alchemist
  - Lock icon
  - Requirements list
  - Tooltip on hover (optional)

---

## Phase 5: Styling & Polish

### 5.1 Visual Consistency

- [ ] Apply color palette from mockups
  - Title bar colors (blue, gray)
  - Card body backgrounds
  - Borders and shadows

- [ ] Implement hover effects
  - Smooth transitions (0.2s ease)
  - Subtle opacity changes
  - Box shadows

- [ ] Implement active state styling
  - Thicker border
  - Darker title bar
  - Highlighted body background

### 5.2 Responsive Behavior

- [ ] Set up scrollable container
  - `overflow: auto` on container
  - SVG with min-width/min-height
  - Features maintain size

- [ ] Test on different screen sizes
  - Desktop: all visible
  - Tablet: vertical scroll
  - Mobile: both scrollbars

- [ ] Ensure scrollbars work smoothly
  - No layout shifts
  - Features remain clickable when partially scrolled

### 5.3 Accessibility

- [ ] Add ARIA labels to Features
  - Descriptive labels (name + state)
  - `role="button"` for interactive Features
  - `aria-disabled="true"` for locked Features

- [ ] Add keyboard navigation support
  - `tabindex` on Features
  - Focus indicators (outline on focus)
  - Escape key to go back

- [ ] Add screen reader support
  - Announce Feature state changes
  - Announce unlock events
  - Clear navigation hierarchy

---

## Phase 6: Testing

### 6.1 Component Tests

- [ ] Test FeatureCard.vue
  - Renders correctly in all states (unlocked, active, locked, hidden)
  - Emits events correctly (click, activate, deactivate)
  - Responds to hover interactions
  - Keyboard navigation works

- [ ] Test AreaMap.vue
  - Renders Features at correct positions
  - Filters hidden Features
  - Handles Feature clicks correctly
  - Back button works

- [ ] Test Feature-specific components
  - Foundry content renders
  - Shop slider works
  - Locked previews display requirements

### 6.2 Integration Tests

- [ ] Test World Map → Area Map navigation
  - Click hex → Area Map loads
  - Correct area data loaded
  - Back button returns to World Map

- [ ] Test Area Map → Feature navigation (complex Features)
  - Click Foundry → Navigate to Foundry screen
  - Back from Feature → Return to Area Map

- [ ] Test Feature state transitions
  - Unlock Feature → State updates, UI changes
  - Activate Feature → Visual feedback
  - Deactivate Feature → Returns to default

### 6.3 User Testing

- [ ] Test on desktop browsers
  - Chrome, Firefox, Safari, Edge

- [ ] Test on tablet/mobile
  - Scrolling works smoothly
  - Features clickable on touch
  - Responsive behavior correct

- [ ] Test accessibility
  - Keyboard navigation complete
  - Screen reader announces correctly
  - Focus indicators visible

---

## Phase 7: Documentation & Cleanup

### 7.1 Code Documentation

- [ ] Add JSDoc comments to components
  - FeatureCard props, emits, slots
  - AreaMap props, emits
  - Feature-specific components

- [ ] Add comments to stores
  - State descriptions
  - Action explanations
  - Complex logic annotations

- [ ] Update CLAUDE.md if needed
  - New component structure
  - New stores and composables
  - Coding standards for Features

### 7.2 Update GAMEDESIGN.md

- [ ] Document implemented Features
  - Foundry, Workshop, Alchemist, Shop descriptions
  - Interaction types
  - Unlock conditions

- [ ] Update Area Maps section
  - Academy layout specifics
  - Feature positioning

### 7.3 Remove Deprecated Code

- [ ] Remove old AreaMap.vue grid layout code
  - Remove CSS grid styles
  - Remove old panel components
  - Clean up unused imports

- [ ] Remove mock data (if any)
  - Replace with real store data
  - Remove hardcoded Feature positions if migrated to store

---

## Phase 8: Future Enhancements (Out of Scope for Initial Implementation)

### 8.1 Advanced Interactions

- [ ] Pan/zoom controls for Area Map
- [ ] Feature drag-and-drop (customization)
- [ ] Feature animations (entrance, idle, interactions)
- [ ] Rich tooltips on hover
- [ ] Mini-map for navigation

### 8.2 Visual Enhancements

- [ ] Background images/textures for areas
- [ ] Pathways between Features (visual connections)
- [ ] Parallax background effects
- [ ] Dynamic lighting/shadows

### 8.3 Additional Area Types

- [ ] Forest area implementation
- [ ] Mountain area implementation
- [ ] Unique layouts and Features per area type

---

## Design Decisions (Resolved)

All key design questions have been answered and documented:

### Approved Design Decisions

1. **Feature Card Size:** 120×80+ viewBox units approved. Can adjust during implementation if needed.

2. **Feature Spacing:** 120-unit spacing between Features approved. Can adjust during implementation if needed.

3. **Locked State UX:** "Locked with Preview" cards show full Title Bar, but nothing else. Body is completely hidden/grayed with lock icon and requirements list only.

4. **Active State Behavior:** Both inline expansion and navigation are supported, based on Feature complexity:
   - Simple Features (e.g., Shop): Inline controls within Area Map
   - Complex Features (e.g., Foundry): Navigate to dedicated Feature screen

5. **Close Button Placement:** Both header bar AND optional floating close button for redundancy and flexibility.

### Technical Decisions (To Be Determined During Implementation)

6. **Icon Implementation:** TBD during implementation (recommend SVG icons for consistency with hex tiles)

7. **Store Organization:** TBD during implementation (recommend single `areaMapStore` initially)

8. **Component Hierarchy:** Both approaches supported based on Feature complexity (matches decision #4)

9. **Data Initialization:** TBD during implementation (recommend hardcoded in store initially)

10. **Testing Strategy:** Component unit tests first, then integration tests, E2E with Cypress in future milestone

---

## Success Criteria

Implementation is complete when:

✅ **Functional Requirements**
- [ ] Area Map has header bar with title and close button
- [ ] Area Map renders Features on SVG canvas at fixed positions
- [ ] Features display in correct visual states (unlocked, locked, active)
- [ ] Features respond to clicks and hover interactions
- [ ] Navigation between World Map ↔ Area Map ↔ Features works
- [ ] Academy area has 4 Features positioned correctly
- [ ] Both inline (simple) and navigation (complex) Feature interactions work

✅ **Visual Requirements**
- [ ] Matches mockups in AREA_MAP_MOCKUPS.md
- [ ] Color palette applied correctly
- [ ] Hover and active states work as designed
- [ ] Locked state shows requirements clearly

✅ **Technical Requirements**
- [ ] Uses same coordinate system as World Map (viewBox 300×300)
- [ ] SVG-based rendering, not CSS grid
- [ ] Scrollable on smaller screens, no scaling down
- [ ] Clean component architecture (FeatureCard reusable)

✅ **Quality Requirements**
- [ ] Component tests pass (>80% coverage)
- [ ] No console errors or warnings
- [ ] Accessible via keyboard
- [ ] Screen reader friendly

✅ **Documentation Requirements**
- [ ] Code comments for complex logic
- [ ] CLAUDE.md updated with new structure
- [ ] README updated if needed

---

## Estimated Effort

**Rough time estimates for implementation phases:**

| Phase | Estimated Effort | Notes |
|-------|-----------------|-------|
| Phase 1: Infrastructure | 2-3 hours | Types, stores, composables |
| Phase 2: Components | 4-6 hours | AreaMap refactor, FeatureCard, Feature components |
| Phase 3: Interactions | 2-3 hours | Click handlers, navigation, state management |
| Phase 4: Academy Implementation | 1-2 hours | Academy data, initial Feature content |
| Phase 5: Styling & Polish | 2-3 hours | Colors, transitions, responsive |
| Phase 6: Testing | 3-4 hours | Component tests, integration tests |
| Phase 7: Documentation | 1-2 hours | Comments, docs updates, cleanup |
| **Total** | **15-23 hours** | ~2-3 days of focused work |

*Note: Estimates assume solo developer familiar with Vue 3 Composition API and the existing codebase.*

---

## Next Steps

1. **Review design documents** with stakeholders
2. **Answer open questions** and make final design decisions
3. **Get approval** to proceed with implementation
4. **Create implementation issue/PR** (e.g., "2.2 Implement Area Map Layout")
5. **Begin Phase 1** following this checklist
6. **Iterate** through phases, testing at each step
7. **Review and merge** when success criteria met
