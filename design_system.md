# Design System - Rokado ERP

This file documents the visual contract used by the app. The implementation lives in `app/globals.css`.

## Direction

Rokado uses a compact productivity UI: quiet surfaces, small radii, clear accounting semantics, and restrained accent panels for high-priority dashboard metrics.

## Token Rules

- Use semantic tokens from `app/globals.css`; avoid hardcoded hex values and raw Tailwind palette colors in app UI.
- Prefer `surface-card`, `surface-elevated`, and `surface-inset` for structure.
- Keep cards and tool surfaces at `--radius-card` unless a primitive already owns its shape.
- Use `credit`, `debit`, `accent`, `destructive`, `muted`, and `foreground` for meaning.
- Keep motion subtle: short hover/focus transitions only.

## Core Tokens

| Token | Use |
| --- | --- |
| `--background` | App workspace canvas |
| `--surface` | Cards, sidebars, top bars |
| `--surface-elevated` | Menus, popovers, dialogs |
| `--foreground` | Primary text |
| `--muted-foreground` | Secondary labels and helper text |
| `--border` | Separators and control borders |
| `--primary` | Primary actions |
| `--accent` | Navigation, focus, and interactive highlights |
| `--debit` | Receivables, debit balances, negative pressure |
| `--credit` | Cash health, successful status, credit balances |
| `--destructive` | Errors and dangerous actions |

## Radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | `6px` | Buttons, inputs, icon controls |
| `--radius-md` | `8px` | Default controls |
| `--radius-card` | `8px` | Cards and panels |
| `--radius-pill` | `9999px` | Pills, status dots, badges |

## Utility Classes

| Class | Description |
| --- | --- |
| `.surface-card` | Standard card or app-shell surface |
| `.surface-elevated` | Elevated menu/dialog/popover surface |
| `.surface-inset` | Muted inner panel |
| `.table-row-hover` | Standard table hover state |
| `.panel-yellow` | High-priority sales/activity panel |
| `.panel-orange` | Stock exception/warning panel |
| `.panel-black` | Financial focus panel |

## Accessibility

- Focus rings use the semantic `--ring` token.
- Scrollbars remain visible and styled.
- Text should not rely on color alone; pair color with labels, icons, or status copy.
- Avoid decorative visual noise in operational screens.
