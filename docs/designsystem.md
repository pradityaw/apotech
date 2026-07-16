# Design System — ApoTech

## Visual Identity
- **Reference**: Salesforce Lightning Design System (SLDS)
- **Primary**: #0070d2 (SLDS blue)
- **Success**: #4bca81 | **Warning**: #ffb75d | **Error**: #c23934
- **Surface**: White (#ffffff) cards on #f3f2f2 page background
- **Text**: #080707 primary, #3e3e3c secondary, #706e6b muted
- **Font**: System stack — `'Salesforce Sans', -apple-system, sans-serif`
  - Fallback: `IBM Plex Sans` (available on Google Fonts)
- **Border radius**: 4px (cards), 2px (inputs), pill (badges)
- **Shadow**: `0 2px 3px rgba(0,0,0,0.16)` only — no dramatic shadows

## Layout
- Left sidebar navigation: 240px expanded / 48px icon-only collapsed
- Top bar: 52px fixed height
- Page header area below top bar: breadcrumb + page title + action buttons
- Content: padded 16px/24px, 12-col grid, max content width 1440px

## Component Patterns
- **List views**: Data table, checkbox select, column sort arrows, filter bar above
- **Detail pages**: 2-col (68/32), highlights panel at top showing 4 key fields
- **Forms**: Modal for create, inline editing for update
- **Status**: Always pill badges, never raw text
- **Empty states**: Icon + headline + CTA button, centered in content area

## Domain-Specific Rules
- All currency: "Rp X.XXX" format
- Dates: DD/MM/YYYY
- Compliance status fields get traffic-light coloring (hijau/kuning/merah)
- Batch/lot numbers always monospace font
- Government form references (e.g. SP3, SIPNAP) shown as subtle gray label tags
