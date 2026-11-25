"""Refresh the public-data foundation for GrowthReady Ontario.

Python 3 standard library only. Run from any directory. Source rows are application
features, not unique projects, parcels, housing approvals, or infrastructure capacity.
"""
import collections
import concurrent.futures
import datetime
import hashlib
import json
import math
import pathlib
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
DEV = "https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/DevelopmentApplicationStatusAndTeams/MapServer/0"
MUN = "https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/Boundary/MapServer/1"
FIELDS = ["objectid", "APPL_GISID", "APPL_NAME", "APPL_DESC", "APPL_TYPE", "APPL_SUBTYPE", "APPL_STATUS", "APPL_STAGE", "ADDRESS", "MUN_NAME", "UNITS", "DATE_RECVD", "REG_FILE_NUM", "PARENTID", "Application_Name__c", "Application_Status__c", "Application_Type__c", "Application_Subtype__c", "Date_Received__c", "Name", "LANDUSE_DESIG", "EMPAREA", "GREENBELT", "ORM", "SIGWETLAND", "SIGWOODLAND", "SEWERSHED", "WSERVAREA", "WWSERVAREA", "WMAIN", "WWMAIN", "WWWCAPPLAN", "WELLPROAREA", "WHPAQ", "MOD_DATE"]

def get(url, params=None):
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "GrowthReadyOntario/0.1 (public data research)"})
    with urllib.request.urlopen(req, timeout=90) as response:
        obj = json.load(response)
    if "error" in obj:
        raise RuntimeError(obj["error"])
    return obj

def write(name, obj):
    DATA.mkdir(exist_ok=True)
    dest = DATA / name
    dest.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
    return hashlib.sha256(dest.read_bytes()).hexdigest()

