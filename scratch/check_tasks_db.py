import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def check_tasks():
    with engine.connect() as conn:
        print("Checking work_items table...")
        result = conn.execute(text("SELECT id, title, custom_fields, type_id, workspace_id FROM work_items WHERE title ILIKE '%Teste%'"))
        rows = result.fetchall()
        if not rows:
            print("No tasks found with 'Teste' in title.")
        else:
            for row in rows:
                print(f"ID: {row[0]}, Title: {row[1]}, TypeID: {row[3]}, WorkspaceID: {row[4]}")
                print(f"Custom Fields: {row[2]}")
                print("-" * 20)

        print("\nChecking available task types...")
        result = conn.execute(text("SELECT id, name, label FROM work_item_types WHERE name ILIKE '%task%' OR label ILIKE '%Tarefa%'"))
        for row in result:
            print(f"ID: {row[0]}, Name: {row[1]}, Label: {row[2]}")

if __name__ == "__main__":
    check_tasks()
