import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger("symbio.email")


def send_email(to: str, subject: str, body: str) -> None:
    if settings.EMAIL_DEV_LOG or not settings.SMTP_HOST:
        logger.info("DEV EMAIL to=%s subject=%s\n%s", to, subject, body)
        return

    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
        if settings.SMTP_USER:
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.send_message(msg)


def verification_email_link(token: str) -> str:
    return f"{settings.WEB_BASE_URL}/auth/verify-email?token={token}"
