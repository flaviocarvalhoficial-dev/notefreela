# Task: Redesign NoteFreela to "Notion-like" Flat Aesthetic

## 🎯 Goal
Overhaul the UI to move away from "aggressive" design (neon, heavy glows, massive rounded corners) toward a clean, flat, and professional productivity workspace inspired by Notion.

## 🛠️ Phases

### Phase 1: CSS Architecture Overhaul (`index.css`)
- [ ] Define new color tokens (Light & Dark variants).
- [ ] Implement crisp shadow system (subtle lift).
- [ ] Update border-radius tokens (from 32px to 8px max).
- [ ] Standardize typography (Jakarta Sans).
- [ ] Implement clean dividers and border-based separation.

### Phase 2: Core Layout Updates
- [ ] **Sidebar**: Switch from floating/glow to a flat, pinned appearance with neutral background.
- [ ] **Header**: Simplify navigations, remove heavy glass effects.
- [ ] **Page Containers**: Use cleaner backgrounds (Slate-50 in light mode).

### Phase 3: Component Redesign
- [ ] **Bento Cards**: Remove `bento-card` heavy rounding and glow. Use `border-border/60` and `bg-card/50`.
- [ ] **Buttons**: Replace gradients with solid colors or ghost variants.
- [ ] **Badges**: Use subtle outlines and muted backgrounds.
- [ ] **Inputs**: Standardize on a clean "Notion-like" input (thin border).

### Phase 4: Page Specific Refinement
- [ ] **Dashboard**: Reorganize tiles for clearer data hierarchy.
- [ ] **Projects**: Clean up the "Notion-style" header to be even more minimal.
- [ ] **Kanban**: Ensure the lane borders are crisp and use neutral backgrounds.

## 🎨 Design System Tokens (Target)
- **Primary**: slate-900 (Text), blue-600 (Action)
- **Background**: slate-50 (Light), slate-950 (Dark)
- **Border**: slate-200 (Light), slate-800 (Dark)
- **Shadow**: Crisp 1px-2px blur max.
- **Roundness**: 8px (Cards), 6px (Inputs/Buttons).
