# Milestone 3 Manual Testing Procedures

## Overview
This document outlines the manual testing procedures for Milestone 3: Global Status Column and Questing. All automated tests pass (281 tests), but manual testing is required to verify UI/UX, responsive behavior, edge cases, and integration points.

## Test Environment Setup
1. Start the development server: `npm run dev`
2. Open the application in multiple browsers (Chrome, Firefox, Safari if possible)
3. Test on multiple screen sizes:
   - Desktop: 1920x1080
   - Tablet: 768x1024
   - Mobile: 375x667 (iPhone SE)
4. Open browser DevTools console to watch for errors

---

## 1. Status Column - Core Functionality

### 1.1 Basic Rendering
- [ ] **Test**: Load the application
- [ ] **Expected**: Status Column visible on left side of screen
- [ ] **Expected**: Column displays all four sections:
  - Current Objective
  - Resources
  - Quick Navigation
  - System Links

### 1.2 Collapse/Expand Behavior (Desktop)
- [ ] **Test**: Click collapse button (« arrow) in Status Column
- [ ] **Expected**: Column smoothly collapses to thin bar
- [ ] **Expected**: Expand button (») visible on collapsed column
- [ ] **Test**: Click expand button
- [ ] **Expected**: Column smoothly expands back to full width
- [ ] **Expected**: All content visible again

### 1.3 Mobile Behavior
- [ ] **Test**: Resize browser to mobile width (< 768px)
- [ ] **Expected**: Status Column auto-collapses to thin bar
- [ ] **Expected**: Mobile class applied (verify in DevTools)
- [ ] **Test**: Click expand button on mobile
- [ ] **Expected**: Column expands as overlay over main content
- [ ] **Expected**: Semi-transparent overlay visible behind column
- [ ] **Test**: Click overlay (outside column)
- [ ] **Expected**: Column collapses back to thin bar
- [ ] **Test**: Click collapse button while expanded
- [ ] **Expected**: Column collapses back to thin bar

### 1.4 Responsive Breakpoints
- [ ] **Test**: Gradually resize browser from 1920px to 320px
- [ ] **Expected**: Column width adjusts smoothly
- [ ] **Expected**: At 768px, column switches to mobile mode
- [ ] **Expected**: At 1024px and above, column in desktop mode
- [ ] **Expected**: No layout breaks at any width

---

## 2. Current Objective Display

### 2.1 Initial State
- [ ] **Test**: Fresh load of application
- [ ] **Expected**: "Visit the Academy" objective is tracked by default
- [ ] **Expected**: Objective card shows title and description
- [ ] **Expected**: Card is clickable (cursor changes to pointer on hover)

### 2.2 Navigation to Objectives View
- [ ] **Test**: Click current objective card
- [ ] **Expected**: Navigate to Objectives View (full screen)
- [ ] **Expected**: Objectives View displays header with "Objectives" title
- [ ] **Expected**: Close button (X) visible in header

### 2.3 Progress Display - Multi-Step Objectives
- [ ] **Test**: Complete "Visit the Academy" objective (click Academy hex on World Map)
- [ ] **Expected**: "Explore Features" objective becomes tracked
- [ ] **Expected**: Progress shows "Step X of 3" (or similar)
- [ ] **Expected**: Progress updates as subtasks are completed

### 2.4 Progress Display - Numeric Progress
- [ ] **Test**: Track "Gather Wood" objective (after exploring Academy)
- [ ] **Expected**: Progress shows "X/50" format
- [ ] **Test**: Use Debug Panel to add wood
- [ ] **Expected**: Progress updates reactively

### 2.5 No Objective Tracked
- [ ] **Test**: Use Debug Panel to set trackedObjectiveId to null
- [ ] **Expected**: "No Objectives Tracked" card displays
- [ ] **Expected**: Card is still clickable
- [ ] **Test**: Click "No Objectives Tracked" card
- [ ] **Expected**: Navigate to Objectives View

---

## 3. Resources Section

### 3.1 Resource Display
- [ ] **Test**: Check Resources section in Status Column
- [ ] **Expected**: All 5 test resources visible:
  - Wood: 50 🪵
  - Stone: 25 🪨
  - Iron: 10 ⚙️
  - Gold: 10 💰
  - Mystical Essence: 5 ✨
- [ ] **Expected**: Icon, name, and amount displayed for each

