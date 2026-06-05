from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import math
import os

app = Flask(__name__)

# ── CORS configuré selon l'environnement ──────────────────────
allow_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
    'https://fraud-shield-flame.vercel.app',  # domaine Vercel
]

CORS(app, origins=allow_origins, supports_credentials=True)

# En prod, ajouter les domaines Vercel
if os.getenv('FLASK_ENV') == 'production':
    vercel_domain = os.getenv('VERCEL_URL')  # ex: fraud-v5.vercel.app
    if vercel_domain:
        allow_origins.extend([
            f'https://{vercel_domain}',
            'https://fraud-v5.vercel.app',  # À adapter avec ton domaine
        ])

CORS(app, origins=allow_origins, supports_credentials=True)

# ── Chargement des fichiers ──────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))

scaler = joblib.load(os.path.join(BASE, 'scaler_robust.pkl'))
model  = joblib.load(os.path.join(BASE, 'modele_rf.pkl'))

with open(os.path.join(BASE, 'feature_names.json')) as f:
    FEATURES = json.load(f)

print(f"✅ Modèle chargé — {len(FEATURES)} features")
print(f"   Features : {FEATURES}")

# ── Seuils de décision ───────────────────────────────────────────
SEUIL_FRAUD   = 0.059   # seuil optimal coût métier (notebook 3)
SEUIL_SUSPECT = 0.020   # zone grise

# ── Ingénierie des features ──────────────────────────────────────
def engineer(tx: dict) -> dict:
    """
    Reçoit : V1-V28, amount (float), hour (int 0-23)
    Retourne : les 33 features dans l'ordre exact de feature_names.json
    """
    feats = {}

    # V1 à V28 — passés directement
    for i in range(1, 29):
        feats[f'V{i}'] = float(tx.get(f'V{i}', 0.0))

    # amount_log = log(amount + 1)
    amount = float(tx.get('amount', 0.0))
    feats['amount_log'] = math.log(amount + 1)

    # Encodage cyclique de l'heure
    hour = int(tx.get('hour', 0))
    feats['heure_sin'] = math.sin(2 * math.pi * hour / 24)
    feats['heure_cos'] = math.cos(2 * math.pi * hour / 24)

    # Tranche horaire : 0=nuit(0-5) 1=matin(6-11) 2=après-midi(12-17) 3=soir(18-23)
    if   hour < 6:   feats['tranche'] = 0
    elif hour < 12:  feats['tranche'] = 1
    elif hour < 18:  feats['tranche'] = 2
    else:            feats['tranche'] = 3

    # Flag montant nul
    feats['is_zero_amount'] = 1 if amount == 0 else 0

    return feats

# ── Routes ───────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':   'ok',
        'model':    'RandomForest',
        'features': len(FEATURES),
        'seuil':    SEUIL_FRAUD,
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        tx = request.get_json(force=True)

        # Construire le vecteur dans l'ordre exact
        feats  = engineer(tx)
        X_raw  = np.array([[feats[f] for f in FEATURES]], dtype=np.float64)

        # Scaling
        X_scaled = scaler.transform(X_raw)

        # Prédiction
        proba  = float(model.predict_proba(X_scaled)[0][1])
        score  = round(proba * 100)

        # Verdict
        if proba >= SEUIL_FRAUD:
            verdict = 'fraud'
        elif proba >= SEUIL_SUSPECT:
            verdict = 'suspect'
        else:
            verdict = 'normal'

        return jsonify({
            'score':   score,
            'proba':   round(proba, 6),
            'verdict': verdict,
            'seuil':   SEUIL_FRAUD,
        })

    except Exception as e:
        return jsonify({ 'error': str(e) }), 500

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    """Prédit plusieurs transactions en une seule requête."""
    try:
        transactions = request.get_json(force=True)
        results = []
        for tx in transactions:
            feats    = engineer(tx)
            X_raw    = np.array([[feats[f] for f in FEATURES]], dtype=np.float64)
            X_scaled = scaler.transform(X_raw)
            proba    = float(model.predict_proba(X_scaled)[0][1])
            score    = round(proba * 100)
            verdict  = 'fraud' if proba>=SEUIL_FRAUD else ('suspect' if proba>=SEUIL_SUSPECT else 'normal')
            results.append({ 'id': tx.get('id'), 'score': score, 'proba': round(proba,6), 'verdict': verdict })
        return jsonify(results)
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    flask_env = os.getenv('FLASK_ENV', 'development')
    debug = flask_env == 'development'
    
    print(f"\n🚀 FraudShield Backend")
    print(f"   Environnement: {flask_env}")
    print(f"   Port: {port}")
    print(f"   /health   → statut du serveur")
    print(f"   /predict  → prédiction transaction unique\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
