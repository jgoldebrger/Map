# Page Dependency Trees

Candidate `--context-file` sets for key pages. Apply PAYLOAD BUDGET when selecting subsets.

---

## /map (Shipping Map — primary feature)

Entry: `src/app/(public)/map/page.tsx`

Dependencies:
- `src/components/map/MapPageContent.tsx`
  - `src/components/layout/SiteHeader.tsx`
    - `src/components/ui/button.tsx`
  - `src/components/map/MapLegend.tsx`
  - `src/components/map/CountyPanel.tsx`
    - `src/components/ui/button.tsx`
  - `src/components/map/ZipDetailPanel.tsx`
    - `src/components/ui/button.tsx`
    - `src/components/ui/badge.tsx`
  - `src/components/map/MapSearch.tsx`
    - `src/components/ui/input.tsx`
  - `src/components/map/ShippingMethodFilter.tsx`
    - `src/components/ui/button.tsx`
    - `src/lib/utils.ts`
  - `src/components/map/MapboxMap.tsx` (dynamic import, no SSR)
    - `src/lib/queries/assignments.ts`
    - `src/lib/map/county-zip-holes.ts`
    - `src/hooks/useZipOverrideGeoJson.ts`
  - `src/components/lookup/AskMapsFloat.tsx`
    - `src/components/ui/button.tsx`
    - `src/components/lookup/ShipDateChatCore.tsx`
      - `src/components/ui/button.tsx`
      - `src/components/ui/input.tsx`
    - `src/lib/utils.ts`
  - `src/hooks/useTerritoryAssignments.ts`
  - `src/hooks/useZipOverrideGeoJson.ts`
  - `src/hooks/useCountyDetail.ts`
  - `src/hooks/useZipLookup.ts`
  - `src/lib/queries/assignments.ts`

Inherited from root layout:
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/providers/QueryProvider.tsx`

---

## /lookup (ZIP Lookup)

Entry: `src/app/(public)/lookup/page.tsx`

Dependencies:
- `src/components/layout/SiteHeader.tsx`
  - `src/components/ui/button.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/select.tsx`
- `src/components/lookup/AskMapsFloat.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/lookup/ShipDateChatCore.tsx`
    - `src/components/ui/button.tsx`
    - `src/components/ui/input.tsx`
  - `src/lib/utils.ts`
- `src/lib/validators/lookup.ts`

Inline components in page file (no separate files):
- `LookupPageContent`, `ResultCard`, `Row`

Inherited from root layout:
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/providers/QueryProvider.tsx`

---

## /admin/map (Map Editor)

Entry: `src/app/admin/map/page.tsx`

Dependencies:
- `src/components/map/MapLegend.tsx`
- `src/components/map/ShippingMethodFilter.tsx`
  - `src/components/ui/button.tsx`
  - `src/lib/utils.ts`
- `src/components/map/MapboxMap.tsx` (dynamic)
  - `src/lib/queries/assignments.ts`
  - `src/lib/map/county-zip-holes.ts`
  - `src/hooks/useZipOverrideGeoJson.ts`
- `src/components/map/editor/MapEditorToolbar.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/label.tsx`
  - `src/components/ui/select.tsx`
  - `src/components/map/editor/StateMultiSelect.tsx`
    - `src/components/ui/button.tsx`
    - `src/lib/us-states.ts`
  - `src/lib/utils.ts`
- `src/components/map/editor/CountySelectionPanel.tsx`
  - `src/components/ui/button.tsx`
  - `src/lib/county-geo.ts`
- `src/components/map/editor/PolygonDrawTool.tsx`
- `src/components/map/editor/ZipAssignPanel.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/label.tsx`
  - `src/components/ui/select.tsx`
- `src/components/lookup/AskMapsFloat.tsx`
  - `src/components/lookup/ShipDateChatCore.tsx`
- `src/hooks/useTerritoryAssignments.ts`
- `src/hooks/useZipOverrideGeoJson.ts`
- `src/hooks/useMapEditorHistory.ts`
- `src/lib/county-geo.ts`
- `src/lib/queries/assignments.ts`

Layout chain:
- `src/app/layout.tsx`
- `src/app/admin/layout.tsx`
  - `src/components/layout/AdminSidebar.tsx`
    - `src/components/ui/button.tsx`
    - `src/hooks/usePermissions.ts`
  - `src/components/providers/SessionProvider.tsx`
- `src/app/admin/map/layout.tsx` (permission gate only)

---

## / (Home)

Entry: `src/app/page.tsx`

Dependencies:
- `src/components/layout/SiteHeader.tsx`
  - `src/components/ui/button.tsx`
- `src/components/ui/button.tsx`

Inherited from root layout:
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/providers/QueryProvider.tsx`
