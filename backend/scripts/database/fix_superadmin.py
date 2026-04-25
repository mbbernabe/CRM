import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Adiciona o diretório raiz ao sys.path para importar os modelos e utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.infrastructure.database.models import UserModel, MembershipModel
from src.infrastructure.security.auth_utils import SecurityUtils

def fix_superadmin():
    load_dotenv('.env')
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("Erro: DATABASE_URL não encontrada no .env")
        return

    print(f"Conectando ao banco de dados...")
    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    target_email = 'mbbernabe@gmail.com'
    new_password = 'adm123'
    
    print(f"Buscando usuário {target_email}...")
    user = session.query(UserModel).filter(UserModel.email == target_email).first()
    
    if not user:
        print(f"Usuário {target_email} não encontrado. Por favor, cadastre-se primeiro ou use o botão de Acesso Rápido na tela de login para tentar criar o usuário.")
        session.close()
        return

    print(f"Usuário encontrado: {user.name} (ID: {user.id})")
    
    # 1. Resetar senha
    print(f"Resetando senha para '{new_password}'...")
    user.password = SecurityUtils.hash_password(new_password)
    user.is_active = True
    
    # 2. Forçar papel de superadmin em todas as memberships
    print(f"Atualizando todas as memberships para 'superadmin'...")
    memberships = session.query(MembershipModel).filter(MembershipModel.user_id == user.id).all()
    
    for m in memberships:
        print(f" - Workspace ID {m.workspace_id}: {m.role} -> superadmin")
        m.role = 'superadmin'
        m.is_active = True
    
    try:
        session.commit()
        print("\nSUCCESS: Usuario atualizado com sucesso!")
        print(f"Agora voce pode entrar com {target_email} / {new_password}")
    except Exception as e:
        session.rollback()
        print(f"ERROR: Erro ao salvar alteracoes: {str(e)}")
    finally:
        session.close()

if __name__ == "__main__":
    fix_superadmin()
