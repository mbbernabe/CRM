import sys
import os

# Ensure the parent directory is in the path to import src
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.infrastructure.database.db import SessionLocal
from src.infrastructure.database.models import UserModel
from src.infrastructure.security.auth_utils import SecurityUtils

def reset():
    db = SessionLocal()
    try:
        email = 'mbbernabe@gmail.com'
        user = db.query(UserModel).filter(UserModel.email == email).first()
        if user:
            print(f"Reseting password for {email}...")
            user.password = SecurityUtils.hash_password('admin1234')
            user.role = 'superadmin'
            db.commit()
            print("Password reset successfully!")
        else:
            print(f"User {email} not found. Creating it...")
            # Note: Requires a workspace_id. Since we have workspace ID 1 from previous logs.
            user = UserModel(
                name="Marcelo Bernabe (Dev)",
                email=email,
                password=SecurityUtils.hash_password('admin1234'),
                workspace_id=1,
                role='superadmin'
            )
            db.add(user)
            db.commit()
            print("User created successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset()
