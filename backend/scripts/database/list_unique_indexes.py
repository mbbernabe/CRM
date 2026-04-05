
import sqlite3

def list_unique():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='index' AND sql LIKE '%UNIQUE%'")
    for row in cursor.fetchall():
        print(f"Index: {row[0]}")
        print(f"  SQL: {row[1]}")
    conn.close()

if __name__ == "__main__":
    list_unique()
