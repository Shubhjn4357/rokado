# Design System — Rokado ERP

> **Single source of truth for all visual design decisions.**
> Every color, radius, shadow and spacing token lives in `app/globals.css`.
> **Zero hardcoded hex values** allowed anywhere in component or page files.

---

## Token Architecture

### Color Tokens — Light Mode (`:root`)

| Token | HSL Value | Usage |
|---|---|---|
| `--background` | `transparent` | Body bleeds through to `html` gradient |
| `--surface` | `hsl(0 0% 100% / 0.80)` | Card / panel surfaces (frosted) |
| `--surface-elevated` | `hsl(0 0% 100% / 0.96)` | Popovers, dropdowns |
| `--foreground` | `hsl(220 15% 14%)` | Body text — deep cool charcoal |
| `--muted-foreground` | `hsl(220 10% 50%)` | Labels, secondary text |
| `--muted` | `hsl(220 10% 94%)` | Subtle background fills |
| `--border` | `hsl(220 14% 90%)` | Light structural borders |
| `--input` | `hsl(220 14% 92%)` | Form input backgrounds |
| `--primary` | `hsl(220 15% 10%)` | Jet black — primary action buttons |
| `--primary-foreground` | `hsl(0 0% 100%)` | Text on primary buttons |
| `--accent` | `hsl(241 78% 65%)` | Royal indigo — interactive highlights |
| `--accent-foreground` | `hsl(0 0% 100%)` | Text on accent elements |
| `--destructive` | `hsl(4 88% 56%)` | Error / danger red |

### Color Tokens — Dark Mode (`.dark`)

All tokens shift to dark glassmorphism equivalents — surfaces become translucent dark, borders lighten to visible on dark backgrounds. See `globals.css .dark` block.

---

### Vivid Accent Panels

Used for hero stat cards (inspired by Image 1).

| Token | Value | Usage |
|---|---|---|
| `--panel-yellow` | `hsl(65 94% 59%)` | `#EBF53B` — Neon yellow stat panel |
| `--panel-yellow-fg` | `hsl(220 15% 8%)` | Near-black text on yellow |
| `--panel-orange` | `hsl(24 100% 61%)` | `#FF8C37` — Sun orange stat panel |
| `--panel-orange-fg` | `hsl(220 15% 8%)` | Near-black text on orange |
| `--panel-black` | `hsl(0 0% 6%)` | `#0F0F0F` — Jet black stat panel |
| `--panel-black-fg` | `hsl(0 0% 97%)` | Near-white text on black |

---

### Accounting Semantic Colors

| Token | Value | Usage |
|---|---|---|
| `--debit` | `hsl(353 72% 52%)` | Debit balances, receivables — warm rose |
| `--debit-foreground` | `hsl(0 0% 100%)` | Text on debit backgrounds |
| `--credit` | `hsl(152 55% 42%)` | Credit balances, payables — emerald |
| `--credit-foreground` | `hsl(0 0% 100%)` | Text on credit backgrounds |

---

### Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius` | `18px` | Base shadcn primitives (buttons, inputs) |
| `--radius-card` | `24px` | Standard cards |
| `--radius-xl` | `22px` | Modals, wide cards |
| `--radius-2xl` | `26px` | Hero panels |
| `--radius-pill` | `9999px` | Badges, pills |

---

### Shadows

Defined as CSS custom properties, used via `shadow-[var(--shadow-card)]` etc.

| Token | Usage |
|---|---|
| `--shadow-card` | Standard card — subtle lift |
| `--shadow-elevated` | Modals / popovers — deeper lift |
| `--shadow-glow-accent` | Accent icon / button glow |

---

## Body Gradient

```css
/* Light mode — warm sand cream */
html { background-image: linear-gradient(145deg, hsl(48 30% 92%), hsl(34 38% 91%), hsl(44 24% 90%)); }

/* Dark mode — cool obsidian */
html.dark { background-image: linear-gradient(145deg, hsl(222 42% 7%), hsl(226 45% 10%), hsl(222 42% 7%)); }
```

---

## Utility Classes

| Class | Description |
|---|---|
| `.surface-card` | Standard frosted-glass card surface |
| `.surface-elevated` | Elevated frosted surface (popovers) |
| `.surface-inset` | Inset muted panel (info boxes) |
| `.table-row-hover` | Table row with hover state |
| `.panel-yellow` | Neon yellow accent panel |
| `.panel-orange` | Sun orange accent panel |
| `.panel-black` | Jet black accent panel |
| `.glass-card-premium` | Alias → same as `.surface-card` |
| `.glass-table-row` | Legacy alias for table rows |

---

## Design Principles

1. **Token-only colors** — Never use Tailwind color names like `text-blue-600`, `bg-emerald-500`. Always use `text-accent`, `text-credit`, `text-debit`, `text-foreground`, `text-muted-foreground`, etc.
2. **Semantic naming** — Colors carry meaning (`credit` = positive/green, `debit` = negative/rose, `accent` = interactive indigo).
3. **Surface hierarchy** — `surface-card` < `surface-elevated` for visual depth.
4. **Background bleeds** — Cards use alpha so the body gradient shows through, creating depth.
5. **Dark mode parity** — Every light-mode token has a dark-mode equivalent in the `.dark` block.

---

## Reference Images

- **Image 1 (Inventory UI):** Yellow/Orange/Black vivid panels → `panel-yellow`, `panel-orange`, `panel-black`
- **Image 2 (Finance UI):** White frosted cards on periwinkle → `surface-card` on warm sand gradient
