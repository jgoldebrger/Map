# Extractable Components

Reusable UI components for Superdesign `DraftComponent` extraction. Map-focused components prioritized.

---

## Layout Components

### SiteHeader
- Source: `src/components/layout/SiteHeader.tsx`
- Category: layout
- Description: Public top navigation with SIP branding, Map/Lookup/Admin links
- Extractable props: `activeItem` (string: "map" | "lookup" | "admin" | "home", default: inferred from route)
- Hardcoded: Logo Map icon, "SIP" text, subtitle, nav labels, all hrefs, all CSS

### AdminSidebar
- Source: `src/components/layout/AdminSidebar.tsx`
- Category: layout
- Description: Admin left sidebar with permission-filtered nav links and sign-out
- Extractable props: `activeHref` (string, default: current pathname), `role` (string, default: from session), `showReadOnlyBadge` (boolean)
- Hardcoded: All nav items (labels, icons, hrefs), "SIP Admin" branding, sign-out behavior, all CSS

---

## Map Page Components

### MapPageContent
- Source: `src/components/map/MapPageContent.tsx`
- Category: layout
- Description: Full map page shell — header variant, map canvas, overlays, side panels
- Extractable props: `variant` ("full" | "embed" | "admin", default: "full")
- Hardcoded: Loading states, overlay positioning, embed header text, all layout CSS

### MapboxMap
- Source: `src/components/map/MapboxMap.tsx`
- Category: basic
- Description: Mapbox GL map with county/zip territory layers, view and edit modes
- Extractable props: `mode` ("view" | "edit"), `assignments` (AssignmentMap), `selectedFips` (Set), `dimUnmatchedCounties` (boolean), `boxSelectEnabled` (boolean), `className` (string)
- Hardcoded: Mapbox token env, layer IDs, paint expressions, default bounds, all map styling

### MapLegend
- Source: `src/components/map/MapLegend.tsx`
- Category: basic
- Description: Floating territory legend grouped by shipping method with color swatches
- Extractable props: `assignments` (AssignmentMap), `className` (string)
- Hardcoded: "Territories" heading, grouping logic, swatch styling, all CSS

### MapSearch
- Source: `src/components/map/MapSearch.tsx`
- Category: basic
- Description: Map overlay search input with autocomplete dropdown
- Extractable props: `className` (string)
- Hardcoded: Placeholder text, search API endpoint, result rendering, all CSS

### ShippingMethodFilter
- Source: `src/components/map/ShippingMethodFilter.tsx`
- Category: basic
- Description: Multi-select dropdown filter for shipping methods on map
- Extractable props: `methods` (array of {id, name}), `selected` (Set<string>), `onChange` (callback), `className` (string)
- Hardcoded: "All methods" label logic, All/Clear buttons, Layers icon, all CSS

### CountyPanel
- Source: `src/components/map/CountyPanel.tsx`
- Category: basic
- Description: Right-side slide panel showing county territory details
- Extractable props: `fips` (string | null), `detail` (CountyDetail), `isLoading` (boolean), `error` (Error | null), `onClose` (callback)
- Hardcoded: "County Details" title, field labels, loading/error states, panel dimensions (w-80), all CSS

### ZipDetailPanel
- Source: `src/components/map/ZipDetailPanel.tsx`
- Category: basic
- Description: Right-side slide panel showing ZIP territory details with override badge
- Extractable props: `zip` (string | null), `detail` (LookupResult), `isLoading` (boolean), `error` (Error | null), `onClose` (callback)
- Hardcoded: "ZIP Details" title, "Territory override" badge, county default comparison block, all CSS

---

## Map Editor Components

### MapEditorToolbar
- Source: `src/components/map/editor/MapEditorToolbar.tsx`
- Category: layout
- Description: Top toolbar for map editor — selection modes, state picker, territory assign, undo
- Extractable props: `countyClickMode`, `boxSelectMode`, `polygonMode`, `selectedCount`, `statePicker`, `territories`, `assignTerritoryId`, `saving`, `canUndo`, `assignError`, `zipMessage` + corresponding onChange handlers
- Hardcoded: All toolbar section labels, mode button text, all CSS

### CountySelectionPanel
- Source: `src/components/map/editor/CountySelectionPanel.tsx`
- Category: basic
- Description: Floating panel listing selected counties with assign action
- Extractable props: `selectedFips` (Set), `countyFeatures`, `assignTerritoryName`, `assignDisabled`, `saving` + onRemove/onClear/onAssign callbacks
- Hardcoded: County label formatting, list styling, all CSS

---

## Shared Feature Components

### AskMapsFloat
- Source: `src/components/lookup/AskMapsFloat.tsx`
- Category: basic
- Description: Fixed right-edge "Ask Maps" chat drawer for ship date questions
- Extractable props: `className` (string), `open` (boolean, default: internal state)
- Hardcoded: "Ask Maps" label, vertical text styling, drawer title/subtitle, all CSS

### ShipDateChatCore
- Source: `src/components/lookup/ShipDateChatCore.tsx`
- Category: basic
- Description: Chat UI for natural-language ship date queries
- Extractable props: `compact` (boolean), `className` (string)
- Hardcoded: Example prompts, message rendering, API endpoint, all CSS

---

## Basic UI Primitives (shadcn/ui)

See `components.md` for full source. Key extractable primitives:

| Name | Source | Category |
|------|--------|----------|
| Button | `src/components/ui/button.tsx` | basic |
| Input | `src/components/ui/input.tsx` | basic |
| Select | `src/components/ui/select.tsx` | basic |
| Card | `src/components/ui/card.tsx` | basic |
| Label | `src/components/ui/label.tsx` | basic |
| Badge | `src/components/ui/badge.tsx` | basic |
| Dialog | `src/components/ui/dialog.tsx` | basic |
| Switch | `src/components/ui/switch.tsx` | basic |
| Textarea | `src/components/ui/textarea.tsx` | basic |
| Table | `src/components/ui/table.tsx` | basic |
| DataTable | `src/components/ui/data-table.tsx` | basic |

Extractable props for Button: `variant`, `size`, `asChild`, standard button HTML attrs.
