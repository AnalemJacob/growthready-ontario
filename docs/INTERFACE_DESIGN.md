# Regional explorer interface

The regional explorer uses a map-focused workspace with a compact title, four filtered-summary cards, application filters on the left, the map in the centre and selected application evidence on the right. The navy application header and shared navigation connect the explorer, Vaughan case study and project findings. Teal identifies interactive map and chart elements; amber marks unverified site capacity.

## Design references

- [CARTO Builder](https://carto.com/builder/): interactive spatial dashboards and map-focused exploration.
- [ArcGIS Urban interface documentation](https://doc.esri.com/en/arcgis-urban/latest/help/help-intro.html): overview maps paired with searchable, filterable side panels.

These references informed the layout; the implementation retains GrowthReady's existing data and application behavior.

## Responsive behavior

Wide screens have three columns and independently scrolling filter and evidence panels. Below 1,200 px, evidence follows the workspace. Phone layouts use two-column summary cards, horizontally scrollable navigation and expandable filters. The map remains available while filters are closed. Base tiles are desaturated without altering application, boundary or construction layers.

## Verification

The existing CI workflow passed all 17 model/data tests and browser smoke checks for filters, map modes, linked charts, comparison, downloads and keyboard focus. Automated axe checks found zero violations on the explorer, Vaughan and findings pages at 1,440 px, 390 px and 320 px. No horizontal document overflow was detected at those test widths. Automated checks do not replace a complete manual accessibility audit.

Desktop visual review confirmed the opening layout. A direct preview interaction filtered Markham to 1,236 records, opened application evidence and added it to the comparison.

Site capacity remains unverified. Application counts, service references and construction proximity must not be interpreted as available capacity or confirmed connections.
