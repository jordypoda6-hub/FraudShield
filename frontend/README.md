# FraudShield v5 — avec vrai modèle RF

## Structure

```
fraud-v5/
├── backend/
│   ├── app.py                  ← serveur Flask
│   ├── requirements.txt
│   ├── modele_rf.pkl           ← copier ici
│   ├── scaler_robust.pkl       ← copier ici
│   └── feature_names.json      ← copier ici
└── src/                        ← React frontend
```

## Étape 1 — Copier tes fichiers dans backend/
modele_rf.pkl + scaler_robust.pkl + feature_names.json → fraud-v5/backend/

## Étape 2 — Démarrer Flask
```bash
cd fraud-v5/backend
pip install -r requirements.txt
python app.py
```

## Étape 3 — Démarrer React (autre terminal)
```bash
cd fraud-v5
npm install
npm run dev
```
→ http://localhost:5173

## Comportement
- Flask démarré → badge vert "Modèle RF actif" → vrai modèle RF
- Flask absent  → badge orange "Mode simulation" → scoring local approché

## Pipeline
Transaction → Flask: engineer_features() → scaler.transform() → rf.predict_proba() → score + verdict
