# GoldWatch Bot

A Telegram assistant for XAUUSD prices, example market levels, and position-size calculations.

## Commands

- `/signal` — Shows a gold price, volatility estimate, and an illustrative analysis checklist.
- `/risk <balance> <risk%> <stop-distance>` — Calculates an example position size.
- `/levels` — Shows price levels around the current gold price.
- `/help` — Displays the command guide and risk disclosure.

The `/signal` checklist and its 84/100 score are currently fixed text; the bot does not calculate the listed EMA, RSI, or MACD conditions. Price data comes from Yahoo Finance when available, with a fallback value if the request fails. Treat the output as educational, not trading advice.

## Run locally

1. Install the packages with `pip install -r requirements.txt`.
2. Set `BOT_TOKEN` in your environment.
3. Run `python main.py`.

Do not commit a real bot token. `.env.example` is only a placeholder, and `.gitignore` excludes `.env` files.

## Deploy on Render

The repository includes a Render Blueprint in `render.yaml`. In the Render Dashboard, create a Blueprint from this repository and provide `BOT_TOKEN` when prompted. The service uses `python main.py`; Render supplies its `PORT` value.

For an already-created Blueprint service, add or update `BOT_TOKEN` in the Render Dashboard. The Blueprint marks it `sync: false` so the secret is not stored in Git.
