import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DEFAULT_MYSQL_URL = "mysql+pymysql://root:@localhost/salon_booking"
DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_MYSQL_URL)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    # Test connection to configured database
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args=connect_args
    )
    with engine.connect():
        pass
    print(f"[DB] Connected to primary database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
except Exception as err:
    print(f"[DB Warning] Primary database connection failed: {err}")
    print("[DB] Gracefully falling back to local SQLite database: salon_booking.db")
    DATABASE_URL = "sqlite:///./salon_booking.db"
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()