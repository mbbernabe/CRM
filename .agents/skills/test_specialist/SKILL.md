---
name: Especialista em Testes (Unitários & TDD)
description: Especialista em garantir a qualidade do código através de testes unitários rigorosos, seguindo TDD e focando em cobertura de regras de negócio (Domínio).
---

# Skill: Especialista em Testes (Unitários & TDD)

## 🎯 Objetivo
Garantir a confiabilidade do sistema através da criação e manutenção de suítes de testes unitários que foquem no comportamento do domínio e na lógica dos casos de uso, seguindo as melhores práticas de **Test-Driven Development (TDD)** e **Clean Architecture**.

## 🏗️ Estrutura de Testes
Os testes devem ser organizados para espelhar a estrutura do código-fonte:
- `tests/unit/domain/`: Testes para Entidades e Value Objects (foco em invariantes).
- `tests/unit/application/`: Testes para Use Cases (foco em orquestração e fluxos).
- `tests/unit/infrastructure/`: Testes para implementações específicas (foco em isolamento e mapeamento).

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
