---
name: Especialista em Testes de Integração (API & DB)
description: Especialista em garantir que os componentes do sistema funcionem juntos, testando desde as rotas da API até a persistência no banco de dados com suporte a multi-tenancy.
---

# Skill: Especialista em Testes de Integração (API & DB)

## 🎯 Objetivo
Validar fluxos de ponta a ponta (API -> Use Case -> Repo -> DB) garantindo a integridade dos dados, isolamento entre times (Multi-Tenancy) e conformidade com as regras de negócio em um ambiente controlado e determinístico.

## 🏗️ Estrutura de Testes
Os testes de integração devem ser organizados centralizadamente na raiz:
- `tests/backend/integration/`: Testes que envolvem rotas da API e persistência real (ou em memória).
- `tests/backend/integration/flows/`: Testes de processos complexos que envolvem múltiplos passos ou entidades interdependentes.
- `tests/security/`: Testes de segurança (IDOR, Bypass) em colaboração com o `security_specialist`.
- `tests/data/`: Massa de dados estática para testes de importação e preenchimento.
- `tests/scripts/`: Scripts de massa de dados complexa, automações de testes e ferramentas auxiliares de diagnóstico de integração.

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
- **Scripts de Fluxo**: Use `tests/scripts/` para scripts de integração de ponta a ponta (como cadastro -> login).

### 3. Padrão de Chamada e Diagnóstico
- Use o `client` (TestClient) para rotas individuais.
- Para fluxos de negócio complexos, crie scripts `.py` determinísticos em `scripts/tasks/` ou `scripts/testing/`.
- Verifique se as mensagens de erro retornadas são **amigáveis ao usuário** (em Português), enquanto erros técnicos ficam nos logs.

## 🚀 Comandos de Saída (Output)
Ao atuar como Especialista em Testes de Integração, a skill deve fornecer:
1. O **Arquivo de Teste** (ex: `test_complex_flow.py`).
2. Atualização de **Fixtures** se necessário.
3. Comando para **Executar os Testes**: `pytest tests/backend/integration`.

## 💡 Melhores Práticas
- **Mocks Externos**: Se o sistema consome APIs externas, use `httpx-mock` ou similar para isolar o teste de rede.
- **Seeds Determinísticos**: Crie fixtures que preparem o cenário (ex: `auth_headers`, `created_company`).

## ⚡ Validação de Performance (OBRIGATÓRIO)

> **Contexto:** Com PostgreSQL remoto (Supabase), N+1 queries e ausência de índices causam degradação grave. Testes de integração DEVEM validar performance.

### 1. Detecção de N+1 Queries
- **Regra:** Ao testar endpoints que retornam listas com relacionamentos (ex: `GET /workitems/types`), validar que o número de queries **não cresce linearmente** com o número de registros.
- **Como testar:** Usar SQLAlchemy event listeners para contar queries:
  ```python
  from sqlalchemy import event
  
  query_count = 0
  @event.listens_for(engine, "before_cursor_execute")
  def count_queries(*args, **kwargs):
      nonlocal query_count
      query_count += 1
  
  # Executar endpoint
  response = client.get("/workitems/types")
  
  # Validar: com 5 tipos, deve ser no máximo ~3 queries (não 11+)
  assert query_count <= 5, f"Possível N+1 detectado: {query_count} queries"
  ```

### 2. Validação de Eager Loading
- **Regra:** Todo novo repositório que acessa relacionamentos DEVE ser testado para garantir que usa `selectinload` ou `joinedload`.
- **Padrão de teste:**
  ```python
  def test_list_types_no_n_plus_one(client, db_session):
      """Verifica que list_types usa eager loading."""
      # Criar 5 tipos com campos e grupos
      for i in range(5):
          create_type_with_fields(db_session, f"type_{i}", num_fields=3)
      
      # A query count deve ser constante (não proporcional a N)
      response = client.get("/workitems/types", headers=auth_headers)
      assert response.status_code == 200
      assert len(response.json()) == 5
  ```

### 3. Validação de Índices
- **Regra:** Ao criar novas tabelas com `workspace_id`, o teste DEVE verificar que o índice existe:
  ```python
  def test_workspace_id_has_index(db_session):
      from sqlalchemy import inspect
      inspector = inspect(db_session.bind)
      indexes = inspector.get_indexes('nova_tabela')
      workspace_idx = [i for i in indexes if 'workspace_id' in i['column_names']]
      assert len(workspace_idx) > 0, "Falta índice em workspace_id"
  ```

