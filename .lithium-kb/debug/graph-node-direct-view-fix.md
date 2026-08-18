# Graph Node Direct Document View Fix

- **Symptom:** Clicking or interacting with nodes on the Neural Knowledge Graph canvas failed to reliably open document views or accidentally switched tabs during drag operations.
- **Root Cause:**
  1. `node-root` lacked a `path` property (`path: undefined`), preventing direct viewing of `PROJECT_KB.md`.
  2. Canvas `mousedown` was invoking `loadDoc()` immediately on any mouse click down, triggering tab switching even when the user intended to pan or drag nodes.
  3. Non-markdown code files loaded from the graph weren't formatted with markdown code blocks in the renderer.
- **Solution:**
  1. Added `path: 'PROJECT_KB.md'` to `node-root` in `buildNeuralGraphData()`.
  2. Separated drag interaction from clean click interaction via `mouseDownPos` delta threshold ($< 6\text{px}$).
  3. Formatted non-markdown code files with syntax code fences before rendering in `renderDocs()`.
  4. Made clicking category nodes expand/highlight their folder tree in the explorer sidebar.
