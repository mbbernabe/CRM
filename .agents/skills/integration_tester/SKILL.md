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
- `scripts/testing/`: Scripts de massa de dados complexa, automações de testes e ferramentas auxiliares de diagnóstico de integração.

## 🛠️ Frameworks e Ferramentas
- **Backend (Python)**: Use `pytest`, `httpx` e `FastAPI TestClient`.
- **Database**: Use SQLite em memória (`sqlite:///:memory:`) para garantir velocidade e isolamento total entre execuções.
- **Async**: Use `pytest-asyncio` se as rotas forem assíncronas.

## 📐 Regras Técnicas de Implementação

### 1. Isolamento e Determinismo
- **Banco de Dados Limpo**: Todo teste deve iniciar com um esquema de banco de dados limpo e ser descartado ao final.
- **Fixtures Globais**: Use `conftest.py` para gerenciar a criação do banco de dados e o override da dependência `get_db`.

### 2. Validação Multi-Tenancy (Workspace Context)
- **Obrigatoriedade**: Todo teste de integração DEVE validar que o `workspace_id` foi injetado via header ou contexto.
- **Teste de Vazamento**: SEMPRE valide que um usuário do Workspace X NÃO acessa dados do Workspace Y.
- **Scripts de Fluxo**: Use `backend/scripts/testing/` para scripts de integração de ponta a ponta (como cadastro -> login).

### 3. Padrão de Chamada e Diagnóstico
- Use o `client` (TestClient) para rotas individuais.
- Para fluxos de negócio complexos, crie scripts `.py` determinísticos em `scripts/tasks/` ou `scripts/testing/`.
- Verifique se as mensagens de erro retornadas são **amigáveis ao usuário** (em Português), enquanto erros técnicos ficam nos logs.

## 🚀 Comandos de Saída (Output)
Ao atuar como Especialista em Testes de Integração, a skill deve fornecer:
1. O **Arquivo de Teste** (ex: `test_complex_flow.py`).
2. Atualização de **Fixtures** se necessário.
3. Comando para **Executar os Testes**: `python run_tests.py` ou `pytest tests/integration`.

## 💡 Melhores Práticas
- **Mocks Externos**: Se o sistema consome APIs externas, use `httpx-mock` ou similar para isolar o teste de rede.
- **Seeds Determinísticos**: Crie fixtures que preparem o cenário (ex: `auth_headers`, `created_company`).
