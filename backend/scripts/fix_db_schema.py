import sqlite3
import os

def fix_db():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../crm.db"))
    print(f"Fixing database at {db_path}...")
    
    if not os.path.exists(db_path):
        print("Database file not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def add_column(table, column, type_def):
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}")
            print(f"Column '{column}' added to table '{table}'.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column '{column}' already exists in table '{table}'.")
            else:
                print(f"Error adding column '{column}' to '{table}': {e}")

    # Fix Users Table
    add_column("users", "preferences", "JSON")
    add_column("users", "reset_password_token", "VARCHAR")
    add_column("users", "reset_password_expires", "DATETIME")

    # Fix Property Groups
    add_column("property_groups", "team_id", "INTEGER")
    
    # Fix Property Definitions
    add_column("property_definitions", "team_id", "INTEGER")

    # Fix Entity Property Links
    add_column("entity_property_links", "team_id", "INTEGER")

    # Fix Contacts
    add_column("contacts", "team_id", "INTEGER")

    # Fix Companies
    add_column("companies", "team_id", "INTEGER")

    conn.commit()
    conn.close()
    print("Database fix completed.")

if __name__ == "__main__":
    fix_db()
