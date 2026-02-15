# Frontend Dashboard - Quick Start

## Esikatselu

React-sovellus näyttää lämpötilan ja kosteuden graafiset kuvaajat kuluvalta päivältä.

## Käynnistys

### 1. Deploy AWS Infrastructure (ensimmäisellä kerralla)

```bash
cd cdk
npm install
cd lambda
npm install
cd ..
cdk deploy
```

Kopioi talteen `ApiUrl` outputista!

### 2. Frontend Setup

```bash
cd frontend
npm install

# Luo .env tiedosto
cp .env.example .env

# Muokkaa .env ja aseta API URL:
# VITE_API_URL=https://YOUR_API_ID.execute-api.eu-west-1.amazonaws.com/prod
```

### 3. Käynnistä Dashboard

```bash
npm run dev
```

Avaa selaimella: http://localhost:3000

## Mitä näet?

- 🌡️ **Lämpötilakuvaaja** - Lämpötila celsius-asteina
- 💧 **Kosteuskuvaaja** - Ilmankosteus prosentteina
- 📊 **Reaaliaikaiset arvot** - Viimeisin mittaus näkyy suurena
- ⏰ **Aikaleima** - Milloin data lähetettiin
- 🔄 **Automaattinen päivitys** - 5 minuutin välein

## Testaaminen ilman ESP32:ta

Jos haluat testata dashboardia ennen kuin ESP32 lähettää dataa:

### Lisää testimittaus DynamoDB:hen (AWS Console)

1. Avaa AWS Console → DynamoDB → Tables → `temperature-measurements`
2. Luo uusi item:
   ```json
   {
     "device_id": "SimpleTemperatureSender-ESP32-C3-supermini-1",
     "timestamp": 1739567400000,
     "temperature": 22.5,
     "humidity": 48.3
   }
   ```

Tai käytä AWS CLI:

```bash
aws dynamodb put-item \
    --table-name temperature-measurements \
    --item '{
        "device_id": {"S": "SimpleTemperatureSender-ESP32-C3-supermini-1"},
        "timestamp": {"N": "'"$(date +%s)000"'"},
        "temperature": {"N": "22.5"},
        "humidity": {"N": "48.3"}
    }'
```

## Ongelmatilanteissa

### "Ei mittauksia tänään"

- Varmista että ESP32 on lähettänyt dataa
- Tarkista DynamoDB taulusta onko mittauksia
- Varmista että `device_id` on oikein

### "Yhteysvirhe"

- Tarkista että `.env` sisältää oikean API URL:n
- Varmista että CDK deploy onnistui
- Tarkista AWS Console → API Gateway että API on toiminnassa

### API ei vastaa

```bash
# Testaa API:a suoraan
curl https://YOUR_API_ID.execute-api.eu-west-1.amazonaws.com/prod/measurements
```

## Lisätietoja

- **ESP32 Setup**: [README.md](README.md)
- **AWS CDK**: [cdk/README.md](cdk/README.md)
- **Frontend**: [frontend/README.md](frontend/README.md)
