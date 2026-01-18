
import sqlite3
import os
import sys

# Ensure we are in the correct directory or find the db
# We assume this script is run from backend/ directory
db_path = "letw.db"
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    print(f"Connected to {db_path}")
    
    # Check if column exists
    cursor.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    if "role" in columns:
        print("Column 'role' already exists.")
    else:
        print("Adding column 'role'...")
        # Add role column with default value 'user'
        cursor.execute("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user' NOT NULL")
        conn.commit()
        print("Column added successfully.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
