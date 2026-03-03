# 🔴 Threat Intelligence Dashboard

AI-powered analiza zagrożeń sieciowych z firewalla Palo Alto Networks z automatycznym generowaniem raportów i reguł blokowania.

## 📸 Funkcjonalności

- **🛡️ Dashboard** — statystyki zagrożeń w czasie rzeczywistym (krytyczne, wysokie, średnie)
- **📈 Timeline** — wykres zagrożeń per godzina
- **🎯 Top Atakujące IP** — ranking hostów z największą liczbą ataków
- **📊 Wykresy** — top zagrożenia, kraje źródłowe, poziomy ryzyka, kategorie
- **📋 Zdarzenia** — tabela zdarzeń z filtrowaniem po severity, IP, kategorii
- **🤖 Raport AI** — pełna analiza zagrożeń przez Claude AI z rekomendacjami blokowania
- **🚫 Eksport IOC XML** — generuje reguły blokowania złośliwych IP w formacie PAN-OS gotowe do importu na firewall
- **📄 Eksport PDF** — raport w formacie PDF
- **📁 Historia analiz** — wszystkie poprzednie analizy z liczbą zagrożeń krytycznych/wysokich
- **🌙 Dark / Light mode**

## 🛠️ Stack technologiczny

|Warstwa |Technologia                           |
|--------|--------------------------------------|
|Backend |Python, FastAPI, SQLAlchemy, SQLite   |
|AI      |Anthropic Claude API (claude-opus-4-6)|
|Frontend|React, Vite, Tailwind CSS, Recharts   |
|Firewall|Palo Alto PAN-OS Log API              |

## 📁 Struktura projektu

```
threat-dashboard/
├── backend/
│   ├── main.py               # FastAPI endpoints
│   ├── paloalto_threats.py   # Pobieranie i parsowanie Threat/Vuln Logs
│   ├── analyzer.py           # Integracja Claude AI + generowanie XML
│   ├── database.py           # SQLAlchemy ORM - historia analiz
│   ├── .env                  # Konfiguracja (nie commitować!)
│   ├── .env.example          # Szablon konfiguracji
│   └── requirements.txt
└── frontend/
    └── src/
        └── App.jsx           # Kompletny UI React
```

## ⚙️ Instalacja i uruchomienie

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplikacja dostępna na: **http://localhost:5173**
API dostępne na: **http://localhost:8000/docs**

## 🔑 Konfiguracja

Stwórz plik `backend/.env` na podstawie `.env.example`:

```env
PA_HOST=https://<ADRES_FIREWALL>
PA_API_KEY=<KLUCZ_API_PALO_ALTO>
ANTHROPIC_API_KEY=<KLUCZ_API_CLAUDE>
```

### Jak uzyskać klucze

**Palo Alto API Key:**

```
GET https://<firewall>/api/?type=keygen&user=<user>&password=<password>
```

Lub w GUI: **Device → Administrators → Generate API Key**

**Anthropic API Key:**
Zarejestruj się na [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

## 🔌 Endpointy API

|Endpoint             |Opis                                |
|---------------------|------------------------------------|
|`GET /threats/stats` |Statystyki zagrożeń                 |
|`GET /threats/logs`  |Logi z filtrowaniem                 |
|`GET /analyze`       |Pełna analiza AI + zapis do bazy    |
|`GET /export/ioc-xml`|Generuje XML PAN-OS do blokowania IP|
|`GET /analyses`      |Lista historii analiz               |
|`GET /analyses/{id}` |Szczegóły analizy                   |

## 📤 Import reguł na Palo Alto

Po wygenerowaniu IOC XML zaimportuj przez:

**Device → Setup → Operations → Import Named Configuration Snapshot**

Lub przez Panorama → **Commit and Push**.

## 📦 Wymagania

```
fastapi
uvicorn
requests
python-dotenv
anthropic
sqlalchemy
```

## 👤 Autor

**Adam Parciak** — [github.com/AdamParciak97](https://github.com/AdamParciak97)
