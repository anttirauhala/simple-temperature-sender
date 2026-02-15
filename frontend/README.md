# Temperature Dashboard - Frontend

React-sovellus lämpötilan ja kosteuden seurantaan ESP32-C3 SHT30 -sensorilta.

## Ominaisuudet

- 📊 Reaaliaikaiset graafiset kuvaajat lämpötilalle ja kosteudelle
- 📅 Näyttää kuluvalta päivältä kaikki mittaukset
- 🔄 Automaattinen päivitys 5 minuutin välein
- 📱 Responsiivinen suunnittelu (desktop & mobile)
- 🎨 Modernit Recharts-kuvaajat

## Teknologiat

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Recharts** - Charting library
- **date-fns** - Date formatting

## Asennus

### 1. Asenna riippuvuudet

```bash
cd frontend
npm install
```

### 2. Konfiguroi API URL

Kopioi `.env.example` → `.env`:

```bash
cp .env.example .env
```

Muokkaa `.env` tiedostoa ja aseta API Gateway URL (saat CDK deployauksen jälkeen):

```env
VITE_API_URL=https://YOUR_API_ID.execute-api.eu-west-1.amazonaws.com/prod
```

### 3. Käynnistä kehityspalvelin

```bash
npm run dev
```

Sovellus käynnistyy osoitteessa: http://localhost:3000

## Rakentaminen tuotantoon

```bash
npm run build
```

Build-tiedostot löytyvät `dist/` kansiosta.

## API-endpointit

Frontend odottaa seuraavan API-endpointin:

### GET /measurements

Hakee mittaukset tietyltä aikaväliltä.

**Query Parameters:**
- `startTime` (optional): Unix timestamp millisekunteina. Oletus: tämän päivän keskiyö.

**Response:**
```json
{
  "measurements": [
    {
      "device_id": "SimpleTemperatureSender-ESP32-C3-supermini-1",
      "timestamp": 1707955200000,
      "temperature": 23.5,
      "humidity": 45.2
    }
  ],
  "count": 1,
  "startTime": 1707955200000,
  "deviceId": "SimpleTemperatureSender-ESP32-C3-supermini-1"
}
```

## Projektirakennen

```
frontend/
├── src/
│   ├── components/
│   │   ├── TemperatureChart.tsx  # Lämpötilakuvaaja
│   │   └── HumidityChart.tsx     # Kosteuskuvaaja
│   ├── App.tsx                   # Pääkomponentti
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tyylit
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Kehitys

### Hot Module Replacement (HMR)

Vite tukee HMR:ää - muutokset näkyvät välittömästi selaimessa ilman sivun latausta.

### TypeScript

Projekti käyttää strict-tilaa. Type-tarkistukset tehdään automaattisesti.

## Deployment

Sovelluksen voi deployata:
- **AWS S3 + CloudFront** (suositus)
- **Vercel**
- **Netlify**
- Mikä tahansa staattinen hosting

Muista päivittää CORS-asetukset API Gatewayssä deployment-URLin mukaan.

## Ympäristömuuttujat

- `VITE_API_URL` - API Gateway base URL (ilman `/measurements`)

## Tuki

Lisätietoja backend-setupista: [../cdk/README.md](../cdk/README.md)
