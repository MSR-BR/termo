# Change Plan: TERMO C5 — Retenção por e-mail com limite de frequência

## Objetivo

Trazer alunos de volta ao estudo sem transformar o e-mail em spam e sem enviar
campanhas para quem não escolheu receber novidades.

## Regra de elegibilidade

Um aluno é elegível somente quando:

- aceitou as versões atuais de Termos e Privacidade;
- `email_updates_opted_in = true`;
- não registrou atividade de estudo nos últimos 7 dias;
- não recebeu convite de retorno nos últimos 7 dias;
- não atingiu o limite de lembretes sem retorno (proposta: pausar após 3).

Quando ele volta e inicia estudo, a contagem de lembretes é reiniciada.

## Mensagem

- Assunto e conteúdo curtos, voltados a continuar o capítulo ou praticar com
  exercícios IA.
- CTA individual para `index.html?view=chapters&chapter=01` ou para o último
  capítulo iniciado quando houver essa informação confiável.
- Simulados só são citados quando já estiverem liberados para aquele usuário.
- Todo e-mail inclui o mecanismo imediato de cancelar novidades.

## Implementação técnica

1. Criar histórico de entrega por destinatário para campanhas e lembretes.
2. Registrar atividade de estudo autenticada sem conteúdo pessoal no evento.
3. Criar uma seleção de destinatários no servidor com os limites acima.
4. Exibir no painel de Comunicação a prévia de destinatários, data de último
   estudo, último contato e motivo de exclusão, sem expor dados além do
   necessário ao administrador.
5. Exigir revisão e confirmação explícita do administrador antes de cada envio;
   não haverá cron ou disparo automático.
6. Registrar resultado de cada envio e falhas/supressões do Resend.

## Dependências

- Migração Supabase para histórico e estado de retenção.
- API Resend já configurada e domínio verificado.

## Validação

- Nenhum destinatário sem opt-in recebe convite.
- O mesmo usuário não recebe dois convites em menos de 7 dias.
- Um retorno ao estudo interrompe o ciclo.
- Um cancelamento impede envios posteriores imediatamente.
- Há registro auditável de cada tentativa e entrega.

## Riscos a evitar

- tratar aceite jurídico como consentimento de marketing;
- disparar lembretes automaticamente;
- disparar e-mails em massa sem prévia;
- usar simuladores como promessa para aluno que ainda não os desbloqueou.
