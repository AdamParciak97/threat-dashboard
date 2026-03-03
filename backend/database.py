from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

engine = create_engine("sqlite:///threats.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class ThreatRecord(Base):
    __tablename__ = "threats"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.now)
    logs_count = Column(Integer)
    critical = Column(Integer, default=0)
    high = Column(Integer, default=0)
    medium = Column(Integer, default=0)
    time_range = Column(String)
    report = Column(Text)


Base.metadata.create_all(bind=engine)


def save_analysis(logs_count, time_range, report_text, stats):
    db = SessionLocal()
    sev = stats.get("severities", {})
    record = ThreatRecord(
        logs_count=logs_count, time_range=time_range, report=report_text,
        critical=sev.get("critical", 0), high=sev.get("high", 0), medium=sev.get("medium", 0)
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    db.close()
    return record.id


def get_all_analyses():
    db = SessionLocal()
    records = db.query(ThreatRecord).order_by(ThreatRecord.timestamp.desc()).all()
    db.close()
    return records


def get_analysis_by_id(aid):
    db = SessionLocal()
    r = db.query(ThreatRecord).filter(ThreatRecord.id == aid).first()
    db.close()
    return r
