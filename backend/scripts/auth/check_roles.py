
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.infrastructure.database.models import UserModel

SQLALCHEMY_DATABASE_URL = "sqlite:///./crm.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

users = session.query(UserModel).all()
if not users:
    print("Nenhum usuário encontrado.")
else:
    for user in users:
        print(f"ID: {user.id}, Nome: {user.name}, Email: {user.email}, Role: {user.role}")
session.close()
