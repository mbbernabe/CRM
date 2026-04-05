
import sqlite3

def check_indexes():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    table = 'property_groups'
    print(f"--- Indexes for {table} ---")
    cursor.execute(f"PRAGMA index_list('{table}')")
    indexes = cursor.fetchall()
    for idx in indexes:
        print(f"Index: {idx[1]}, Unique: {idx[2]}")
        cursor.execute(f"PRAGMA index_info('{idx[1]}')")
        info = cursor.fetchall()
        for col in info:
            print(f"  Column: {col[2]}")
            
    conn.close()

if __name__ == "__main__":
    check_indexes()
