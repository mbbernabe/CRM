import pytest
import time
from playwright.sync_api import Page, expect

@pytest.mark.e2e
def test_full_auth_flow(page: Page, base_url: str):
    """
    Testa o fluxo completo de autenticação:
    1. Registro de novo usuário e time.
    2. Logout.
    3. Login com o usuário criado.
    """
    
    # 1. Acesso inicial
    print(f"Acessando {base_url}...")
    page.goto(base_url)
    
    # 2. Navegar para Registro
    print("Navegando para tela de registro...")
    # Verifica se estamos na tela de login e clica no link de registro
    page.get_by_role("button", name="Cadastre-se").click()
    expect(page.get_by_role("heading", name="Crie sua conta")).to_be_visible()
    
    # 3. Preencher formulário de registro
    # Usando dados únicos para evitar conflitos se o DB não for limpo
    timestamp = int(time.time())
    email = f"qa_{timestamp}@example.com"
    password = "password123"
    
    print(f"Registrando usuário: {email}")
    name = "Agente QA"
    page.get_by_placeholder("Seu nome").fill(name)
    page.get_by_placeholder("seu@email.com").fill(email)
    page.get_by_placeholder("Pelos menos 8 caracteres").fill(password)
    # Placeholder atual: "Ex: Minha Empresa, Consultoria ABC..."
    page.get_by_placeholder("Ex: Minha Empresa, Consultoria ABC...").fill(f"Empresa QA {timestamp}")
    
    # Botão atual: "Criar Conta e Área de Trabalho"
    page.get_by_role("button", name="Criar Conta e Área de Trabalho").click()
    
    # 4. Verificar se entramos no sistema (Dashboard)
    try:
        expect(page.get_by_text("Dashboard").first).to_be_visible(timeout=20000)
        print("Registro e login automático bem-sucedidos.")
    except Exception as e:
        print("FALHA: Dashboard não apareceu. Capturando screenshot...")
        page.screenshot(path="tests/e2e/failure_registration.png")
        raise e

    # 5. Logout
    print("Realizando Logout...")
    try:
        # Abrir menu de perfil
        page.get_by_text(name).first.click()
        page.wait_for_timeout(500)
        # Clicar no botão Sair (menu dropdown)
        page.get_by_text("Sair").click()
        
        # 6. Verificar se voltou para tela de Login (dentro da mesma URL /)
        expect(page.get_by_text("Bem-vindo de volta")).to_be_visible(timeout=10000)
        print("Logout bem-sucedido.")
    except Exception as e:
        print("FALHA no Logout. Capturando screenshot...")
        page.screenshot(path="tests/e2e/failure_logout.png")
        raise e

    # 7. Login Real
    print(f"Testando Login real com {email}...")
    try:
        # Garantir que estamos na tela de login
        if not page.get_by_placeholder("seu@email.com").is_visible():
            page.get_by_text("Entrar").first.click() # Caso tenha caído na tela de registro

        page.get_by_placeholder("seu@email.com").fill(email)
        page.get_by_placeholder("••••••••").fill(password)
        page.get_by_role("button", name="Entrar").click()
        
        # 8. Verificar dashboard final
        expect(page.get_by_text("Dashboard").first).to_be_visible(timeout=20000)
        print("Login bem-sucedido. Teste finalizado com sucesso.")
    except Exception as e:
        print("FALHA no Login Real. Capturando screenshot...")
        page.screenshot(path="tests/e2e/failure_login_real.png")
        raise e
