
import sqlite3

def check_db():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    print("--- Tables ---")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for table in tables:
        print(f"Table: {table[0]}")
        cursor.execute(f"PRAGMA table_info({table[0]})")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  Column: {col[1]}, Type: {col[2]}, Nullable: {col[3]}, PK: {col[5]}")
    
    print("\n--- Teams ---")
    cursor.execute("SELECT * FROM teams")
    print(cursor.fetchall())
    
    print("\n--- Users ---")
    cursor.execute("SELECT * FROM users")
    print(cursor.fetchall())
    
    conn.close()

if __name__ == "__main__":
    check_db()
