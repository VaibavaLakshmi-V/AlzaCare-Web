"""Sends caregiver notifications through the Telegram Bot API."""
import logging

import httpx

from app.config import settings

log = logging.getLogger("alzacare.telegram")


async def send_telegram(text: str) -> str:
    """Send a message. Returns "sent", "skipped" or "failed: <reason>"; never raises."""
    token, chat_id = settings.TELEGRAM_BOT_TOKEN, settings.TELEGRAM_CHAT_ID
    if not token or not chat_id:
        log.info("Telegram not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID); skipping")
        return "skipped"

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json={"chat_id": chat_id, "text": text})
        if resp.status_code == 200:
            return "sent"
        reason = resp.json().get("description", f"HTTP {resp.status_code}")
    except Exception as exc:
        # Keep the bot token out of logs and responses
        reason = f"{type(exc).__name__}: {exc}".replace(token, "***")
    log.warning("Telegram send failed: %s", reason)
    return f"failed: {reason}"
