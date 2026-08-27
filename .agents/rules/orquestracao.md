---
trigger: always_on
---

# REGRA CRÍTICA DE ORQUESTRAÇÃO - PROXY "SELF"

Ao orquestrar subagentes personalizados, você DEVE OBRIGATORIAMENTE usar o método de proxy de injeção direta para evitar erros de provisionamento. Siga estes passos exatos:

1. Ler o Contrato: Use a ferramenta `read_file` para ler todo o conteúdo do arquivo Markdown do agente alvo no espaço de trabalho (ex: `.agents/agents/<nome_do_agente>.md`).
2. Invocar o Proxy: Chame a ferramenta `invoke_subagent` definindo o nome/destinatário estritamente como `"self"`.
3. Injetar o Contexto: No parâmetro de prompt da ferramenta, concatene o conteúdo literal do arquivo `.md` lido no Passo 1 juntamente com as instruções detalhadas da solicitação atual do usuário.
