from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher

from app.core.config import settings


password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """
    Convert a plain-text password into a secure Argon2 hash.
    """
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify a plain-text password against its stored hash.
    """
    try:
        password_hasher.verify(password_hash, password)
        return True

    except Exception:
        return False


def create_access_token(user_id: int) -> str:
    """
    Create a JWT access token for the authenticated user.
    """

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )