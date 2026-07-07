# Matriz de Competências (Skills) - Engenheiro Python Sênior

Este documento detalha o perfil técnico, arquitetural e as competências esperadas para a atuação no nível Sênior no ecossistema Python focado em bibliotecas, microsserviços e engenharia de software de alta performance, com fortíssima base em testes automáticos.

---

## 1. Hard Skills (Competências Técnicas Core)

### A. Linguagem Python Avançada

- **Domínio de Internos da Linguagem:** Gerenciamento de memória, GIL (Global Interpreter Lock), Garbage Collection e manipulação de escopos.
- **Concorrência e Assincronismo:** Uso proficiente de `asyncio`, `threading`, e `multiprocessing`, sabendo discernir quando o gargalo é I/O-bound ou CPU-bound.
- **Sistemas de Tipagem Estrita:** Tipagem avançada utilizando `Mypy`, `TypeVar`, `Generic`, `Protocol`, `Literal` e `Annotated`.

### B. Arquitetura e Design de Software

- **DDD (Domain-Driven Design):** Modelagem de domínios complexos, separação de Entidades, Value Objects, Agregados, Repositórios e Serviços de Domínio.
- **Padrões Arquiteturais:** Implementação prática de Clean Architecture, Hexagonal Architecture (Ports and Adapters) e isolamento de conectores.
- **Design Patterns Gof & Pythonicos:** Aplicação consciente de padrões de projeto adaptados à realidade e idiomatismo da linguagem Python.

### C. Cultura de Qualidade e TDD Absoluto

- **Maestria em TDD (Test-Driven Development):** Proficiência em desenvolver soluções guiadas estritamente por testes (Ciclo Red-Green-Refactor). Capacidade de desenhar a interface de uso antes da implementação real.
- **Engenharia de Testes (Pytest):** Uso avançado do ecossistema Pytest. Criação de `fixtures` modulares, parametrização extensiva de cenários (`@pytest.mark.parametrize`), espionagem e mutação de código.
- **Testes Unitários:** Habilidade excepcional no uso de `unittest.mock` (ou equivalentes no Pytest como `pytest-mock`) para isolamento hermético de regras de domínio e simulação de estados anômalos.
- **Testes Integrativos e E2E:** Criação de cenários de teste para componentes de fronteira, garantindo o funcionamento de integrações com bancos de dados reais (usando _testcontainers_ ou bancos em memória) e serviços de rede externos via `responses` ou `VCR.py`.

### D. Ecossistema e DevOps

- **Gerenciamento e Build:** Maestria em `Poetry` (configuração de grupos de dependências, builds de pacotes usando _src layout_ e deploy em registries).
- **Tooling e CI/CD:** Configuração de `Ruff` e pipelines automatizados (GitHub Actions/GitLab CI) para bloqueio de merges que não atinjam 100% de passagem nos testes e coberturas mínimas (`pytest-cov`).

---

## 2. Competências Metodológicas (Práticas de Engenharia)

- **Mentalidade "Test First":** Acredita que o código não testado é código quebrado. Todo pull request ou nova feature nasce a partir de um teste falho.
- **KISS & YAGNI:** Habilidade em identificar e cortar código supérfluo, mantendo sistemas simples e focados na solução atual, sem tentar prever requisitos que não existem.
- **Refatoração Segura:** Capacidade de reestruturar grandes bases de código sem medo, utilizando a vasta cobertura de testes unitários e de integração como rede de segurança para garantir a ausência de regressões.
