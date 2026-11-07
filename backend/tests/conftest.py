import os
import sys
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.core.security import create_session_jwt, encrypt_token
from app.models.base import Base, get_db
from app.models.user import GitHubConnection, User
from app.main import app

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        github_user_id=123456,
        github_username="octocat",
        avatar_url="https://avatars.githubusercontent.com/u/123456",
        email="octocat@github.com",
    )
    db_session.add(user)
    await db_session.flush()

    conn = GitHubConnection(
        user_id=user.id,
        encrypted_token_reference=encrypt_token("ghp_test_token_12345"),
        token_scope="repo,read:user,user:email",
        connection_status="ACTIVE",
    )
    db_session.add(conn)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    session_jwt = create_session_jwt(test_user.id, test_user.github_username)
    return {
        "Authorization": f"Bearer {session_jwt}",
        "Cookie": f"{settings.SESSION_COOKIE_NAME}={session_jwt}",
    }
