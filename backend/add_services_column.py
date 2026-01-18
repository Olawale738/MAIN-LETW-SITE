import sqlite3
import os

# Ensure we are in the correct directory or find the db
db_path = "letw.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    # Try absolute path based on user info if needed, but we will run from backend/
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print(f"Connected to {db_path}")
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    if "services" in columns:
        print("Column 'services' already exists.")
    else:
        print("Adding column 'services'...")
        # SQLite doesn't strictly have a JSON type, it uses TEXT/BLOB but we can declare it as JSON
        # IMPORTANT: We must provide a DEFAULT value for a NOT NULL column in ALTER TABLE
        cursor.execute("ALTER TABLE users ADD COLUMN services JSON DEFAULT '[]' NOT NULL")
        conn.commit()
        print("Column added successfully.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
