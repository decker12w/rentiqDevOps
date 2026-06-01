from datetime import timedelta
import bcrypt
import jwt

from app.config import settings
from app.models.utils import utcnow

_ALGORITHM = "HS256"
_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": utcnow() + timedelta(days=_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=_ALGORITHM)


def decode_token(token: str) -> str:
    data = jwt.decode(token, settings.JWT_SECRET, algorithms=[_ALGORITHM])
    return data["sub"]
