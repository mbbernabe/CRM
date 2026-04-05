import pytest
import time
from playwright.sync_api import Page, expect

# Configurações
BASE_URL = "http://localhost:5173"

@pytest.mark.e2e
def test_full_auth_flow(page: Page):
    """
    Testa o fluxo completo de autenticação:
    1. Registro de novo usuário e time.
    2. Logout.
    3. Login com o usuário criado.
    """
    
    # 1. Acesso inicial
    print(f"Acessando {BASE_URL}...")
    page.goto(BASE_URL)
    
    # 2. Navegar para Registro
    print("Navegando para tela de registro...")
    # Verifica se estamos na tela de login e clica no link de registro
    page.get_by_role("button", name="Cadastre-se").click()
    expect(page.get_by_role("heading", name="Crie sua conta")).to_be_visible()
    
    # 3. Preencher formulário de registro
    # Usando dados únicos para evitar conflitos se o DB não for limpo
    timestamp = int(time.time())
    email = f"qa_{timestamp}@antigravity.test"
    password = "password123"
    
    print(f"Registrando usuário: {email}")
    page.get_by_placeholder("Seu nome").fill("Agente QA")
    page.get_by_placeholder("seu@email.com").fill(email)
    page.get_by_placeholder("Pelos menos 8 caracteres").fill(password)
    page.get_by_placeholder("Ex: Marketing Digital, Vendas SP...").fill(f"Time QA {timestamp}")
    
    page.get_by_role("button", name="Criar Conta e Time").click()
    
    # 4. Verificar se entramos no sistema (Dashboard)
    # O App.jsx define 'dashboard' como a tela inicial após login
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=15000)
    print("Registro e login automático bem-sucedidos.")

    # 5. Logout
    print("Realizando Logout...")
    # Clicar no perfil (canto inferior esquerdo no Sidebar)
    page.locator(".user-profile").click()
    # Clicar no botão Sair do dropdown
    page.locator(".dropdown-item.logout").click()
    
    # 6. Verificar se voltou para tela de Login
    expect(page.get_by_role("heading", name="Bem-vindo de volta")).to_be_visible()
    print("Logout bem-sucedido.")

    # 7. Login Real
    print(f"Testando Login real com {email}...")
    page.get_by_placeholder("seu@email.com").fill(email)
    page.get_by_placeholder("••••••••").fill(password)
    page.get_by_role("button", name="Entrar").click()
    
    # 8. Verificar dashboard final
    expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()
    print("Login bem-sucedido. Teste finalizado com sucesso.")
