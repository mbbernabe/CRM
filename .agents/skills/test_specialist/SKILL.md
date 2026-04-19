---
name: Especialista em Testes (Unitários & TDD)
description: Especialista em garantir a qualidade do código através de testes unitários rigorosos, seguindo TDD e focando em cobertura de regras de negócio (Domínio).
---

# Skill: Especialista em Testes (Unitários & TDD)

## 🎯 Objetivo
Garantir a confiabilidade do sistema através da criação e manutenção de suítes de testes unitários que foquem no comportamento do domínio e na lógica dos casos de uso, seguindo as melhores práticas de **Test-Driven Development (TDD)** e **Clean Architecture**.

## 🏗️ Estrutura de Testes
Os testes devem ser organizados para espelhar a estrutura do código-fonte:
- `tests/unit/domain/`: Testes para Entidades (sempre validando `workspace_id`) e Value Objects.
- `tests/unit/application/`: Testes para Use Cases (validando isolamento por workspace e mensagens amigáveis).
- `scripts/testing/`: Scripts determinísticos de suporte, mocks reutilizáveis e massa de dados em `backend/scripts/`.

## 📐 Regras Técnicas de Implementação (Foco em Workspace)
1. **Contexto de Workspace**: Todo teste deve garantir que o `workspace_id` correto está sendo passado e utilizado nos repositórios.
2. **Mensagens Amigáveis**: Validar que exceções de domínio (`DomainException`) retornam as mensagens esperadas em Português para o usuário.
3. **Scripts de Suporte**: Se um teste exige um cenário complexo, crie um script auxiliar em `backend/scripts/testing/`.

## 🛠️ Frameworks e Ferramentas
- **Python**: Use `pytest` e `unittest.mock`.
- **JavaScript/React**: Use `Vitest` ou `Jest` junto com `React Testing Library`.

## 📐 Regras Técnicas de Implementação

### 1. Padrão AAA (Arrange, Act, Assert)
Todo teste deve ser dividido em três partes claras:
- **Arrange**: Preparar os dados, mocks e o estado necessário.
- **Act**: Executar a ação ou método que está sendo testado.
- **Assert**: Verificar se o resultado e os efeitos colaterais são os esperados.

### 2. Isolamento e Mocks
- **Unidade Pura**: Testes unitários NÃO devem acessar banco de dados, rede ou sistema de arquivos.
- **Mocks**: Use mocks para interfaces (`Protocols` no Python) para isolar o componente sob teste.
- **Fixtures**: Use `conftest.py` para compartilhar dados de teste e setups comuns.

### 3. Cobertura Mínima
- **Regra**: Todo código novo ou modificado deve ter, no mínimo, **80% de cobertura de código**.
- Priorize testar caminhos felizes e, especialmente, casos de borda e tratamentos de erro (`Result.fail`, `Exceptions`).

## 🚀 Comandos de Saída (Output)
Ao atuar como Especialista em Testes, a skill deve fornecer:
1. O **Arquivo de Teste** completo (ex: `test_contact_entity.py`).
2. Definição de **Fixtures** necessárias (ex: `conftest.py`).
3. Comandos para **Executar os Testes** e verificar a cobertura.

## 💡 Princípios TDD
1. **Red**: Escreva um teste que falha para uma nova funcionalidade.
2. **Green**: Escreva o código mínimo necessário para fazer o teste passar.
3. **Refactor**: Melhore o código mantendo o teste passando.

## ⚡ Testes de Performance em Repositórios (OBRIGATÓRIO)

> **Contexto:** Com PostgreSQL remoto, N+1 queries e lazy loading causam degradação grave. Testes unitários devem prevenir regressões de performance.

### 1. Verificação de Eager Loading nos Mocks
- **Regra:** Ao testar Use Cases que chamam métodos de repositório com relacionamentos, verificar que os mocks simulam o cenário de eager loading (dados já carregados).
- **Padrão:**
  ```python
  def test_list_types_returns_with_field_definitions():
      """Verifica que list_types retorna tipos com field_definitions já carregadas."""
      mock_repo = Mock()
      mock_repo.list_types.return_value = [
          WorkItemType(id=1, name="deal", field_definitions=[...], field_groups=[...])
      ]
      # O Use Case NÃO deve precisar fazer chamadas extras para carregar relacionamentos
  ```

### 2. Teste de Estrutura de Models (Índices)
- **Regra:** Para novos modelos, criar testes que verificam a presença de `index=True` em `workspace_id`:
  ```python
  def test_model_has_workspace_index():
      """Verifica que workspace_id tem índice para performance."""
      col = NovoModel.__table__.columns['workspace_id']
      assert col.index is True, "workspace_id DEVE ter index=True"
  ```

### 3. Teste de Constante API_BASE_URL (Frontend)
- **Regra (Vitest/Jest):** Verificar que componentes usam `API_BASE_URL` e não URLs hardcoded:
  ```javascript
  test('não deve conter URLs hardcoded', () => {
      const source = fs.readFileSync('src/components/NovoComponente.jsx', 'utf-8');
      expect(source).not.toContain('http://localhost:8000');
  });
  ```