### 3.2 Reactive Updates
- [ ] **Test**: Use Debug Panel to modify Wood amount
- [ ] **Expected**: Wood amount updates immediately in Status Column
- [ ] **Test**: Add resources via Debug Panel
- [ ] **Expected**: New resource appears in list
- [ ] **Test**: Rapid updates (add 100 wood, then remove 50, then add 25)
- [ ] **Expected**: Display keeps up with changes, no flickering

### 3.3 Long Resource Names
- [ ] **Test**: Use Debug Panel to add resource with very long name
- [ ] **Expected**: Name truncates or wraps gracefully
- [ ] **Expected**: No layout break

### 3.4 Large Numbers
- [ ] **Test**: Set Wood to 999,999,999
- [ ] **Expected**: Number displays correctly (check for overflow)
- [ ] **Expected**: Layout remains intact

---

## 4. Quick Navigation Section

### 4.1 World Map Button
- [ ] **Test**: Navigate to Academy Area Map
- [ ] **Expected**: "World Map" button visible in Navigation section
- [ ] **Test**: Click "World Map" button
- [ ] **Expected**: Return to World Map view

### 4.2 Current Location Indicator
- [ ] **Test**: Navigate to Academy Area Map
- [ ] **Expected**: Current location shows "📍 Academy" (or similar)
- [ ] **Test**: Navigate to different hex
- [ ] **Expected**: Current location updates to new hex name

### 4.3 Recent Locations List
- [ ] **Test**: Visit multiple hexes (Academy, then Forest, then another)
- [ ] **Expected**: Recent locations list populates
- [ ] **Expected**: Most recent locations shown (up to 5)
- [ ] **Test**: Click a recent location
- [ ] **Expected**: Navigate to that location's Area Map

---

## 5. System Links Section

### 5.1 Button States
- [ ] **Test**: Check System Links section
- [ ] **Expected**: Three buttons visible:
  - Settings (disabled)
  - Save Game (disabled)
  - Debug Panel (enabled)
- [ ] **Expected**: Disabled buttons have visual indication (grayed out, cursor not-allowed)

### 5.2 Debug Panel Toggle
- [ ] **Test**: Click "Debug Panel" button
- [ ] **Expected**: Debug Panel (PiniaDebugTable) appears/toggles
- [ ] **Test**: Click "Debug Panel" button again
- [ ] **Expected**: Debug Panel hides/toggles
- [ ] **Expected**: Toggle works smoothly multiple times

---

## 6. Objectives View - Full Screen

### 6.1 Layout and Sections
- [ ] **Test**: Navigate to Objectives View
- [ ] **Expected**: Full-screen view with header bar
- [ ] **Expected**: Sections visible:
  - Active Objectives
    - Main Objectives subsection
    - Secondary Objectives subsection (if available)
  - Completed Objectives (if any completed)

