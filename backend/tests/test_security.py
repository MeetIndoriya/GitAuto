import pytest
from app.core.security import (
    create_session_jwt,
    decrypt_token,
    encrypt_token,
    generate_oauth_state,
    generate_pkce_pair,
    verify_session_jwt,
)


def test_pkce_pair_generation():
    verifier, challenge = generate_pkce_pair()
    assert len(verifier) >= 43
    assert len(challenge) > 20
    assert "=" not in challenge  # base64url unpadded


def test_oauth_state_generation():
    state1 = generate_oauth_state()
    state2 = generate_oauth_state()
    assert state1 != state2
    assert len(state1) >= 32


def test_token_encryption_decryption():
    raw_token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz"
    encrypted = encrypt_token(raw_token)
    assert encrypted != raw_token
    assert len(encrypted) > len(raw_token)

    decrypted = decrypt_token(encrypted)
    assert decrypted == raw_token


def test_jwt_session_lifecycle():
    user_id = "test-uuid-1234"
    username = "octocat"
    jwt_token = create_session_jwt(user_id, username)
    assert isinstance(jwt_token, str)

    payload = verify_session_jwt(jwt_token)
    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["github_username"] == username
    assert "exp" in payload
    assert "jti" in payload


def test_jwt_invalid_token():
    assert verify_session_jwt("invalid.jwt.token") is None
    assert verify_session_jwt("") is None
