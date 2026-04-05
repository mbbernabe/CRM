from src.infrastructure.database.db import SessionLocal, init_db
from src.infrastructure.database.models import PropertyDefinitionModel

def seed():
    db = SessionLocal()
    try:
        properties = [
            # Endereço
            {"name": "logradouro", "label": "Logradouro", "type": "text"},
            {"name": "numero", "label": "Número", "type": "text"},
            {"name": "bairro", "label": "Bairro", "type": "text"},
            {"name": "cidade", "label": "Cidade", "type": "text"},
            {"name": "estado", "label": "Estado (UF)", "type": "text"},
            
            # Documentos
            {"name": "cpf", "label": "CPF", "type": "text"},
            {"name": "rg", "label": "Identidade (RG)", "type": "text"},
            
            # E-mails Adicionais
            {"name": "email_profissional", "label": "E-mail Profissional", "type": "email"},
            {"name": "email_pessoal", "label": "E-mail Pessoal", "type": "email"},
        ]
        
        for prop in properties:
            existing = db.query(PropertyDefinitionModel).filter(PropertyDefinitionModel.name == prop["name"]).first()
            if not existing:
                db.add(PropertyDefinitionModel(**prop))
        
        db.commit()
        print("Propriedades semeadas com sucesso!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
