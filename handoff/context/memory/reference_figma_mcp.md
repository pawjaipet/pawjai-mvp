---
name: Figma MCP Reference
description: How to use the Figma MCP tools in this project — tool names, URL parsing, limitations
type: reference
originSessionId: 26138611-8087-4cbb-9e19-91a09b1ea996
---
**Plugin:** `plugin:design:figma` / tools: `mcp__Figma__*`

**File:** https://www.figma.com/make/cfYww0U2M4xAkvHv3Gbvss/PAWJAI-Currently  
File key: `cfYww0U2M4xAkvHv3Gbvss`

**Node ID format:** From URL `?node-id=1-2` → pass as `1:2`

**Tools available:**
- `get_design_context` — primary tool, fetches code + screenshot for a node
- `get_screenshot` — visual only, no code
- `get_variable_defs` — design tokens (colors, spacing, typography)
- `get_code_connect_map` / `add_code_connect_map` — Figma ↔ codebase component mapping
- `create_design_system_rules` — generate design system rules

**IMPORTANT:** Tool schemas show empty `{}` params — but tools DO accept nodeId from URL or selection.  
Do NOT use `get_metadata` on Figma Make files (this file is Figma Make).

**Limitation:** Tools read currently selected node in Figma desktop app if no nodeId provided.  
No Figma desktop app needed if nodeId is extracted from URL and passed directly.
