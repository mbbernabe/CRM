from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import CompanyModel

def seed():
    db = SessionLocal()
    
    companies = [
        CompanyModel(name="Apple Inc", domain="apple.com"),
        CompanyModel(name="Microsoft Corporation", domain="microsoft.com"),
        CompanyModel(name="Google LLC", domain="google.com"),
        CompanyModel(name="Amazon", domain="amazon.com"),
        CompanyModel(name="Tesla", domain="tesla.com"),
        CompanyModel(name="OpenAI", domain="openai.com"),
        CompanyModel(name="Meta Platforms", domain="meta.com")
    ]
    
    print("Adicionando empresas de teste...")
    db.add_all(companies)
    db.commit()
    db.close()
    print("Empresas adicionadas com sucesso!")

if __name__ == "__main__":
    seed()
