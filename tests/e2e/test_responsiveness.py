import pytest
from playwright.sync_api import Page, expect

# Configurações de Viewports
VIEWPORTS = {
    "desktop": {"width": 1280, "height": 800},
    "tablet": {"width": 820, "height": 1180},  # iPad Air / Tablet Portrait
    "mobile": {"width": 375, "height": 667}    # iPhone SE / Mobile
}

BASE_URL = "http://localhost:3000"

@pytest.mark.parametrize("device", ["desktop", "tablet", "mobile"])
def test_layout_breakpoints(page: Page, device):
    """Teste para verificar a visibilidade dos elementos principais em diferentes breakpoints."""
    viewport = VIEWPORTS[device]
    page.set_viewport_size(viewport)
    
    # Navega para o Dashboard (considerando que o usuário pode estar logado ou redirecionado)
    page.goto(BASE_URL)
    
    # Aguarda o carregamento inicial (ajustar se houver loading screen)
    page.wait_for_timeout(1000)

    if device == "desktop":
        # Desktop: Sidebar deve estar visível, Mobile Header oculto
        expect(page.locator(".sidebar")).to_be_visible()
        expect(page.locator(".mobile-header")).not_to_be_visible()
        
    elif device == "tablet":
        # Tablet: Conforme App.jsx, mobile-header deve estar oculto (>767px)
        # Sidebar deve estar visível (se for o comportamento desejado para tablet)
        expect(page.locator(".sidebar")).to_be_visible()
        expect(page.locator(".mobile-header")).not_to_be_visible()
        
    elif device == "mobile":
        # Mobile: Mobile Header visível, Sidebar inicialmente oculta (depende da implementação)
        expect(page.locator(".mobile-header")).to_be_visible()
        
        # O botão hamburger deve estar visível
        hamburger = page.locator(".menu-toggle")
        expect(hamburger).to_be_visible()
        
        # Ao clicar no hamburger, a sidebar deve aparecer
        hamburger.click()
        expect(page.locator(".sidebar")).to_be_visible()

def test_screen_content_responsiveness(page: Page):
    """Teste específico para garantir que o conteúdo das telas não quebre."""
    # Testar Contacts no celular
    page.set_viewport_size(VIEWPORTS["mobile"])
    page.goto(f"{BASE_URL}/contacts") # Se a rota existir ou via clique na sidebar
    
    # Verifica se a tabela de contatos está dentro da área visível ou tem scroll
    container = page.locator(".contacts-container")
    expect(container).to_be_visible()
    
    # Verifica se o grid de cards (Dashboard) empilha em mobile
    page.set_viewport_size(VIEWPORTS["mobile"])
    page.goto(BASE_URL)
    
    # No mobile, os cards devem ter largura total (flex: 1 1 100%)
    first_card = page.locator(".stat-card").first
    box = first_card.bounding_box()
    if box:
        assert box['width'] > 300 # Deve ocupar quase toda a largura do viewport (375px)
