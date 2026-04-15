import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "..", "crm.db")
    if not os.path.exists(db_path):
        print(f"Banco de dados não encontrado em {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Adiciona a coluna invitation_message na tabela workspaces
        cursor.execute("ALTER TABLE workspaces ADD COLUMN invitation_message TEXT")
        print("Coluna 'invitation_message' adicionada com sucesso à tabela 'workspaces'.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("A coluna 'invitation_message' já existe.")
        else:
            print(f"Erro ao adicionar coluna: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
