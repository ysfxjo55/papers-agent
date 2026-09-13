import os

import resend

resend.api_key = os.environ["RESEND_API_KEY"]

EMAIL_FROM = os.getenv("EMAIL_FROM", "AI Mind <no-reply@mail.ysfxjo.com>")


def send_verification_email(to_email: str, name: str, verify_url: str) -> None:
    resend.Emails.send(
        {
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": "Confirm your AI Mind account",
            "html": f"""
                <p>Hi {name},</p>
                <p>Thanks for creating an AI Mind account. Click the link below to confirm your email address:</p>
                <p><a href="{verify_url}">Confirm my email</a></p>
                <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
            """,
        }
    )
