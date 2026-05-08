from datetime import datetime, timedelta, timezone
import sqlite3
from pathlib import Path
from typing import Optional
from uuid import uuid4

import jwt
from passlib.context import CryptContext

from ..core.config import settings
from ..schemas.user import UserRead

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class User:
    """Application user record"""

    def __init__(self, id: str, email: str, name: str, hashed_password: str):
        self.id = id
        self.email = email
        self.name = name
        self.hashed_password = hashed_password


class AuthService:
    def __init__(self) -> None:
        self._db_path = Path(settings.db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_schema(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    hashed_password TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, password: str, hashed_password: str) -> bool:
        return pwd_context.verify(password, hashed_password)

    def get_user_by_email(self, email: str) -> Optional[User]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT id, email, name, hashed_password FROM users WHERE email = ?",
                (email,)
            ).fetchone()

        if not row:
            return None

        return User(
            id=row["id"],
            email=row["email"],
            name=row["name"],
            hashed_password=row["hashed_password"]
        )

    def create_user(self, email: str, name: str, password: str) -> UserRead:
        if self.get_user_by_email(email):
            raise ValueError("User with this email already exists")

        user_id = str(uuid4())
        hashed_password = self.hash_password(password)
        user = User(
            id=user_id,
            email=email,
            name=name,
            hashed_password=hashed_password
        )

        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO users (id, email, name, hashed_password, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (user.id, user.email, user.name, user.hashed_password, datetime.now(timezone.utc).isoformat())
            )
            conn.commit()

        return UserRead(id=user_id, email=email, name=name)

    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = self.get_user_by_email(email)
        if not user or not self.verify_password(password, user.hashed_password):
            return None
        return user

    def create_access_token(self, user_id: str) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiration_hours)
        payload = {
            "sub": user_id,
            "exp": expires_at,
            "iat": datetime.now(timezone.utc)
        }
        token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
        return token

    def verify_token(self, token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return user_id
        except jwt.InvalidTokenError:
            return None

    def get_user_by_id(self, user_id: str) -> Optional[UserRead]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT id, email, name FROM users WHERE id = ?",
                (user_id,)
            ).fetchone()

        if not row:
            return None

        return UserRead(id=row["id"], email=row["email"], name=row["name"])


auth_service = AuthService()
