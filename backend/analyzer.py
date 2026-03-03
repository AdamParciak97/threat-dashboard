import os, json
from anthropic import Anthropic
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
client = Anthropic(timeout=600.0)


def analyze_threats(logs: list, stats: dict) -> str:
    today = datetime.now().strftime("%d.%m.%Y")
    prompt = f"""Jestes ekspertem cyberbezpieczenstwa i inzynierem Palo Alto Networks. Dzisiaj {today}.
Przeanalizuj zdarzenia bezpieczenstwa i wygeneruj raport Threat Intelligence.

STATYSTYKI ({len(logs)} zdarzen):
{json.dumps(stats, indent=2, ensure_ascii=False)}

PROBKA ZDARZEN:
{json.dumps(logs[:150], indent=2, ensure_ascii=False)}

## 1. PODSUMOWANIE ZAGROZEN
## 2. KRYTYCZNE ZAGROZENIA
## 3. TOP ATAKUJACE IP - REKOMENDACJE (ZABLOKUJ NATYCHMIAST / MONITORUJ / IGNORUJ)
## 4. WZORCE ATAKOW
## 5. REKOMENDACJE DLA FIREWALLA
## 6. OCENA RYZYKA (KRYTYCZNY/WYSOKI/SREDNI/NISKI)

Formatuj w Markdown. Badz konkretny i techniczny."""

    msg = client.messages.create(model="claude-opus-4-6", max_tokens=8192,
                                  messages=[{"role": "user", "content": prompt}])
    return msg.content[0].text


def generate_ioc_xml(logs: list, stats: dict) -> str:
    prompt = f"""Jestes ekspertem Palo Alto Networks. Wygeneruj TYLKO czysty XML PAN-OS (bez tekstu przed/po) do blokowania zlosliwych IP.

TOP ATAKUJACE IP: {json.dumps(stats.get('top_src_ips', [])[:20], indent=2)}
PROBKA: {json.dumps(logs[:100], indent=2, ensure_ascii=False)}

Format:
<config><devices><entry name="localhost.localdomain"><vsys><entry name="vsys1">
<address>
  <entry name="THREAT-IP-1"><ip-netmask>X.X.X.X/32</ip-netmask><description>Threat: NAZWA Count: N</description></entry>
</address>
<address-group>
  <entry name="BLOCKED-THREAT-IPs"><static><member>THREAT-IP-1</member></static></entry>
</address-group>
<rulebase><security><rules>
  <entry name="BLOCK-THREAT-IPs">
    <from><member>any</member></from><to><member>any</member></to>
    <source><member>BLOCKED-THREAT-IPs</member></source>
    <destination><member>any</member></destination>
    <application><member>any</member></application>
    <service><member>any</member></service>
    <action>deny</action><log-end>yes</log-end>
    <description>Blokada zlosliwych IP - Threat Dashboard</description>
  </entry>
</rules></security></rulebase>
</entry></vsys></entry></devices></config>"""

    msg = client.messages.create(model="claude-opus-4-6", max_tokens=4096,
                                  messages=[{"role": "user", "content": prompt}])
    r = msg.content[0].text.strip()
    if "<config>" in r:
        return r[r.index("<config>"):r.rindex("</config>") + len("</config>")]
    return r
