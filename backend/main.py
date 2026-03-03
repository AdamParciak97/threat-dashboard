from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from paloalto_threats import get_all_threats, get_threat_stats
from analyzer import analyze_threats, generate_ioc_xml
from database import save_analysis, get_all_analyses, get_analysis_by_id
from datetime import datetime

app = FastAPI(title="Threat Intelligence Dashboard")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/threats/stats")
def fetch_stats(hours: int = Query(24), max_logs: int = Query(1000)):
    try:
        logs = get_all_threats(max_logs=max_logs, hours=hours)
        return get_threat_stats(logs)
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get("/threats/logs")
def fetch_logs(hours: int = Query(24), max_logs: int = Query(1000),
               severity: str = Query(None), src_ip: str = Query(None), category: str = Query(None)):
    try:
        logs = get_all_threats(max_logs=max_logs, hours=hours)
        if severity: logs = [l for l in logs if severity.lower() in l.get("severity","").lower()]
        if src_ip:   logs = [l for l in logs if src_ip in l.get("src_ip","")]
        if category: logs = [l for l in logs if category.lower() in l.get("threat_category","").lower()]
        return {"count": len(logs), "logs": logs}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get("/analyze")
def run_analysis(hours: int = Query(24), max_logs: int = Query(1000)):
    try:
        logs = get_all_threats(max_logs=max_logs, hours=hours)
        stats = get_threat_stats(logs)
        report = analyze_threats(logs, stats)
        time_range = f"Ostatnie {hours}h"
        aid = save_analysis(len(logs), time_range, report, stats)
        return {"id": aid, "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "logs_count": len(logs), "time_range": time_range, "stats": stats, "report": report}
    except Exception as e:
        import traceback; print(traceback.format_exc())
        raise HTTPException(500, detail=str(e))


@app.get("/export/ioc-xml")
def export_ioc(hours: int = Query(24), max_logs: int = Query(1000)):
    try:
        logs = get_all_threats(max_logs=max_logs, hours=hours)
        stats = get_threat_stats(logs)
        xml = generate_ioc_xml(logs, stats)
        return Response(content=xml, media_type="application/xml",
                        headers={"Content-Disposition": "attachment; filename=threat-block-rules.xml"})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(500, detail=str(e))


@app.get("/analyses")
def list_analyses():
    try:
        return [{"id": r.id, "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                 "logs_count": r.logs_count, "time_range": r.time_range,
                 "critical": r.critical, "high": r.high, "medium": r.medium}
                for r in get_all_analyses()]
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@app.get("/analyses/{aid}")
def get_analysis(aid: int):
    try:
        r = get_analysis_by_id(aid)
        if not r: raise HTTPException(404, detail="Nie znaleziono")
        return {"id": r.id, "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "logs_count": r.logs_count, "time_range": r.time_range, "report": r.report}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(500, detail=str(e))
