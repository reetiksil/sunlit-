# DESIGN.md — Sunlit Pages Design System

## 1. Visual North Star
"A quiet reading room with morning sunlight and calm twilight nights."
Every visual choice minimizes cognitive load: generous whitespace, soft rounded geometry (`14px–22px`), zero intrusive pop-ups, and procedural book covers as the centerpiece.

## 2. Color Tokens & WCAG AA Contrast Audit
All tokens live in `src/styles/globals.css` and switch smoothly over `450ms cubic-bezier(0.22, 1, 0.36, 1)` with progressive enhancement via the **View Transitions API**.

### Day Mode ("Sunny Morning")
| Token | Hex | Role | Contrast Ratio |
|---|---|---|---|
| `--bg` | `#FFF9EF` | Warm cream background | — |
| `--surface` | `#FFFFFF` | Cards, panels, sheets | — |
| `--surface-soft` | `#FDF1DC` | Subtle hover & pills | — |
| `--primary` | `#F6B94C` | Sunshine yellow CTAs | `7.1:1` vs `--primary-fg` (`#3B2A0A`) |
| `--text` | `#2F3B4A` | Primary body & headings | `10.6:1` on `--bg` (AAA) |
| `--text-muted` | `#5C6B7C` | Secondary metadata | `4.8:1` on `--surface-soft` (AA) |

### Night Mode ("Calm Twilight")
| Token | Hex | Role | Contrast Ratio |
|---|---|---|---|
| `--bg` | `#141B2D` | Deep soft navy | — |
| `--surface` | `#1D2742` | Elevated cards | — |
| `--surface-soft` | `#243053` | Interactive hover states | — |
| `--primary` | `#FFD28A` | Warm moonlight accent | `12.4:1` vs `--primary-fg` (`#1B1405`) |
| `--text` | `#E8ECF5` | Primary text | `13.8:1` on `--bg` (AAA) |
| `--text-muted` | `#9AA6BD` | Secondary metadata | `5.3:1` on `--surface` (AA) |

## 3. Typography Scale
- **Display & Headings**: `Fraunces` (soft, warm old-style serif) using fluid `clamp()` sizing.
- **UI & Navigation**: `DM Sans` for clean legibility at small sizes.
- **Dedicated Reader Fonts (5 options)**:
  1. `Lora` (Balanced literary serif)
  2. `DM Sans` (Clean sans-serif)
  3. `Atkinson Hyperlegible` (Low-vision & accessibility focused)
  4. `Merriweather` (Sturdy modern serif)
  5. `JetBrains Mono` (Monospace option)

## 4. Motion & Animation Rules
- **Ambient Background**: 2 slow gradient blobs (`48s–56s` loops) + 1 drifting SVG cloud + twinkling night stars. Automatically paused when `document.hidden` is true or when `prefers-reduced-motion: reduce` is enabled.
- **Micro-interactions**: Cards lift `-4px` on hover; buttons scale to `0.98` on press. No bouncy springs.

## 5. Component language (v2)
Defined in `src/styles/globals.css` (`@layer components`): `.btn` (+ `-primary`, `-ghost`, `-danger`, `-sm`, `-reader`), `.card`, `.input`/`.field`/`.label`,
`.eyebrow`, `.chip`, `.link-underline` (underline that retracts on hover), `.nav-link` (sun-dot active marker), `.seg`, `.switch`, `.range`, `.menu-item`, `.dropzone`.
Identity: italic/roman Fraunces wordmark with a rotating sun glyph, a faint paper-grain texture, warm focus rings (`--ring`), and small press/lift micro-interactions.
Accessibility: every control has a visible focus ring, motion respects `prefers-reduced-motion`, menus/drawers are keyboard operable.
