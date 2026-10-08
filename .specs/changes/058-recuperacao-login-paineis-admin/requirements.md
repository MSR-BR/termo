# Requisitos

- Migrar documento legado para termo.app.br antes das APIs, preservando rota e parâmetros OAuth sem registrá-los.
- Carregar público automaticamente; erro não equivale a lista vazia. Permitir nova consulta e invalidar seleção anterior.
- Mostrar contagem separada de opt-ins, aceite legal pendente e pausas; consulta limitada sinalizada, falha do diagnóstico nunca vira zero. Contagens de pausa e aceite podem se sobrepor.
- Preservar autorização server-side, aceite vigente, pausas, frequência e confirmação de envio.
- Textos e cards dentro da tela; tabelas com rolagem interna e foco por teclado.

## Rota planejada

- Classe: correção de autenticação e interface administrativa.
- Modelo: `gpt-6.1-sol`; reasoning: `high`.
- Justificativa: fluxo OAuth e consentimento exigem revisão cuidadosa.
- Fallback: `gpt-6.1-sol / xhigh`, somente após falha observável.
- Disponibilidade: catálogo do ambiente. Rota real não inferida.
