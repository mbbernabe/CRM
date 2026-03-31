---
name: Especialista em Domínio (DDD & Python)
description: Especialista em modelagem de domínio rica, focado em Entidades, Objetos de Valor e Regras de Negócio puras com validação via Result Objects e Exceptions.
---

# Skill: Especialista em Domínio (DDD & Python)

## 🎯 Objetivo
Criar modelos de domínio puros que encapsulam a lógica de negócio e invariantes, seguindo rigorosamente os princípios de **Domain-Driven Design (DDD)** e **Clean Architecture**.

## 🏗️ Estrutura de Diretórios Granular
Todo código de domínio deve ser organizado da seguinte forma:
- `src/domain/entities/`: Classes com identidade única e ciclo de vida (ex: `Contact`, `Order`).
- `src/domain/value_objects/`: Objetos imutáveis definidos por seus atributos (ex: `Email`, `CPF`, `Address`).
- `src/domain/services/`: Lógica de negócio que envolve múltiplas entidades ou não pertence a uma entidade específica.
- `src/domain/repositories/`: Interfaces (`Protocols`) que definem como os agregados são persistidos.
- `src/domain/exceptions/`: Exceções para erros **Excepcionais/Críticos** (falhas sistêmicas).
- `src/domain/results/`: Classes para lidar com erros de **Negócio Previsíveis** (fluxo normal).

## 🛠️ Padrões de Validação e Erros

### 1. Result Objects (Erros Previsíveis)
Use para falhas que fazem parte da regra de negócio (ex: "Saldo Insuficiente", "Documento Inválido").
**Exemplo de implementação sugerida:**
```python
@dataclass
class Result:
    is_success: bool
    error: Optional[str] = None
    value: Any = None

    @staticmethod
    def ok(value: Any = None):
        return Result(True, value=value)

    @staticmethod
    def fail(error: str):
        return Result(False, error=error)
```

### 2. Exceptions (Erros Excepcionais)
Use para interromper o fluxo quando o sistema entra em estado inválido ou erro de infraestrutura.
- Ex: `DatabaseConnectionError`, `ConfigurationMissingError`, `UnexpectedNullError`.

## 📐 Regras Técnicas de Implementação

### Entidades e Value Objects
- **Entidades**: Usar `dataclasses`. Devem validar invariantes no `__post_init__` ou via métodos de fábrica (`classmethod`).
- **Value Objects**: Devem ser imutáveis (`@dataclass(frozen=True)`).
- **Pureza**: Proibida a importação de `application` ou `infrastructure`. Só é permitida a biblioteca padrão do Python.

### Repositórios (Interfaces)
- Definir como `typing.Protocol`.
- O nome deve começar com `I` (ex: `IContactRepository`).
- Devem lidar apenas com Entidades de Domínio.

## 🚀 Comandos de Saída (Output)
Ao modelar o domínio, a skill deve fornecer:
1. A definição da **Entidade** ou **VO**.
2. As **Exceptions** customizadas (se necessário).
3. O **Result Object** para casos de falha de validação.
4. A **Interface do Repositório** correspondente.
