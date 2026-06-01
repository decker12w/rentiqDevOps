from sqlmodel import SQLModel, create_engine, Session, text
from typing import Generator
from app.config import settings
import app.models  # noqa: F401 — garante que todos os modelos estão registrados no metadata

engine = create_engine(str(settings.DATABASE_URL))


def create_db():
    SQLModel.metadata.create_all(engine)
    # Adiciona user_id em prediction se a tabela já existia sem a coluna
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE prediction
            ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id)
        """))
        conn.commit()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
