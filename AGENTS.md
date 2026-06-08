# WareraiMUTracker – AGENTS.md

## Projektübersicht
Client-seitiges React-Dashboard für WarEra.io. Liest Daten aus konfigurierten Military Units (MUs) via `@wareraprojects/api` und zeigt Member-Skills, Health, Damage, Buff/Debuff an.

## Techstack
- **Runtime:** Node.js (ESM)
- **Frontend:** React 19 + Vite 8
- **API:** `@wareraprojects/api` (tRPC-Client)
- **Hosting:** GitHub Pages (via GitHub Actions)
- **Styling:** Custom CSS (Dark Theme)

## Projektstruktur
```
WareraiMUTracker/
├── .env                       # WARERA_API_KEY, GITHUB_TOKEN (lokal)
├── .gitignore
├── .github/workflows/
│   └── deploy.yml             # Build + Deploy → GitHub Pages
├── AGENTS.md
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── config.js              # MU-IDs + Gateway-URL
    └── components/
        ├── apiwrapper.js
        ├── datahandler.js
        ├── tokenhandler.jsx
        ├── tokenhandler.css
        ├── groupedgrid.jsx
        ├── groupedgrid.css
        ├── mudashboard.jsx
        └── mudashboard.css
```

## Konfiguration

### MU-IDs
In `src/config.js` werden die zu trackenden Military Units als Array hinterlegt:
```js
export const MU_IDS = ["id1", "id2", ...];
```

### API-Key
Wird vom Benutzer auf der Website eingegeben und in `localStorage` gespeichert.

### Gateway
Primär: `https://gateway.warerastats.io/trpc/`
Fallback: `https://api2.warera.io/trpc/`

## Wichtige Befehle
```bash
npm run dev      # Entwicklungsserver
npm run build    # Production-Build nach dist/
npm run preview  # Build lokal previewen
npm run lint     # ESLint
```

## Datenfluss
1. Benutzer öffnet Seite → gibt API-Key ein
2. DataHandler lädt MU-IDs aus config.js
3. Für jede MU: `client.mu.getById()` → Member-IDs
4. Für jeden Member: `client.user.getUserLite()` → Skills, Rankings, Health
5. Gateway als bevorzugter Endpunkt nutzen

## MU-ID aus der Spiel-URL
Die MU-ID ist der letzte Teil der URL:
`https://app.warera.io/mu/5f8d8b7c9a1e4b3c2d1f0a1b`
→ `5f8d8b7c9a1e4b3c2d1f0a1b`
