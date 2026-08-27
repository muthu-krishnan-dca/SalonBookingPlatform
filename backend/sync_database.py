from database import engine, Base
import models
from sqlalchemy import text

def sync_db():
    print("Creating all tables from SQLAlchemy models...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    with engine.connect() as conn:
        # Add columns if they don't exist in existing tables
        columns_to_verify = [
            ("salons", "rating", "FLOAT DEFAULT 4.9"),
            ("salons", "is_verified", "BOOLEAN DEFAULT TRUE"),
            ("bookings", "service_id", "INT NULL"),
            ("bookings", "staff_id", "INT NULL"),
            ("bookings", "price", "FLOAT DEFAULT 0.0"),
        ]

        for table, col, col_type in columns_to_verify:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                print(f"Added column {col} to {table}")
            except Exception as e:
                # Column likely already exists
                pass

        # Also populate default services and staff for existing salons if empty
        conn.commit()
        print("Database schema sync complete!")

if __name__ == "__main__":
    sync_db()
