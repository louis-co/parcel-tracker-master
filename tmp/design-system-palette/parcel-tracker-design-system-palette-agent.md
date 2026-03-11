# Parcel Tracker Simplified Color Palette

This file is the agent-facing color reference for the current dashboard design system.

Use this as the source of truth for manual design work, mockups, UI generation, and agent tasks.

Important rule:
- Treat the system as **4 real color families**: `neutral`, `accent`, `warning`, `danger`.
- `live` and `info` are **not separate hue families** anymore. They are derived from the `accent` family.

## Core Rule
- `neutral` = structure, surfaces, text, borders
- `accent` = primary action, active state, live state, info state, nav emphasis, map emphasis
- `warning` = fallback, caution, alert panels
- `danger` = error, offline, destructive actions

## Neutral Foundation
| Token | Dark | Light | Use |
|---|---:|---:|---|
| `--tone-ink` | `#101311` | `#F3EDE0` | Deepest canvas base |
| `--tone-panel` | `#171B18` | `#FFFDF8` | Primary panel surface |
| `--tone-line` | `#313833` | `#C8C1B3` | Borders and dividers |
| `--tone-text` | `#DDE5DB` | `#1A241E` | Primary readable text |

## Accent Family
These are all considered one hue family now.

| Token | Dark | Light | Use |
|---|---:|---:|---|
| `--tone-accent` | `#B9D8BE` | `#486F57` | Master accent hue |
| `--primary` | `#B9D8BE` | `#486F57` | Primary action fill |
| `--accent` | `#374139` | `#E9ECE5` | Accent-tinted surface |
| `--status-live-fg` | `#C4DEC8` | `#426650` | Live-state text |
| `--status-live-bg` | `#B8D5BF24` | `#47715524` | Live-state fill |
| `--status-info-fg` | `#C8E1CC` | `#3F624D` | Info-state text |
| `--status-info-bg` | `#BAD8BA1A` | `#496D5B1C` | Info-state fill |
| `--map-accent` | `#B9D8BE` | `#486F57` | Route and selected-point emphasis |

## Warning Family
| Token | Dark | Light | Use |
|---|---:|---:|---|
| `--tone-warning` | `#F4C95D` | `#B87A11` | Master warning hue |
| `--status-warning-fg` | `#FFF1C4` | `#6D4A00` | Warning text |
| `--status-warning-bg` | `#F1C65C24` | `#BB7C1329` | Warning fill |
| `--alert-panel-fg` | `#FFF0D2` | `#6E4D0F` | Alert-panel text |
| `--alert-panel-bg` | `#F7C55A1F` | `#B8780E24` | Alert-panel fill |
| `--alert-panel-border` | `#F5CA5D94` | `#B87A116B` | Alert-panel border |

## Danger Family
| Token | Dark | Light | Use |
|---|---:|---:|---|
| `--tone-danger` | `#EF7A7A` | `#B65151` | Master danger hue |
| `--destructive` | `#B76161` | `#C67776` | Destructive action fill |
| `--status-error-fg` | `#FFE3E3` | `#772F2F` | Error/offline text |
| `--status-error-bg` | `#EC7C7C29` | `#B84E4E24` | Error/offline fill |

## Less-Used / Derived Supporting Colors
These still exist, but they are not primary hue families.

| Token | Dark | Light | Use |
|---|---:|---:|---|
| `--shell-top` | `#0D100E` | `#FBF7EF` | Background gradient top |
| `--shell-bottom` | `#151916` | `#EDE4D4` | Background gradient bottom |
| `--background` | `#101311` | `#F4EFE3` | Resolved app background |
| `--foreground` | `#DDE5DB` | `#1A241E` | Resolved foreground |
| `--card` | `#171B18` | `#FFFCF7` | Card surface |
| `--popover` | `#161A17` | `#FEFCF7` | Floating surface |
| `--secondary` | `#1C201D` | `#FCF9F1` | Secondary surface |
| `--muted` | `#1F2420` | `#F9F5EC` | Muted surface |
| `--border` | `#505751` | `#D6D1C5` | Default border |
| `--input` | `#1A1F1C` | `#FDFBF4` | Input background |
| `--ring` | `#BAD7BE7A` | `#4971564D` | Focus outline |
| `--status-neutral-fg` | `#DCE5DBB8` | `#1B231DAD` | Neutral-status text |
| `--status-neutral-bg` | `#1B201C` | `#FBF8F0` | Neutral-status fill |
| `--map-panel` | `#171B18` | `#FFFFFF` | Map shell |
| `--map-text` | `#DDE5DB` | `#1A241E` | Map text |

## Agent Guidance
- Prefer `accent` over inventing new highlight colors.
- Do not introduce separate green-for-live and blue-for-info systems again.
- Only use `warning` when the UI communicates caution or degraded state.
- Only use `danger` for errors, offline state, destructive actions, or hard failure messaging.
- If a new component needs emphasis but is not a warning or error, use the `accent` family.
- If a new token is needed, derive it from one of the existing families instead of creating a new hue family.
