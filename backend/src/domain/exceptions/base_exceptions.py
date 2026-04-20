class DomainException(Exception):
    """Exceção base para erros de negócio que devem ser exibidos ao usuário."""
    def __init__(self, message: str, data: dict = None):
        self.message = message
        self.data = data or {}
        super().__init__(self.message)

class AuthenticationException(DomainException):
    """Erros relacionados a login e registro."""
    pass

class UnauthorizedException(DomainException):
    """Erros de permissão."""
    pass
