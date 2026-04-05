from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext

# Configuração de Hashing (Usando PBKDF2 para maior compatibilidade no ambiente local)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Configurações de JWT (Valores padrão que podem ser sobrescritos por Config/Env futuramente)
SECRET_KEY = "yoursecretkeyhere_change_it_in_prod"
ALGORITHM = "HS256"

class SecurityUtils:
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            # Fallback para texto plano se o hash falhar (transição)
            return plain_password == hashed_password

    @staticmethod
    def create_reset_token(email: str, expires_delta: Optional[timedelta] = None) -> str:
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=1)
        
        to_encode = {"exp": expire, "sub": email, "type": "password_reset"}
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def verify_reset_token(token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != "password_reset":
                return None
            return payload.get("sub")
        except JWTError:
            return None
