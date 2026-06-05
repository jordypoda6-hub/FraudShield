from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import json
import numpy as np
import math
import os
import re

app = Flask(__name__)

# ── CORS configuré — accepte tous les déploiements Vercel du projet ──
def make_cors_origins():
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    # URL de prod fixe (si tu en as une)
    fixed = os.getenv("ALLOWED_ORIGINS", "")
    if fixed:
        origins += [o.strip() for o in fixed.split(",") if o.strip()]
    return origins

# regex pour accepter toutes les previews Vercel du projet
CORS(app, resources={r"/*": {
    "origins": make_cors_origins(),
    "allow_headers": ["Content-Type", "Authorization"],
    "methods": ["GET", "POST", "OPTIONS"],
    "supports_credentials": False,
}})

# Hack: accepter dynamiquement *.vercel.app pour les previews
@app.after_request
def allow_vercel_previews(response):
    origin = request.headers.get("Origin", "")
    if re.match(r"https://[\w-]+-jordypoda6-hubs-projects\.vercel\.app$", origin) \
       or re.match(r"https://fraud-shield[\w-]*\.vercel\.app$", origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

# ── Chargement des fichiers ──────────────────────────────────────────
BASE = os.path.dirname(os.path.abspath(__file__))

scaler = joblib.load(os.path.join(BASE, 'scaler_robust.pkl'))
model  = joblib.load(os.path.join(BASE, 'modele_rf.pkl'))

with open(os.path.join(BASE, 'feature_names.json')) as f:
    FEATURES = json.load(f)

print(f"✅ Modèle chargé — {len(FEATURES)} features")
print(f"   Features : {FEATURES}")

# ── Seuils de décision ───────────────────────────────────────────────
SEUIL_FRAUD   = 0.059
SEUIL_SUSPECT = 0.020

# ── Ingénierie des features ──────────────────────────────────────────
def engineer(tx: dict) -> dict:
    feats = {}
    for i in range(1, 29):
        feats[f'V{i}'] = float(tx.get(f'V{i}', 0.0))

    amount = float(tx.get('amount', 0.0))
    feats['amount_log'] = math.log(amount + 1)

    hour = int(tx.get('hour', 0))
    feats['heure_sin'] = math.sin(2 * math.pi * hour / 24)
    feats['heure_cos'] = math.cos(2 * math.pi * hour / 24)

    if   hour < 6:   feats['tranche'] = 0
    elif hour < 12:  feats['tranche'] = 1
    elif hour < 18:  feats['tranche'] = 2
    else:            feats['tranche'] = 3

    feats['is_zero_amount'] = 1 if amount == 0 else 0
    return feats

# ── Routes ───────────────────────────────────────────────────────────
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
        feats    = engineer(tx)
        X_raw    = np.array([[feats[f] for f in FEATURES]], dtype=np.float64)
        X_scaled = scaler.transform(X_raw)
        proba    = float(model.predict_proba(X_scaled)[0][1])
        score    = round(proba * 100)

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
        return jsonify({'error': str(e)}), 500

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    try:
        transactions = request.get_json(force=True)
        results = []
        for tx in transactions:
            feats    = engineer(tx)
            X_raw    = np.array([[feats[f] for f in FEATURES]], dtype=np.float64)
            X_scaled = scaler.transform(X_raw)
            proba    = float(model.predict_proba(X_scaled)[0][1])
            score    = round(proba * 100)
            verdict  = 'fraud' if proba >= SEUIL_FRAUD else ('suspect' if proba >= SEUIL_SUSPECT else 'normal')
            results.append({'id': tx.get('id'), 'score': score, 'proba': round(proba, 6), 'verdict': verdict})
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
