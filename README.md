# IactaQuaestio

Web aplikacija za upload i analizu ispitnih testova (slike, PDF-ovi, Word dokumenti). Korisnici mogu da postave testove, koji se obrađuju pomoću OCR-a da bi se izvukla pitanja. Sistem analizira učestalost pojavljivanja pitanja na testovima kako bi pomogao studentima da identifikuju često ponavljana pitanja.

## Sadržaj

- [Tehnologije](#tehnologije)
- [Preduslovi](#preduslovi)
- [Instalacija](#instalacija)
- [Konfiguracija](#konfiguracija)
- [Pokretanje](#pokretanje)
- [Struktura Projekta](#struktura-projekta)

## Tehnologije

**Frontend:** React 19, TypeScript/JSX, React Router, Axios

**Backend:** FastAPI (Python), async/await

**Baza:** MongoDB sa Beanie ODM

**OCR:** OpenCV, Tesseract OCR, PyMuPDF

## Preduslovi

Potrebno je da imate instalirano:

- **Node.js** (v16 ili noviji)
- **npm** (v8 ili noviji)
- **Python** (v3.8 ili noviji)
- **Tesseract OCR** ([Download](https://github.com/tesseract-ocr/tesseract))

## Instalacija

### 1. Kloniranje Repozitorijuma

```bash
git clone <repository-url>
cd IactaQuaestio
```

### 2. Instalacija Frontend Zavisnosti

```bash
cd client
npm install
```

### 3. Instalacija Backend Zavisnosti

```bash
cd ../server
python -m venv .venv
source .venv/bin/activate  # Na Windows-u: .venv\Scripts\activate(ili activate.bat)
pip install -r requirements.txt
```

## Konfiguracija

### Backend Konfiguracija

Kreirajte `.env` fajl u `server/` direktorijumu:

```env
MONGO_USER=<username>
MONGO_PASSWORD=<password>
MONGO_HOST=<cluster>.mongodb.net
MONGO_DB_NAME=<database_name>
MONGO_APP_NAME=<app_name>
```

**Napomena:** Zamenite ove vrednosti sa vašim MongoDB podacima za pristup

### CORS Konfiguracija

Backend dozvoljava konekcije sa portova 3000 i 1739. Ako menjate portove, ažurirajte `origins` listu u `server/app/main.py`:

```python
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:1739",
    "http://127.0.0.1:1739",
]
```

## Pokretanje

### 1. Pokretanje Backend Servera

```bash
cd server
source .venv/bin/activate  # Na Windows: .venv\Scripts\activate
python -m app.run
```

Server će se pokrenuti na portu 1739 sa hot reload-om. Očekivani output:
```
INFO:     Uvicorn running on http://127.0.0.1:1739
INFO:     MongoDB connection successful
```

### 2. Pokretanje Frontend-a

U novom terminalu:

```bash
cd client
npm start
```

Aplikacija će se otvoriti na `http://localhost:3000`

### 3. Inicijalizacija Baze (Prvi Put)

Backend će automatski kreirati potrebne indekse u MongoDB-u pri prvom pokretanju, a nakon toga osigurava željenu strukturu.

## Struktura Projekta

```
IactaQuaestio/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React komponente
│   │   │   ├── HomePage.tsx
│   │   │   ├── AuthForm.tsx
│   │   │   ├── UploadTest.tsx
│   │   │   ├── SearchTests.tsx
│   │   │   └── AdminPanel.tsx
│   │   └── services/    # API servisi
│   └── package.json
│
└── server/              # FastAPI backend
    ├── app/
    │   ├── main.py      # Aplikacioni entry point
    │   ├── database.py  # MongoDB konekcija
    │   ├── models/      # Beanie modeli
    │   └── routers/     # API endpoint-i
    ├── processing/
    │   └── text_extraction.py  # OCR logika
    └── requirements.txt
```

## Glavne Funkcionalnosti

### OCR Processing Pipeline

1. **Detekcija tipa fajla**: Podrška za PDF, JPG, PNG, TIFF, BMP, WEBP
2. **PDF obrada**: Ekstrakcija teksta ili renderovanje stranica u slike za OCR
3. **Image preprocessing**: Detekcija papira, auto-cropping, binary thresholding
4. **OCR**: Tesseract sa srpskim (`srp`) i engleskim (`eng`) jezikom
5. **Ekstrakcija pitanja**: Regex-based parsiranje za identifikaciju numerisanih pitanja

### Analiza Učestalosti Pitanja

Endpoint `/analyze/{subject_code}` koristi `difflib.SequenceMatcher` za grupisanje sličnih pitanja:
- Default threshold: 0.85 (85% sličnost)
- Vraća frekventnost i listu ispitnih rokova gde se pitanje pojavilo

### Autentifikacija

- JWT tokeni sačuvani u localStorage
- Protected route proveravaju token i opciono `is_admin` flag
- Backend validira tokene iz `Authorization: Bearer <token>` header-a

## API Endpoints

**Tests** (`/tests`):
- `POST /`: Upload test fajla → OCR ekstrakcija → čuvanje
- `GET /find`: Pretraga testova sa filterima
- `GET /analyze/{subject_code}`: Analiza učestalosti pitanja

**Subjects** (`/subjects`):
- CRUD operacije za predmete

**Faculties** (`/faculties`):
- CRUD operacije za fakultete i module

**Users** (`/users`):
- Registracija i login
- Admin operacije

## Rešavanje Problema

**Backend se ne pokreće:**
- Proverite `.env` podatke za MongoDB
- Proverite da je Tesseract OCR instaliran
- Proverite da je port 1739 dostupan

**Frontend ne može da se konektuje:**
- Proverite da je backend pokrenut na portu 1739
- Proverite CORS podešavanja u `main.py`

**OCR ne radi:**
- Proverite instalaciju Tesseract-a: `tesseract --version`
- Proverite da su instalirani srpski i engleski jezici
- Linux: `sudo apt-get install tesseract-ocr-srp`
- Windows: Instalirajte srpski language pack

**Problemi sa bazom:**
- Proverite MongoDB podatke za pristup u `.env`
- Proverite da je MongoDB instanca dostupna
- Proverite mrežnu konekciju do MongoDB cluster-a
