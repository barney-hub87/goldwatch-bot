from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np

app = Flask(__name__)

def get_demo_analysis():
    """Generates the latest confluence calculation and signal state."""
    # In production, replace with real-time broker/feed OHLC data
    return {
        "symbol": "XAUUSD (Gold)",
        "current_price": 2682.40,
        "status": "HIGH_CONFIDENCE",
        "direction": "BUY",
        "confidence": 84,
        "entry_zone": "2,680.00 – 2,682.50",
        "stop_loss": 2674.00,
        "tp1": 2695.00,
        "tp2": 2703.50,
        "rr_ratio": "1:2.5",
        "atr": 5.60,
        "levels": {
            "pivot": 2678.50,
            "r1": 2692.10,
            "s1": 2665.40,
            "pdh": 2689.00,
            "pdl": 2661.20
        },
        "timeframes": {
            "M15": {"trend": "BULLISH", "rsi": 54.2, "macd": "Bullish Cross", "ema20": "Holding Above"},
            "H1": {"trend": "BULLISH", "rsi": 58.6, "macd": "Positive Hist", "ema200": "Above (2,658.00)"},
            "H4": {"trend": "BULLISH", "rsi": 62.1, "macd": "Bullish", "ema200": "Above (2,630.50)"},
            "D1": {"trend": "BULLISH", "rsi": 66.4, "macd": "Bullish", "ema200": "Above (2,510.00)"}
        },
        "reasons": [
            "H4 and H1 price trading above EMA 200 (Macro Bullish)",
            "M15 retest of dynamic EMA 20 support zone",
            "RSI (14) rebound across the 50 centerline",
            "MACD histogram expanding positively",
            "No high-impact USD economic events in the next 60 minutes"
        ]
    }

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/signal")
def api_signal():
    return jsonify(get_demo_analysis())

@app.route("/api/calculate-risk", methods=["POST"])
def calculate_risk():
    data = request.json or {}
    try:
        balance = float(data.get("balance", 10000))
        risk_pct = float(data.get("risk_pct", 1.0))
        sl_points = float(data.get("sl_points", 8.0))

        if balance <= 0 or risk_pct <= 0 or sl_points <= 0:
            return jsonify({"error": "Parameters must be greater than zero."}), 400

        risk_amount = balance * (risk_pct / 100.0)
        # Gold standard lot: $1.00 move = $100 per 1.00 lot
        raw_lot = risk_amount / (sl_points * 100.0)
        recommended_lot = max(0.01, round(raw_lot, 2))

        return jsonify({
            "balance": balance,
            "risk_pct": risk_pct,
            "risk_amount": round(risk_amount, 2),
            "sl_points": sl_points,
            "recommended_lot": recommended_lot
        })
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid numerical inputs."}), 400

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)