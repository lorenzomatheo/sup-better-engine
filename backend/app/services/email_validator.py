"""Email validation — syntax + disposable domain blocklist."""

import re

# Common disposable email domains (subset — expand as needed)
DISPOSABLE_DOMAINS = frozenset({
    "mailinator.com", "guerrillamail.com", "guerrillamail.net", "tempmail.com",
    "throwaway.email", "fakeinbox.com", "sharklasers.com", "guerrillamailblock.com",
    "grr.la", "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
    "temp-mail.org", "tempail.com", "tempr.email", "tempmailo.com",
    "10minutemail.com", "minutemail.com", "emailondeck.com", "getnada.com",
    "maildrop.cc", "dispostable.com", "yopmail.com", "yopmail.fr",
    "trashmail.com", "trashmail.me", "trashmail.net", "trashmail.org",
    "mohmal.com", "burnermail.io", "mailnesia.com", "mailcatch.com",
    "disposableemailaddresses.emailmiser.com", "mailexpire.com",
    "tmpmail.net", "tmpmail.org", "binkmail.com", "bobmail.info",
    "chammy.info", "devnullmail.com", "dingbone.com", "e4ward.com",
    "emailias.com", "emaillime.com", "emailtemporario.com.br",
    "getairmail.com", "jetable.org", "mvrht.com", "mytemp.email",
    "nonspam.eu", "nonspammer.de", "reallymymail.com", "reconmail.com",
    "spam4.me", "spamfree24.org", "spamgourmet.com", "spamhole.com",
    "tempinbox.com", "tempomail.fr", "temporaryemail.net",
    "temporaryforwarding.com", "temporarymailaddress.com",
    "thankyou2010.com", "throwawayemailaddress.com",
    "tmail.ws", "tmailinator.com", "wegwerfadresse.de",
    "wh4f.org", "whatiaas.com", "whatpaas.com",
    "mailtemp.info", "email-temp.com", "temp-mail.io",
    "guerrillamail.com", "crazymailing.com", "harakirimail.com",
    "mailnator.com", "tempmail.plus", "emailfake.com",
    "generator.email", "fakemail.net",
})

# Simplified RFC 5322 email regex
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}"
    r"[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
)


def validate_email(email_raw: str) -> tuple[bool, str | None]:
    """Validate an email address.

    Returns:
        (is_valid, error_reason or None)
    """
    email = email_raw.strip().lower()

    # Syntax check
    if not email or not EMAIL_REGEX.match(email):
        return False, "E-mail inválido. Verifique o formato e tente novamente."

    # Domain check
    domain = email.split("@")[1]
    if domain in DISPOSABLE_DOMAINS:
        return False, "E-mails temporários não são aceitos. Use um e-mail válido."

    return True, None


def normalize_email(email_raw: str) -> str:
    """Normalize email: trim + lowercase (Decision #4)."""
    return email_raw.strip().lower()
