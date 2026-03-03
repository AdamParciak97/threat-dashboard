import requests, os, urllib3, time
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timedelta
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()

PA_HOST = os.getenv("PA_HOST")
PA_API_KEY = os.getenv("PA_API_KEY")


def fetch_logs(log_type="threat", max_logs=1000, hours=24):
    url = f"{PA_HOST}/api/"
    time_from = (datetime.now() - timedelta(hours=hours)).strftime("%Y/%m/%d %H:%M:%S")
    response = requests.get(url, params={
        "type": "log", "log-type": log_type, "key": PA_API_KEY,
        "nlogs": max_logs, "query": f"(receive_time geq '{time_from}')"
    }, verify=False)
    job_id = ET.fromstring(response.text).findtext(".//job")
    if not job_id:
        return []
    print(f"Job ID: {job_id} ({log_type})")
    for i in range(20):
        time.sleep(2)
        result = requests.get(url, params={
            "type": "log", "action": "get", "job-id": job_id, "key": PA_API_KEY
        }, verify=False)
        root = ET.fromstring(result.text)
        print(f"Status ({i+1}/20): {root.findtext('.//status')}")
        if root.findtext(".//status") == "FIN":
            return parse_logs(result.text)
    return []


def parse_logs(xml_text):
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    logs = []
    for e in root.findall(".//entry"):
        logs.append({
            "time": e.findtext("receive_time", ""),
            "src_ip": e.findtext("src", ""),
            "dst_ip": e.findtext("dst", ""),
            "src_country": e.findtext("srcloc", ""),
            "dst_country": e.findtext("dstloc", ""),
            "threat_name": e.findtext("threatid", ""),
            "threat_category": e.findtext("category", ""),
            "severity": e.findtext("severity", ""),
            "action": e.findtext("action", ""),
            "application": e.findtext("app", ""),
            "src_zone": e.findtext("from", ""),
            "dst_zone": e.findtext("to", ""),
            "rule": e.findtext("rule", ""),
            "direction": e.findtext("direction", ""),
        })
    return logs


def get_threat_stats(logs):
    timeline = Counter()
    for l in logs:
        t = l.get("time", "")
        if len(t) >= 13:
            timeline[t[:13]] += 1
    return {
        "total": len(logs),
        "top_src_ips": [{"ip": ip, "count": c} for ip, c in Counter(l["src_ip"] for l in logs if l["src_ip"]).most_common(15)],
        "top_threats": [{"name": n, "count": c} for n, c in Counter(l["threat_name"] for l in logs if l["threat_name"]).most_common(10)],
        "top_countries": [{"country": c, "count": cnt} for c, cnt in Counter(l["src_country"] for l in logs if l["src_country"]).most_common(10)],
        "severities": dict(Counter(l["severity"] for l in logs)),
        "categories": [{"category": cat, "count": c} for cat, c in Counter(l["threat_category"] for l in logs if l["threat_category"]).most_common(10)],
        "actions": dict(Counter(l["action"] for l in logs)),
        "timeline": [{"hour": k, "count": v} for k, v in sorted(timeline.items())],
    }


def get_all_threats(max_logs=1000, hours=24):
    all_logs = fetch_logs("threat", max_logs, hours) + fetch_logs("vulnerability", max_logs // 2, hours)
    seen, unique = set(), []
    for l in all_logs:
        key = f"{l['time']}{l['src_ip']}{l['threat_name']}"
        if key not in seen:
            seen.add(key)
            unique.append(l)
    return unique
