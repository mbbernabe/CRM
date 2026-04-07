import sys
sys.path.insert(0, 'backend')
from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import UserModel
from src.infrastructure.security.auth_utils import SecurityUtils

db = SessionLocal()
user = db.query(UserModel).first()
if user:
    print(f'Email: {user.email} | Role: {user.role}')
    for pwd in ['admin123', 'admin', 'mbb1223', '123456']:
        ok = SecurityUtils.verify_password(pwd, user.password)
        status = 'OK' if ok else 'falhou'
        print(f'  Tentativa [{pwd}]: {status}')
db.close()
