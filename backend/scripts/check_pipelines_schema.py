import sqlite3

def check():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(pipelines)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"ID: {col[0]}, Nome: {col[1]}, Tipo: {col[2]}, Nullable: {col[3]}, Default: {col[4]}, PK: {col[5]}")
    conn.close()

if __name__ == "__main__":
    check()
