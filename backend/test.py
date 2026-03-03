from paloalto_threats import get_all_threats, get_threat_stats
import json

print("Pobieranie Threat Logs...")
logs = get_all_threats(max_logs=200, hours=24)
print(f"Pobrano {len(logs)} zdarzeń")

if logs:
    stats = get_threat_stats(logs)
    print(json.dumps(stats, indent=2, ensure_ascii=False))
else:
    print("Brak logów lub błąd połączenia")