### 6.2 Objective Cards - Active
- [ ] **Test**: Check active main objectives
- [ ] **Expected**: Cards have gold left border (#FFD700)
- [ ] **Expected**: Each card shows title, description
- [ ] **Expected**: Currently tracked objective has "Tracked" badge (green)
- [ ] **Expected**: Cards have hover effect (lift slightly)

### 6.3 Objective Cards - Secondary
- [ ] **Test**: Complete "Visit the Academy" to reveal "Explore Features"
- [ ] **Expected**: Secondary objectives appear in separate subsection
- [ ] **Expected**: Cards have blue left border (#2196F3)

### 6.4 Objective Cards - Completed
- [ ] **Test**: Complete some objectives
- [ ] **Expected**: "Completed Objectives" section appears
- [ ] **Expected**: Completed cards have gray "✓ Completed" badge
- [ ] **Expected**: Completion timestamp shows (e.g., "Completed 2 minutes ago")
- [ ] **Expected**: Completed cards are semi-transparent/faded
- [ ] **Expected**: No hover effect on completed cards
- [ ] **Expected**: Cannot track completed objectives

### 6.5 Progress Display - Subtasks
- [ ] **Test**: View "Explore Features" objective
- [ ] **Expected**: Subtasks list visible with checkboxes
- [ ] **Expected**: Uncompleted subtasks show "○"
- [ ] **Expected**: Completed subtasks show "✓" and are grayed/strikethrough
- [ ] **Expected**: Progress text shows "X/Y steps"
- [ ] **Expected**: Progress bar shows visual percentage

### 6.6 Progress Display - Numeric
- [ ] **Test**: View "Gather Wood" objective
- [ ] **Expected**: Progress text shows "X/50"
- [ ] **Expected**: Progress bar shows visual percentage
- [ ] **Test**: Update progress via Debug Panel
- [ ] **Expected**: Progress bar animates smoothly

### 6.7 Tracking Objectives
- [ ] **Test**: Click an active objective card
- [ ] **Expected**: Objective becomes tracked
- [ ] **Expected**: Green "Tracked" badge appears
- [ ] **Expected**: Status Column updates to show newly tracked objective
- [ ] **Test**: Click another objective
- [ ] **Expected**: Previous "Tracked" badge disappears
- [ ] **Expected**: New objective gets "Tracked" badge
- [ ] **Expected**: Status Column updates

### 6.8 Close Button
- [ ] **Test**: Click X button in header
- [ ] **Expected**: Return to previous view (World Map or Area Map)
- [ ] **Expected**: Smooth transition

### 6.9 Responsive Behavior
- [ ] **Test**: View Objectives View on mobile (< 768px)
- [ ] **Expected**: Layout adjusts for narrow screen
- [ ] **Expected**: Cards stack vertically
- [ ] **Expected**: Text remains readable
- [ ] **Expected**: No horizontal scrolling

---

## 7. Notification System

### 7.1 Objective Completion Notification
- [ ] **Test**: Complete an objective (e.g., click Academy hex)
- [ ] **Expected**: Success notification appears (top-right corner)
- [ ] **Expected**: Notification shows objective title
- [ ] **Expected**: Green left border, checkmark icon
- [ ] **Expected**: Notification slides in from right

### 7.2 Auto-Dismiss
- [ ] **Test**: Wait after notification appears
- [ ] **Expected**: Notification auto-dismisses after ~4 seconds
- [ ] **Expected**: Smooth fade-out animation

### 7.3 Manual Dismiss
- [ ] **Test**: Complete objective to show notification
- [ ] **Test**: Click X button on notification
- [ ] **Expected**: Notification dismisses immediately
- [ ] **Test**: Click notification body (not X button)
- [ ] **Expected**: Notification dismisses

### 7.4 Multiple Notifications
- [ ] **Test**: Trigger multiple objective completions rapidly
- [ ] **Expected**: Notifications stack vertically
- [ ] **Expected**: Each notification visible and readable
- [ ] **Expected**: Each dismisses independently

### 7.5 Notification Types
- [ ] **Test**: Use Debug Panel to trigger different notification types:
  - Success: Green border, ✓ icon
  - Info: Blue border, ℹ icon
  - Warning: Orange border, ⚠ icon
  - Error: Red border, ✕ icon
- [ ] **Expected**: Correct styling and icons for each type

---

## 8. Integration Testing

### 8.1 World Map → Area Map → Objectives View
- [ ] **Test**: Full navigation flow
  1. Start on World Map
  2. Click Academy hex → Area Map
  3. Click objective in Status Column → Objectives View
  4. Click X → Return to Area Map
  5. Click World Map button → Return to World Map
- [ ] **Expected**: All transitions smooth, no errors
- [ ] **Expected**: Status Column persists throughout
- [ ] **Expected**: Back navigation works correctly

### 8.2 Objective Discovery Flow
- [ ] **Test**: Start fresh, complete objectives in order
  1. "Visit the Academy" (active by default)
  2. Click Academy hex → Completes objective
  3. "Explore Features" reveals (secondary)
  4. Visit Foundry, Shop, Workshop → Complete subtasks
  5. "Craft First Items" reveals
- [ ] **Expected**: Each objective reveals at correct time
- [ ] **Expected**: Notifications appear for completions
- [ ] **Expected**: Next objective auto-tracks (if main objective)

### 8.3 Resource Integration
- [ ] **Test**: Objectives that require resources
  1. Track "Gather Wood" objective
  2. Use Debug Panel to add wood
  3. Watch objective progress update
- [ ] **Expected**: Progress updates reactively
- [ ] **Expected**: Objective completes when target reached
- [ ] **Expected**: Notification appears

---

## 9. Edge Cases

### 9.1 Rapid Navigation
- [ ] **Test**: Click World Map button repeatedly and rapidly
- [ ] **Expected**: No errors in console
- [ ] **Expected**: View settles on World Map

### 9.2 Rapid Objective Tracking
- [ ] **Test**: Click multiple objectives rapidly in Objectives View
- [ ] **Expected**: Tracked badge updates correctly
- [ ] **Expected**: Status Column shows last clicked objective
- [ ] **Expected**: No visual glitches

### 9.3 Empty States
- [ ] **Test**: Use Debug Panel to complete all objectives
- [ ] **Expected**: "Active Objectives" section disappears
- [ ] **Expected**: "Completed Objectives" section shows all
- [ ] **Expected**: No JavaScript errors
- [ ] **Test**: Set trackedObjectiveId to null
- [ ] **Expected**: "No Objectives Tracked" card shows
- [ ] **Expected**: Clicking it opens Objectives View

### 9.4 Browser Resize During Interaction
- [ ] **Test**: Expand Status Column, then rapidly resize browser to mobile
- [ ] **Expected**: Column adapts smoothly
- [ ] **Expected**: No layout breaks
- [ ] **Test**: Navigate to Objectives View, then resize
- [ ] **Expected**: Layout adapts to new size

### 9.5 Long Objective Titles/Descriptions
- [ ] **Test**: Use Debug Panel to create objective with very long title
- [ ] **Expected**: Text wraps or truncates gracefully
- [ ] **Expected**: Card remains readable
- [ ] **Expected**: No horizontal scrolling

### 9.6 Area Map Close Button Issue (Known Bug)
- [ ] **Test**: Navigate to Area Map (Academy)
- [ ] **Test**: Try clicking close button in Area Map header
- [ ] **Expected**: Should return to World Map
- [ ] **Note**: User reported this sometimes doesn't work
- [ ] **Document**: Exact steps to reproduce if bug occurs
  - Screen size when it happens
  - Which Area Map (Academy, Forest, etc.)
  - Any console errors
  - Any other actions taken before clicking

---

## 10. Performance

### 10.1 Initial Load Time
- [ ] **Test**: Hard refresh page (Cmd+Shift+R / Ctrl+Shift+F5)
- [ ] **Expected**: Page loads in < 2 seconds
- [ ] **Expected**: Status Column renders without delay
- [ ] **Expected**: No flash of unstyled content

### 10.2 Status Column Responsiveness
- [ ] **Test**: Rapidly collapse/expand Status Column 10 times
- [ ] **Expected**: Animations remain smooth
- [ ] **Expected**: No lag or stutter

### 10.3 Objectives View Scrolling
- [ ] **Test**: Open Objectives View with many objectives
- [ ] **Test**: Scroll up and down rapidly
- [ ] **Expected**: Smooth scrolling
- [ ] **Expected**: No render lag

### 10.4 Resource Updates
- [ ] **Test**: Use Debug Panel to rapidly update resource amounts
- [ ] **Expected**: Status Column updates without lag
- [ ] **Expected**: No flickering

---

## 11. Accessibility (Basic Check)

### 11.1 Keyboard Navigation
- [ ] **Test**: Use Tab key to navigate
- [ ] **Expected**: Focus indicators visible
- [ ] **Expected**: Can reach all interactive elements
- [ ] **Expected**: Can activate buttons with Enter/Space

### 11.2 Screen Reader Labels
- [ ] **Test**: Inspect buttons in DevTools
- [ ] **Expected**: Close buttons have aria-label
- [ ] **Expected**: Important interactive elements have accessible names

---

## 12. Browser Compatibility

### 12.1 Chrome
- [ ] Test all core functionality
- [ ] Check console for errors
- [ ] Verify animations work

### 12.2 Firefox
- [ ] Test all core functionality
- [ ] Check console for errors
- [ ] Verify animations work

### 12.3 Safari (if available)
- [ ] Test all core functionality
- [ ] Check console for errors
- [ ] Verify animations work

---

## Test Results Summary

**Date Tested**: _______________
**Tester**: _______________
**Environment**: _______________

### Critical Issues Found
- [ ] None
- [ ] List any critical issues:

### Non-Critical Issues Found
- [ ] None
- [ ] List any non-critical issues:

### Areas Needing Attention
- [ ] Area Map close button issue
- [ ] Other:

### Overall Assessment
- [ ] All features working as expected
- [ ] Minor issues, but acceptable for milestone completion
- [ ] Major issues requiring fixes

### Notes
