---
name: Especialista em Testes de Integração (API & DB)
description: Especialista em garantir que os componentes do sistema funcionem juntos, testando desde as rotas da API até a persistência no banco de dados com suporte a multi-tenancy.
---

# Skill: Especialista em Testes de Integração (API & DB)

## 🎯 Objetivo
Validar fluxos de ponta a ponta (API -> Use Case -> Repo -> DB) garantindo a integridade dos dados, isolamento entre times (Multi-Tenancy) e conformidade com as regras de negócio em um ambiente controlado e determinístico.

## 🏗️ Estrutura de Testes
Os testes de integração devem ser organizados em:
- `tests/integration/`: Testes que envolvem rotas da API e persistência real (ou em memória).
- `tests/integration/flows/`: Testes de processos complexos que envolvem múltiplos passos ou entidades interdependentes.

## 🛠️ Frameworks e Ferramentas
- **Backend (Python)**: Use `pytest`, `httpx` e `FastAPI TestClient`.
- **Database**: Use SQLite em memória (`sqlite:///:memory:`) para garantir velocidade e isolamento total entre execuções.
- **Async**: Use `pytest-asyncio` se as rotas forem assíncronas.

## 📐 Regras Técnicas de Implementação

### 1. Isolamento e Determinismo
- **Banco de Dados Limpo**: Todo teste deve iniciar com um esquema de banco de dados limpo e ser descartado ao final.
- **Fixtures Globais**: Use `conftest.py` para gerenciar a criação do banco de dados e o override da dependência `get_db`.

### 2. Validação Multi-Tenancy (X-Team-ID)
- **Obrigatoriedade**: Todo teste de integração de recursos (Contatos, Empresas, Propriedades) DEVE incluir o header `X-Team-ID`.
- **Teste de Vazamento**: Sempre inclua um teste que verifique se dados de um Time A NÃO são acessíveis por um Time B.

### 3. Padrão de Chamada
- Use o `client` (TestClient) para simular chamadas HTTP reais.
- Verifique tanto o `status_code` quanto o conteúdo do JSON retornado.
- Opcionalmente, verifique o estado do banco de dados diretamente via `db_session` para garantir persistência.

## 🚀 Comandos de Saída (Output)
Ao atuar como Especialista em Testes de Integração, a skill deve fornecer:
1. O **Arquivo de Teste** (ex: `test_complex_flow.py`).
2. Atualização de **Fixtures** se necessário.
3. Comando para **Executar os Testes**: `python run_tests.py` ou `pytest tests/integration`.

## 💡 Melhores Práticas
- **Mocks Externos**: Se o sistema consome APIs externas, use `httpx-mock` ou similar para isolar o teste de rede.
- **Seeds Determinísticos**: Crie fixtures que preparem o cenário (ex: `auth_headers`, `created_company`).
