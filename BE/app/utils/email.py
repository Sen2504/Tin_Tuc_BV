import threading
from flask import current_app
from flask_mail import Message
from app.extensions import mail


def _send_async_email(app, msg):
    with app.app_context():
        mail.send(msg)


def send_email(subject, recipients, html):
    app = current_app._get_current_object()
    msg = Message(
        subject=subject,
        recipients=recipients,
        html=html
    )
    thr = threading.Thread(target=_send_async_email, args=(app, msg))
    thr.start()
    return thr