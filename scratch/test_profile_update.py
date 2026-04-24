import sys
import os
sys.path.append(os.getcwd())

from src.infrastructure.database.db import SessionLocal
from src.infrastructure.repositories.sqlalchemy_user_repository import SqlAlchemyUserRepository
from src.application.use_cases.profile_use_cases import UpdateProfileUseCase
from src.application.dtos.user_dto import UserUpdateDTO
from src.domain.entities.user import User

def test_update_profile():
    db = SessionLocal()
    try:
        user_repo = SqlAlchemyUserRepository(db)
        # Busca o primeiro usuário
        all_users = user_repo.list_all()
        if not all_users:
            print("Nenhum usuário encontrado para teste.")
            return
        
        test_user = all_users[0]
        print(f"Testando atualização para o usuário: {test_user.name} (ID: {test_user.id})")
        
        use_case = UpdateProfileUseCase(user_repo)
        new_name = test_user.name + " (Editado)"
        
        dto = UserUpdateDTO(name=new_name)
        
        print(f"Executando use case...")
        result = use_case.execute(test_user.id, dto)
        print(f"Sucesso! Novo nome no DTO de retorno: {result.name}")
        
        # Verifica se persistiu
        db.expunge_all()
        persisted_user = user_repo.get_by_id(test_user.id)
        print(f"Verificação no DB: {persisted_user.name}")
        
        if persisted_user.name == new_name:
            print("TESTE OK: Persistência confirmada.")
        else:
            print("TESTE FALHOU: Nome não foi atualizado no DB.")
            
    except Exception as e:
        print(f"ERRO durante o teste: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_update_profile()
