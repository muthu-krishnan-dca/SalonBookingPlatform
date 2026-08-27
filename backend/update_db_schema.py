from database import engine
from sqlalchemy import text

def update_schema():
    with engine.connect() as conn:
        columns_to_add = [
            ("is_open", "BOOLEAN DEFAULT TRUE"),
            ("opening_time", "VARCHAR(30) DEFAULT '09:00 AM'"),
            ("closing_time", "VARCHAR(30) DEFAULT '09:00 PM'")
        ]
        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE salons ADD COLUMN {col_name} {col_type}"))
                print(f"Successfully added column {col_name}")
            except Exception as e:
                print(f"Column {col_name} check: {e}")
        
        # Also ensure existing salons have default values
        try:
            conn.execute(text("UPDATE salons SET is_open = TRUE WHERE is_open IS NULL"))
            conn.execute(text("UPDATE salons SET opening_time = '09:00 AM' WHERE opening_time IS NULL"))
            conn.execute(text("UPDATE salons SET closing_time = '09:00 PM' WHERE closing_time IS NULL"))
        except Exception as e:
            print("Update existing defaults notice:", e)

        conn.commit()
        print("Schema update complete!")

if __name__ == "__main__":
    update_schema()
