from sqlmodel import SQLModel, Field
from datetime import datetime
from app.models.utils import utcnow, new_ulid


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=new_ulid, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=utcnow)
