import pytest
import time
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:5173"

@pytest.fixture(scope="function", autouse=True)
def before_each(page: Page):
    page.goto(BASE_URL)

def test_quick_access(page: Page):
    """Testa o acesso rápido para SuperAdmin."""
    # Clica no botão de acesso rápido
    page.get_by_text("Acesso Rápido (SuperAdmin)").click()
    
    # Verifica se chegou no Dashboard
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=10000)
    print("Sucesso: Acesso rápido funcionou!")

def test_registration_and_login_logout(page: Page):
    """Testa o fluxo completo: Registro -> Logout -> Login."""
    timestamp = int(time.time())
    test_email = f"testuser_{timestamp}@example.com"
    test_password = "password123"
    test_name = "User Test E2E"
    test_workspace = f"Workspace Test {timestamp}"

    # 1. Registro
    page.get_by_role("button", name="Cadastre-se").click()
    
    page.get_by_placeholder("Seu nome").fill(test_name)
    page.get_by_placeholder("seu@email.com").fill(test_email)
    page.get_by_placeholder("Pelos menos 8 caracteres").fill(test_password)
    page.get_by_placeholder("Ex: Minha Empresa, Consultoria ABC...").fill(test_workspace)
    
    page.get_by_role("button", name="Criar Conta e Área de Trabalho").click()
    
    # Verifica se registrou e entrou
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=10000)
    print("Sucesso: Registro concluído!")

    # 2. Logout
    # Clica no perfil para abrir o menu
    page.locator(".user-profile").click()
    # Clica em Sair
    page.get_by_text("Sair").click()
    
    # Verifica se voltou para a tela de login
    expect(page.get_by_role("heading", name="Bem-vindo de volta")).to_be_visible()
    print("Sucesso: Logout concluído!")

    # 3. Login
    page.get_by_placeholder("seu@email.com").fill(test_email)
    page.get_by_placeholder("••••••••").fill(test_password)
    page.get_by_role("button", name="Entrar").click()
    
    # Verifica se logou novamente
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=10000)
    print("Sucesso: Login concluído!")
