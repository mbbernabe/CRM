from src.infrastructure.database.db import SessionLocal, init_db
from src.infrastructure.database.models import ContactModel

def seed():
    db = SessionLocal()
    
    # Verifica se já existem contatos
    if db.query(ContactModel).count() > 0:
        print("Banco já contém dados em ContactModel. Pulando seed.")
        db.close()
        return

    contacts = [
        ContactModel(name="João Silva", email="joao@example.com", phone="11999999999", status="active"),
        ContactModel(name="Maria Souza", email="maria@example.com", phone="11888888888", status="active"),
        ContactModel(name="Carlos Lima", email="carlos@example.com", phone="11777777777", status="inactive"),
    ]
    
    print("Populando contatos de teste...")
    db.add_all(contacts)
    db.commit()
    db.close()
    print("Seed de contatos finalizado!")

if __name__ == "__main__":
    init_db()
    seed()
