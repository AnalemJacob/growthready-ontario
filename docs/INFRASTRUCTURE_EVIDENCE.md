# Infrastructure evidence register

## Source verification

The eight records in `assets/data/infrastructure-projects.json` were checked against the official York pages linked in each record. The primary construction page is https://www.york.ca/environment/water-and-wastewater/water-and-wastewater-construction-projects ; West Vaughan uses https://www.york.ca/westvaughan . The embedded `checked_at_utc` is retrieval time, not the publisher's last-update date.

Store each published forecast as text and a grouping year. Season-level dates are not converted into invented day/month values. Commissioning and application dependency are explicitly unverified. Purpose categories are portfolio interpretations of project descriptions, not engineering classifications. Retain the original source-section title to make checking straightforward. Dates should be rechecked before using them in current decisions.

## Map references

References use the original construction snapshot, identified by geometry class and OBJECTID. IDs overlap between the point and line layers, so ID alone is insufficient. West Vaughan references line IDs 2 and 3; the Markham Highway 7 watermain references line ID 6 (MultiLineString). Source project names and descriptions were matched manually. These are contextual works geometries, not complete project extents or inferred dependencies. Source refreshes must revalidate the matches; automated tests check the West Vaughan names.

No geocoded placeholders or buffers are generated for the other projects. No site-level capacity number or readiness score is introduced. No service-area polygon is included.

## Review scope

The evidence set supports browsing published projects near the planning discussion at municipality level. It cannot prove that any particular application depends on, is delayed by, or can connect after a listed infrastructure project.
