from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.core.exceptions import ForbiddenAccountException, UnauthorizedException
from app.core.security import decrypt_token, encrypt_token
from app.models.user import GitHubConnection, User


class AuthService:
    async def get_user_by_id(self, session: AsyncSession, user_id: str) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        return result.scalars().first()

    async def get_user_by_github_username(self, session: AsyncSession, username: str) -> Optional[User]:
        stmt = select(User).where(User.github_username == username)
        result = await session.execute(stmt)
        return result.scalars().first()

    async def authenticate_github_user(
        self,
        session: AsyncSession,
        gh_profile: dict,
        access_token: str,
        token_scope: str = "repo,read:user,user:email",
        enforce_allowlist: bool = False,
    ) -> User:
        gh_username = gh_profile.get("login", "")
        gh_id = gh_profile.get("id")

        if not gh_username or not gh_id:
            raise UnauthorizedException("Invalid GitHub profile response.")

        # STRICT ALLOWLIST VALIDATION (Only if explicitly enabled and configured)
        if enforce_allowlist and settings.AUTHORIZED_GITHUB_USER:
            if gh_username.lower() != settings.AUTHORIZED_GITHUB_USER.lower():
                raise ForbiddenAccountException(gh_username)

        # Upsert User
        stmt = select(User).where(User.github_user_id == gh_id)
        res = await session.execute(stmt)
        user = res.scalars().first()

        if not user:
            user = User(
                github_user_id=gh_id,
                github_username=gh_username,
                avatar_url=gh_profile.get("avatar_url"),
                email=gh_profile.get("email"),
            )
            session.add(user)
            await session.flush()
        else:
            user.github_username = gh_username
            user.avatar_url = gh_profile.get("avatar_url")
            user.email = gh_profile.get("email")

        # Upsert GitHubConnection
        conn_stmt = select(GitHubConnection).where(GitHubConnection.user_id == user.id)
        conn_res = await session.execute(conn_stmt)
        conn = conn_res.scalars().first()

        encrypted_ref = encrypt_token(access_token)
        if not conn:
            conn = GitHubConnection(
                user_id=user.id,
                encrypted_token_reference=encrypted_ref,
                token_scope=token_scope,
                connection_status="ACTIVE",
            )
            session.add(conn)
        else:
            conn.encrypted_token_reference = encrypted_ref
            conn.token_scope = token_scope
            conn.connection_status = "ACTIVE"

        await session.commit()
        await session.refresh(user)
        return user

    async def get_user_decrypted_token(self, session: AsyncSession, user_id: str) -> Tuple[User, str]:
        stmt = select(User).where(User.id == user_id)
        res = await session.execute(stmt)
        user = res.scalars().first()
        if not user:
            raise UnauthorizedException("User not found.")

        conn_stmt = select(GitHubConnection).where(GitHubConnection.user_id == user.id)
        conn_res = await session.execute(conn_stmt)
        conn = conn_res.scalars().first()
        if not conn or not conn.encrypted_token_reference:
            raise UnauthorizedException("No GitHub connection found for user.")

        try:
            token = decrypt_token(conn.encrypted_token_reference)
            return user, token
        except Exception as e:
            raise UnauthorizedException("Failed to decrypt GitHub access token.") from e


auth_service = AuthService()
