import sqlite3
import os

db_path = 'crm.db'

def fix():
    if not os.path.exists(db_path):
        print("Banco de dados não encontrado.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Verificando colunas na tabela 'users'...")
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]

    if 'reset_password_token' not in columns:
        print("Adicionando coluna 'reset_password_token'...")
        cursor.execute("ALTER TABLE users ADD COLUMN reset_password_token TEXT")
    
    if 'reset_password_expires' not in columns:
        print("Adicionando coluna 'reset_password_expires'...")
        cursor.execute("ALTER TABLE users ADD COLUMN reset_password_expires DATETIME")

    print("Verificando se a tabela 'system_settings' existe...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='system_settings'")
    if not cursor.fetchone():
        print("Criando tabela 'system_settings'...")
        cursor.execute('''
            CREATE TABLE system_settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                description TEXT,
                is_encrypted BOOLEAN DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

    conn.commit()
    conn.close()
    print("Sincronização do banco de dados concluída com sucesso!")

if __name__ == "__main__":
    fix()
