# Task: NoteFreela Hub + Notion-style Editor

## Overview
Transform each Project into a "Hub" using a block-based editor (Notion-like) and a sliding "Dock" for related entities (Tasks, Inbox, Finance, Docs).

## 1. Database Schema Changes
### Migration Plan
- Table `projects`:
  - Add `content_blocks` (Json)
- Table `project_pages` (New):
  - `id` (uuid, primary key)
  - `project_id` (uuid, references projects)
  - `title` (text)
  - `content_blocks` (Json)
  - `created_at` (timestamp)
- Table `tasks`, `inbox`, `project_costs`:
  - Add `created_from` (text, default 'app')
  - Add `source_block_id` (text, optional)
- Table `activity_log` (Ensure it exists or create it):
  - Tracks actions within the project.

## 2. Frontend Infrastructure
### Dependencies
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-mention`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-placeholder`.
- `lucide-react` (Icons).
- `framer-motion` (Animations for the Dock).

### Architecture
- `src/pages/ProjectHub.tsx`: The main route controller.
- `src/components/project-hub/`:
  - `ProjectHeader.tsx`: KPIs and Quick actions.
  - `BlockEditor.tsx`: TipTap wrapper with slash commands.
  - `ProjectDock.tsx`: Tabbed sidebar (Tasks | Inbox | Finance | Docs | Activity).
  - `EntityDrawer.tsx`: Modal/Drawer to edit items without leaving the hub.

## 3. Core Features Implementation
### Phase 1: Layout & State
- Setup `ProjectHub` layout (Header top, Editor center, Dock right).
- implement `useState` for Dock visibility and active tab.

### Phase 2: Block Editor (TipTap)
- Custom Slash Command extension (`/task`, `/inbox`, etc.).
- Custom Mentions extension (`@` to link existing tasks/docs).
- Custom Nodes for "Entity Reference" (a stylized link to a task or financial entry).
- Embedded Views: Kanban/List blocks that fetch data filtered by `project_id`.

### Phase 3: The Dock
- Component with tabs using `framer-motion` for smooth transitions.
- Compact lists for each category.
- "Insert Reference" button: callback to editor to insert a block at current selection.

### Phase 4: Bidirectional Linking
- When creating a task via `/task`, save the current block ID in the task's `source_block_id`.
- Clicking a reference in the editor scrolls/highlights the item in the Dock (or opens its Drawer).

## 4. Migration & UX
- Script `utils/migrate-descriptions.ts`: Converts `projects.description` (text) to TipTap JSON structure.
- Implementation of `Ctrl+K` global project command palette.

## 5. Definition of Done
- [ ] CRUD operations with TipTap JSON.
- [ ] Slash commands work and link entities correctly.
- [ ] Dock lists items and allows quick creation.
- [ ] Bidirectional links are functional.
- [ ] Design feels "Premium" and alive (micro-animations).
