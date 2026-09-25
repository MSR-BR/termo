# Notas — Change 054

## Premissas

- Engajamento maior não implica aprendizagem maior.
- Avaliação negativa ou nula é resultado válido.
- Comunicação opcional não pode ser necessária para usar o TERMO.

## Decisões pendentes

- Aprovar futuramente o desenho prospectivo, instrumentos comparáveis de
  baseline/retenção/transferência e qualquer envio real.
- A T54 não enviou mensagens nem modificou campanhas ou orçamento.

## Decisões implementadas

- Janela padrão do painel: 28 dias, selecionável pela API entre 7 e 90 dias.
- Células de 1 a 4 registros são suprimidas.
- Opt-in começa desligado; consentimentos legados sem timestamp afirmativo são
  revogados pela migração.
- Pausa de 30 dias na interface; o contrato também admite 90 dias.
- Período de silêncio: 21h–8h, horário de Brasília.
- Limite: 1 campanha em 24 horas e 2 em 7 dias por destinatário.
- Descadastro sem login por token opaco e confirmação explícita.
- Conteúdo coercitivo conhecido é recusado antes do contato com o Resend.

## Publicação

- CPD autorizado pelo responsável em 25/09/2026 para a revisão validada.
- Migração remota aplicada ao projeto TERMO `guifkjjuxsdgwjlhkmnx` e verificada
  quanto a colunas, default, RLS, privilégios, índice único, tokens e histórico.
- Nenhuma campanha ou mensagem foi enviada durante a publicação.
- O commit, push e deploy são rastreados pelo Git e pelo Vercel, sem gravar um
  identificador autorreferente neste documento.
