# Wingman Light Interface Design

## Goal

Replace Wingman's low-contrast terminal presentation with a conventional, readable light interface based on the visual system used by akashpersetti.com. Preserve all current application behavior and the existing two-column workspace.

## Visual System

Use these source-site design tokens consistently:

- Base background: `#ffffff`
- Alternate/panel background: `#f7fafa`
- Card background: `#ffffff`
- Primary text: `#0f172a`
- Secondary text: `#475569`
- Accent: `#0d9488`
- Accent hover: `#0f766e`
- Accent soft: `#5eead4`
- Accent wash: `#0d948814`
- Surface tint: `#ccfbf1`
- Border: `#e2e8f0`

Use the existing Next.js Inter font integration for all application chrome and user-entered text, with the family expressed as `Inter`, `Inter Fallback`, then sans-serif system fallbacks. Monospace remains only for semantic Markdown code and preformatted code blocks.

## Interface Changes

### Global styling

The page, panels, modal surfaces, scrollbar, prose, headings, links, tables, and focus states use the light palette. Secondary text must remain at least `#475569` on white or the equivalent contrast on alternate surfaces. Controls use modest corner radii, visible borders, and teal focus rings. No dark theme or theme toggle is added.

### Inputs and cursor behavior

Replace the custom mirrored textarea and block-cursor overlay with a native textarea that uses the browser caret, selection, focus, and accessibility behavior. Preserve the current forwarded refs, keyboard handling, values, disabled states, placeholders, rows, and styling interface so chat behavior does not change.

The command palette search field likewise uses a native caret. Remove its cursor-measurement state, hidden mirror, and block overlay.

### Application chrome

Keep the header actions and session status, but style them as conventional light buttons and status controls. Remove terminal separators, prompt marks, lowercase command-line phrasing where it harms clarity, and decorative monospace styling. Buttons receive clear hover and focus states.

Keep the 50/50 agent/chat workspace. Use white and alternate surfaces plus subtle borders to distinguish regions. Empty, loading, and error states use plain-language labels with icons or simple status indicators instead of shell prompts and spinner glyph sequences where practical.

### Chat and evaluator

User messages become readable tinted message cards aligned to the right. Assistant messages remain left-aligned with a clear identity label and readable Markdown. Replace shell-style `$`, `❯`, `#`, and `>` prefixes with normal labels and controls. The composer uses a normal textarea and recognizable Send and Reset buttons.

Evaluator feedback uses a teal-accented card or border treatment with primary/secondary text from the shared palette.

### Agent graph

Replace the ASCII diagram with regular labeled nodes and CSS connectors. Nodes represent Start, Worker, Tools, Evaluator, Retry, and End while preserving the existing animated active-node sequence. Active nodes use teal emphasis; inactive nodes use white surfaces, dark text, and slate borders. The graph must remain understandable without monospace alignment.

### Splash screen and command palette

Replace the terminal boot transcript and character progress bar with a clean Wingman wordmark, short loading label, and a standard teal progress bar on a white background. Preserve the completion timing and fade-out behavior.

The command palette becomes a rounded, elevated white dialog with a conventional search field, readable selected state, and styled keyboard hints. Its filtering, keyboard navigation, command execution, and dismissal behavior stay unchanged.

### Responsive behavior

Preserve the desktop two-column layout. On narrower screens, allow the workspace to stack vertically or otherwise remain usable without horizontal clipping. Header actions may wrap. Modal and command-palette widths must fit within the viewport.

## Boundaries

- Do not change backend APIs, session behavior, message filtering, or command actions.
- Do not add theme switching or a dark mode.
- Do not broadly redesign information architecture.
- Do not commit the unrelated `.DS_Store` file.
- Retain the existing local evaluator fix commit and push it together with the theme commits.

## Verification

- Add automated checks for the light palette, Inter font stack, native caret inputs, removal of terminal cursor code, and removal of monospace UI styling.
- Run the frontend test/check command introduced for those assertions.
- Run the frontend linter and production build.
- Search application UI code for remaining Menlo, Monaco, Courier, block-cursor, and terminal prompt treatments; any remaining monospace use must be limited to rendered Markdown code.
- Inspect the final Git diff and commit history before pushing `main` to `origin`.
