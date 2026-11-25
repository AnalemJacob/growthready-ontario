# Development-layer interpretation

Preserve source values. These descriptions explain how GrowthReady will use fields; they do not replace York's own definitions.

| Field | Initial use | Important qualification |
|---|---|---|
| `OBJECTID` | Physical source record identifier | Keep alongside the source URL and snapshot date |
| `ESRI_OID` | Server-generated identifier for a joined view | A duplicate was found in the source ID response; do not use alone as a permanent project key |
| `APPL_GISID` | Link application records to source geography | Check uniqueness and related records |
| `REG_FILE_NUM` | Search/display application reference | Different applications can refer to the same development |
| `PARENTID` | Candidate relationship between application records | Verify its semantics before grouping |
| `APPL_TYPE` / `application_type__C` | Source application classification | Alternative source fields may disagree |
| `APPL_STATUS` / `Application_Status__c` | Source review status | Neither field is a utility-capacity or growth-readiness assessment |
| `MUN_NAME` | Municipality label | Exclude or separately label records outside the pilot boundary |
| `APPL_DESC` | Supporting proposal description | Not a substitute for approvals or a consistent dwelling-count table |
| `UNITS` | Preserve original Yes/No source value | NOT a numeric dwelling count; flag semantics require confirmation |
| `WSERVAREA` | Source water-service-area reference | Nonblank text, including 'No', does not establish usable supply capacity |
| `WWSERVAREA` | Source wastewater-service-area reference | Does not establish allocation or spare treatment/network capacity |
| `SEWERSHED` | Source sewer catchment references | Text may list multiple areas; validate geography before joining |
| `WMAIN` / `WWMAIN` | Source attributes concerning utility infrastructure | Confirm definitions; do not turn a Yes flag into available capacity |
| `WWWCAPPLAN` | Source capital-plan-related flag | Does not identify a dependency or commissioning date by itself |
| `GREENBELT`, `ORM`, `SIGWETLAND`, `SIGWOODLAND` | Context flags for further review | Obtain current authoritative boundaries and policy interpretation before any permission conclusion |
| `DATE_RECVD`, `Date_Received__c` | Source application dates | Compare definitions and discrepancies; retain original date values |
| `MOD_DATE` | Record-level modification information | Not the publication time of the whole layer |

## Preferred display

Show separate evidence states: **documented**, **source reference only**, **conflicting**, **not yet reviewed**, and **not available**. Use plain labels explaining what was checked. Unknown and conflicting data must remain visible in maps and exported tables.
