from src.infrastructure.database.db import SessionLocal, init_db
from src.infrastructure.database.models import PropertyDefinitionModel

def seed():
    db = SessionLocal()
    try:
        properties = [
            # Endereço
            {"name": "logradouro", "label": "Logradouro", "type": "text", "group": "Endereço"},
            {"name": "numero", "label": "Número", "type": "text", "group": "Endereço"},
            {"name": "bairro", "label": "Bairro", "type": "text", "group": "Endereço"},
            {"name": "cidade", "label": "Cidade", "type": "text", "group": "Endereço"},
            {"name": "estado", "label": "Estado (UF)", "type": "text", "group": "Endereço"},
            
            # Documentos
            {"name": "cpf", "label": "CPF", "type": "text", "group": "Documentos"},
            {"name": "rg", "label": "Identidade (RG)", "type": "text", "group": "Documentos"},
            
            # E-mails Adicionais
            {"name": "email_profissional", "label": "E-mail Profissional", "type": "email", "group": "E-mails"},
            {"name": "email_pessoal", "label": "E-mail Pessoal", "type": "email", "group": "E-mails"},
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
