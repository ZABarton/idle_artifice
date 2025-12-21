# Dialog Tree Editor

A visual editor for creating and managing dialog trees for Idle Artifice.

## Accessing the Editor

1. Navigate to `/debug` in your browser
2. Click "Dialog Tree Editor" button under Development Tools
3. Or navigate directly to `/dev/dialog-editor`

## Features

### Loading Dialog Trees

**From Project Files**
- Use the dropdown in the left sidebar to select from existing dialog trees in `src/content/dialog-trees/`
- Trees are automatically discovered via Vite's import.meta.glob

**Upload External File**
- Click "Choose File" to upload a JSON dialog tree from your filesystem
- The file will be validated before loading

**Create New Tree**
- Click "New Dialog Tree" to create a blank template
- Default structure includes a single start node

### Visual Graph Editor

The center canvas displays your dialog tree as an interactive node graph:

**Node Appearance**
- Green border: Start node
- Blue highlight: Selected node
- Red border: Node with validation errors
- Orange border: Node with validation warnings
- Dashed red border: Orphaned node (unreachable from start)

**Controls**
- Click node: Select for editing
- Drag node: Reposition on canvas
- Click edge: Select response for editing
- Mouse wheel: Zoom in/out
- Click + drag background: Pan the view

**Toolbar Buttons**
- "Auto Layout": Automatically arrange nodes hierarchically
- "Add Node": Create a new unconnected node

### Editing Nodes

When you select a node, the right panel shows an editor with:

**Node Properties**
- Node ID (read-only after creation)
- Message text with character counter
- Optional portrait override for expression changes

**Responses**
Each response has:
- Text: What the player sees
- Next Node: Where this choice leads
  - Select from existing nodes
  - Choose "(End conversation)" to terminate
  - Click "+" to create a new node and link to it
- Delete button to remove the response

**Actions**
- "Add Response": Add a new player choice
- "Set as Start Node": Make this the conversation entry point
- "Delete Node": Remove this node (with confirmation)

### Tree Metadata

In the left sidebar under "Current Tree":
- Tree ID
- Character Name
- Portrait Path (tree-level default)
- Portrait Alt Text
- Start Node ID (read-only)
- Total Node Count

All fields except Start Node and Total Nodes are editable.

### Validation

The validation panel at the bottom shows real-time feedback:

**Errors (blocking export)**
- Missing or invalid start node
- Response references non-existent node
- Empty response text or node message
- Node ID mismatches

**Warnings (non-blocking)**
- Orphaned nodes (unreachable from start)
- No terminal paths (infinite loops)
- Response text > 200 characters
- Message text > 1000 characters
- More than 4 responses per node

Click "Show Node" on any issue to highlight the problematic node on the canvas.

### Saving & Exporting

**Save (Recommended)**

Click "Save" in the header to save changes directly to the project file:

1. Validation runs automatically
2. If errors exist, save is blocked
3. If only warnings exist, you'll be asked to confirm
4. File is written to `src/content/dialog-trees/{treeId}.json`
5. Changes are immediately available in the project
6. Dirty indicator (*) is cleared after successful save

This is the fastest workflow for editing existing dialog trees during development.

**Export JSON (Alternative)**

Click "Export JSON" to download a copy of your dialog tree:

1. Validation runs automatically
2. If errors exist, export is blocked
3. If only warnings exist, you'll be asked to confirm
4. JSON is downloaded with clean structure (no editor metadata)
5. File is named `{treeId}.json`
6. You must manually save the file to `src/content/dialog-trees/`

Use this when:
- Creating a new dialog tree to add to the project
- Sharing a dialog tree with others
- Backing up before major changes

### Unsaved Changes

The editor tracks modifications:
- Asterisk (*) appears in header when changes exist
- Browser warns before navigating away
- Confirmation required before loading different tree

## Best Practices

**Node IDs**
- Use kebab-case: `welcome`, `about-academy`, `ship-question`
- Keep them descriptive but concise
- IDs are permanent (can't be renamed easily)

**Messages**
- Keep under 1000 characters for readability
- Use newlines (`\n`) for paragraph breaks
- Consider markdown support in the game renderer

**Responses**
- Limit to 4 or fewer options when possible
- Keep response text under 200 characters
- Use clear, distinct phrasing for each choice

**Conversation Flow**
- Always ensure at least one path terminates (ends conversation)
- Avoid infinite loops unless intentional
- Test all branches for logic errors
- Use portrait overrides sparingly for key emotional moments

**Organization**
- Group related nodes visually on the canvas
- Use auto-layout as a starting point, then adjust
- Drag nodes to create logical flow (left to right, top to bottom)

## Workflow Examples

**Editing an Existing Dialog Tree**
1. Select tree from dropdown (e.g., "headmaster-intro")
2. Click nodes on the canvas to edit them
3. Make changes to messages, responses, etc.
4. Watch validation panel for any issues
5. Click "Save" to write changes back to the file
6. Changes are immediately available in the game

**Creating a New Dialog Tree**
1. Click "New Dialog Tree"
2. Edit tree ID and metadata in left sidebar
3. Add nodes and responses using the canvas
4. Build out the conversation flow
5. Click "Export JSON" to download
6. Manually save to `src/content/dialog-trees/your-tree-id.json`
7. Restart dev server to see it in the game

## Keyboard Shortcuts

(Future enhancement - not yet implemented)
- Ctrl+S: Save to file
- Delete: Delete selected node/response
- Escape: Deselect
- Ctrl+N: New tree

## Technical Details

**File Format**
Dialog trees are stored as JSON with this structure:
```json
{
  "id": "tree-id",
  "characterName": "Character Name",
  "portrait": {
    "path": "images/portraits/character.png",
    "alt": "Portrait description"
  },
  "startNodeId": "start",
  "nodes": {
    "node-id": {
      "id": "node-id",
      "message": "Dialog text here...",
      "responses": [
        {
          "text": "Player choice text",
          "nextNodeId": "other-node-id"
        }
      ],
      "portrait": {
        "path": "images/portraits/character-happy.png",
        "alt": "Character happy expression"
      }
    }
  }
}
```

**Node Positions**
- Positions are stored in editor session only
- Not persisted to JSON export
- Auto-layout recalculates from tree structure

**Validation Algorithm**
- BFS traversal from start node for reachability
- DFS with cycle detection for terminal path checking
- Real-time validation on every edit (debounced 500ms)

## Troubleshooting

**Graph doesn't show nodes**
- Check that a tree is loaded (dropdown should show selection)
- Try clicking "Auto Layout" button
- Check browser console for errors

**Can't export**
- Fix all validation errors (shown in validation panel)
- Warnings can be ignored but will prompt confirmation

**Changes not saving**
- Changes are saved in memory immediately
- Must click "Export JSON" to download
- Remember to save downloaded file to project

**Nodes overlap**
- Click "Auto Layout" to reorganize
- Manually drag nodes to desired positions
- Positions reset on page reload (intentional)

## Future Enhancements

Potential features for future development:
- Keyboard shortcuts
- Undo/redo stack
- Markdown preview for messages
- Portrait image preview/file browser
- Search/filter nodes by content
- Duplicate node functionality
- Batch operations
- Graph statistics
- Export to PNG
- Dark mode support
- Save layouts to localStorage
- Multi-tree editing
