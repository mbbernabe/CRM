
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.infrastructure.database.models import UserModel

SQLALCHEMY_DATABASE_URL = "sqlite:///./crm.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
session = SessionLocal()

# Remove test users from previous validations
session.query(UserModel).filter(UserModel.email.in_(['test@example.com', 'test1@example.com', 'test2@example.com'])).delete(synchronize_session=False)

# Promote the first real user to admin
admin = session.query(UserModel).filter(UserModel.email == 'mbbernabe@gmail.com').first()
if admin:
    admin.role = 'admin'
    print(f"Usuário {admin.email} promovido a admin.")
else:
    print("Usuário mbbernabe@gmail.com não encontrado.")

session.commit()
session.close()