def fetch_features(url, fields="*"):
    meta = get(url, {"f": "json"})
    oid = meta.get("objectIdField") or next(v["name"] for v in meta["fields"] if v["type"] == "esriFieldTypeOID")
    if fields != "*":
        available = {v["name"].lower(): v["name"] for v in meta["fields"]}
        # Joined MapServers expose a virtual ESRI_OID that may be queryable via
        # objectIds but cannot be requested explicitly in GeoJSON outFields.
        output_oid = [] if oid == "ESRI_OID" else [oid]
        fields = ",".join(dict.fromkeys(output_oid + [available[v.lower()] for v in fields.split(",") if v.lower() in available]))
    ids = sorted(get(url + "/query", {"f": "json", "where": "1=1", "returnIdsOnly": "true"}).get("objectIds", []))
    # Joined MapServers may reject explicit virtual ESRI_OID selection and some
    # objectIds requests. Partition by the physical OBJECTID instead, using the
    # returned transfer-limit flag so no truncated response is accepted.
    split_field = next((v["name"] for v in meta["fields"] if v["name"].upper() == "OBJECTID"), oid)
    def fetch_partition(where, depth=0):
        result = get(url + "/query", {"f": "geojson", "where": where, "outFields": fields, "outSR": 4326, "returnGeometry": "true"})
        rows = result["features"]
        exceeded = result.get("exceededTransferLimit") or result.get("properties", {}).get("exceededTransferLimit")
        if not exceeded:
            return rows
        vals = sorted({v["properties"][split_field] for v in rows})
        if depth > 30 or len(vals) < 2:
            raise RuntimeError("Unable to partition a truncated response safely.")
        midpoint = vals[len(vals)//2]
        return fetch_partition(f"({where}) AND {split_field} <= {midpoint}", depth+1) + fetch_partition(f"({where}) AND {split_field} > {midpoint}", depth+1)
    features = fetch_partition("1=1")
    actual = [v["properties"].get(oid, v.get("id")) for v in features]
    meta["queriedObjectIdDuplicates"] = len(ids) - len(set(ids))
    if len(features) != len(ids):
        raise RuntimeError(f"Record count mismatch: requested source lists {len(ids)} records; obtained {len(features)}. Snapshot may have changed.")
    if oid != "ESRI_OID" and len(set(ids)) != len(ids):
        raise RuntimeError("Duplicate nonvirtual source object IDs.")
    if oid != "ESRI_OID" and len(set(actual)) != len(ids):
        raise RuntimeError("Duplicate returned source object IDs.")
    return meta, {"type": "FeatureCollection", "features": features}

def present(v):
    return v is not None and str(v).strip() != ""

def audit(meta, geo):
    props = [{k.lower(): v for k, v in f["properties"].items()} for f in geo["features"]]
    checks = {}
    for key in FIELDS:
        if key in {"APPL_DESC", "ADDRESS", "APPL_NAME"}:
            continue
        counter = collections.Counter(str(v.get(key.lower())) for v in props if present(v.get(key.lower())))
        checks[key] = {"nonblank_records": sum(counter.values()), "distinct_nonblank_values": len(counter), "common_values": counter.most_common(8)}
    keys = [(v.get("objectid"),v.get("appl_gisid"),v.get("reg_file_num")) for v in props]
    invalid_positions = 0
    unclosed_rings = 0
    xs, ys = [], []
    for feature in geo["features"]:
        geometry = feature.get("geometry")
        if not geometry:
            continue
        polygons = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"] if geometry["type"] == "MultiPolygon" else []
        for polygon in polygons:
            for ring in polygon:
                unclosed_rings += int(len(ring) < 4 or ring[0] != ring[-1])
                for position in ring:
                    x, y = position[:2]
                    if not (math.isfinite(x) and math.isfinite(y) and -180 <= x <= 180 and -90 <= y <= 90):
                        invalid_positions += 1
                    xs.append(x); ys.append(y)
    geometry_checks = {"coordinate_reference": "EPSG:4326 requested from source", "invalid_lon_lat_positions": invalid_positions, "unclosed_or_short_rings": unclosed_rings, "bounds": [min(xs),min(ys),max(xs),max(ys)] if xs else None, "limitation": "Basic structural checks only; self-intersection, topology, and positional accuracy still require GIS assessment."}
    return {"retrieved_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(), "source": DEV, "source_editing_info": meta.get("editingInfo"), "source_virtual_oid_duplicate_rows": meta.get("queriedObjectIdDuplicates",0), "feature_count": len(props), "features_with_geometry": sum(bool(v.get("geometry")) for v in geo["features"]), "distinct_business_keys": len(set(keys)), "duplicate_business_key_rows": len(keys)-len(set(keys)), "geometry_checks": geometry_checks, "field_profile": checks, "status_field_disagreements": sum(v.get("appl_status") != v.get("application_status__c") for v in props), "interpretation": "UNITS contains Yes/No flags in the inspected sources; it is not a housing-unit count. Service-area references are not available capacity. Application features can overlap and duplicate projects. A missing source edit date must not be replaced by retrieval time."}

def main():
    meta, geo = fetch_features(DEV, ",".join(FIELDS))
    hashes = {"development_applications.geojson": write("development_applications.geojson", geo), "development_schema.json": write("development_schema.json", {"fields": meta["fields"], "source": DEV, "editingInfo": meta.get("editingInfo"), "description": meta.get("description")})}
    report = audit(meta, geo)
    report["supporting_layers"] = {}
    supports = {"municipal_boundaries": MUN, "water_wastewater_construction_lines": "https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/ActiveConstruction/MapServer/2", "water_wastewater_construction_points": "https://ww8.yorkmaps.ca/arcgis/rest/services/OpenData/ActiveConstruction/MapServer/3"}
    for label, url in supports.items():
        try:
            sm, sg = fetch_features(url)
            name = label + ".geojson"
            hashes[name] = write(name, sg)
            report["supporting_layers"][label] = {"source": url, "feature_count": len(sg["features"])}
        except Exception as exc:
            report["supporting_layers"][label] = {"source": url, "error": str(exc)}
    report["sha256"] = hashes
    write("data_audit.json", report)
    print(json.dumps({k: v for k, v in report.items() if k != "field_profile"}, indent=2))
    print(json.dumps({k: report["field_profile"][k] for k in ["MUN_NAME", "UNITS", "SEWERSHED", "WSERVAREA", "WWSERVAREA", "Application_Status__c", "APPL_STATUS", "Application_Type__c", "APPL_TYPE"]}, indent=2))

if __name__ == "__main__":
    main()
