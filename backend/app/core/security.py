import base64
import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings


def generate_pkce_pair() -> Tuple[str, str]:
    """
    Generates PKCE code_verifier (random 64-byte URL-safe string)
    and code_challenge (Base64URL-encoded SHA256 of code_verifier without padding).
    """
    code_verifier = secrets.token_urlsafe(64)[:128]
    digest = hashlib.sha256(code_verifier.encode("utf-8")).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")
    return code_verifier, code_challenge


def generate_oauth_state() -> str:
    """Generates cryptographically secure random state parameter for CSRF mitigation."""
    return secrets.token_urlsafe(32)


def _get_encryption_key(key_str: Optional[str] = None) -> bytes:
    raw = (key_str or settings.MASTER_ENCRYPTION_KEY).encode("utf-8")
    return hashlib.sha256(raw).digest()


def encrypt_token(plain_text: str, key_str: Optional[str] = None) -> str:
    """
    Encrypts a string using AES-256-GCM.
    Returns Base64 encoded string containing IV (12 bytes) + Ciphertext + Tag.
    """
    if not plain_text:
        return ""
    key = _get_encryption_key(key_str)
    aesgcm = AESGCM(key)
    iv = os.urandom(12)
    ciphertext = aesgcm.encrypt(iv, plain_text.encode("utf-8"), None)
    payload = iv + ciphertext
    return base64.b64encode(payload).decode("utf-8")


def decrypt_token(encrypted_data: str, key_str: Optional[str] = None) -> str:
    """
    Decrypts an AES-256-GCM encrypted Base64 string.
    """
    if not encrypted_data:
        return ""
    try:
        raw_payload = base64.b64decode(encrypted_data.encode("utf-8"))
        if len(raw_payload) < 28:  # 12 bytes IV + 16 bytes tag minimum
            raise ValueError("Payload too short for AES-GCM")
        iv = raw_payload[:12]
        ciphertext = raw_payload[12:]
        key = _get_encryption_key(key_str)
        aesgcm = AESGCM(key)
        decrypted = aesgcm.decrypt(iv, ciphertext, None)
        return decrypted.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Decryption failed: {str(e)}") from e


def create_session_jwt(user_id: str, github_username: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a signed JWT session cookie payload.
    """
    if expires_delta is None:
        expires_delta = timedelta(days=settings.SESSION_MAX_AGE_DAYS)
    
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    payload = {
        "sub": str(user_id),
        "github_username": github_username,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(payload, settings.SESSION_SECRET, algorithm="HS256")


def verify_session_jwt(token: str) -> Optional[dict]:
    """
    Decodes and validates a session JWT. Returns payload if valid, None otherwise.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SESSION_SECRET, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        return None
