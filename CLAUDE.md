# Idle Artifice

## CLAUDE.md

This file provides guidance and context to Claude Code (claude.ai/code) and others agents (and humans!) when working with code in this repository.

See also:
@GAMEDESIGN.md - Game Design Document that describes the game overview, core gameplay loop, and overall project information

## Game concepts:

Idle Artifice is a web-based incremental game inspired by such projects as Gooboo (https://github.com/Tendsty/gooboo) and Evolve (https://github.com/pmotschmann/Evolve). The player manages their base and uses it to generate resources allowing them to explore a vast and unknown frontier.

## Coding Norms and Standards

This is a standard Vue.js project.

### Vue.js rules

- Use the Composition API with `<script setup>` for better type inference and organization
- Define props with type definitions and defaults
- Use emits for component events
- Use v-model for two-way binding
- Use computed properties for derived state
- Use watchers for side effects
- Use provide/inject for deep component communication
- Use async components for code-splitting

### Testing

Testing should be done in Cypress

### Issue Tracking

- The roadmap exists as Github Milestones and Issues.
- Milestone naming: Prefix milestone name with its number, e.g."""Milestone 1: "Set up standalone node.js server"""
- Issue naming: Prefix issue descriptive titles with "X.Y", where X is the milestone number and Y is its ordering within the milestone, e.g. "2.1 Introduce Crafting". Newer issues in a milestone get added to the end unless we choose to manually re-order them.
- Issues should have 2 labels: their milestone (in the form milestone-x) and one type descriptor from the list of existing labels, typically "feature" or "bug".

## Agent Guidance

- Ask clarifying questions when needed
- Keep prose in roadmaps, readme, and commit messages simple and to the point. Avoid puffery or self-congratulatory language.

## Code Architecture

This is a Vue.js project designed to run in a web browser. See Vue.js style guides

## Core Components

- World Map: a hexagonal map representing the known world. Explored hexes have an icon designating what they are. Unexplored hexes adjacent to explored hexes are grayed out and only have vague descriptions of what to expect. New hexes are added to the map as more unexplored hexes are explored
- Area Map: a map representing the individual hex that can be accessed by clicking on the hex. This has features and actions specific to that area.
- Features: a UI element that lives in the Area Map
- Resources: a type of currency that can be accrued by the player
- Magical Items: an item that can be created by combining different resources
- Explorer: a non-playable character that can equip magical items
- Skills: actions that Explorers can perform based on the Magical Item they have equipped
