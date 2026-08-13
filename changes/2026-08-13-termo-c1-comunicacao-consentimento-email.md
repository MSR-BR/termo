# Change Plan: TERMO C1 — Comunicacao, Consentimento e E-mail

## Objetivo

Preparar o TERMO para comunicar novidades do produto a usuarios cadastrados de
forma clara, opcional e rastreavel. O C1 nao altera capitulos, exercicios,
simuladores, regras de desbloqueio ou a campanha de Google Ads.

O envio de e-mails fica fora do primeiro deploy tecnico: ele so entra depois
que houver remetente, provedor, fluxo de descadastro e teste de entrega
definidos.

## Situacao atual

- O login Google fornece nome, e-mail e imagem de perfil para autenticacao e
  continuidade de estudo.
- A aplicacao publica apenas Privacidade e Suporte em modal; nao ha Termos de
  Uso publicados.
- Nao ha preferencia de novidades, registro de aceite, provedor de envio nem
  mecanismo de descadastro.
- Os usuarios existentes nao devem ser considerados inscritos em comunicacoes
  de novidades por terem apenas criado uma conta.

## Escopo do C1

### C1-A — Documentos publicos

- Publicar `termos.html` e `privacidade.html`, com versao e data de vigencia.
- Incluir links permanentes no rodape do app.
- Preservar o conteudo educacional aberto sem exigir cadastro.

### C1-B — Registro de aceite e preferencias

- Criar registros separados para aceite de documentos e preferencia de
  novidades por e-mail.
- Registrar a versao aceita e a data do aceite.
- Exibir a preferencia de novidades ligada inicialmente; o usuario pode
  desliga-la a qualquer momento.
- Permitir que cada usuario reveja e altere apenas seus proprios registros.

### C1-C — Area Pessoal

- Mostrar os links para Termos e Privacidade na area da conta.
- Solicitar aceite dos documentos para os recursos autenticados, sem fechar o
  acesso publico ao material.
- Exibir a opcao `Quero receber novidades e recursos do TERMO por e-mail`,
  acompanhada de explicacao curta e opcao de cancelar posteriormente.

### C1-D — Medicao

- Registrar eventos sem e-mail, nome ou outro dado pessoal no GA4:
  `terms_accepted`, `privacy_acknowledged`,
  `email_updates_preference_changed` e `home_study_cta_click`.

### C1-E — Envio de e-mail (fase posterior do C1)

- Escolher provedor, remetente e dominio.
- Configurar autenticacao de dominio, descadastro, supressao de enderecos que
  falharem e teste interno.
- Definir segmentos e frequencia antes do primeiro envio.

## Decisoes pendentes do responsavel pelo projeto

Antes de publicar C1-A, confirmar:

1. quem aparecera como responsavel pelo TERMO nos documentos (nome e eventual
   instituicao);
2. e-mail de contato para privacidade e suporte;
3. se o aceite dos Termos sera exigido apenas para recursos de conta
   (recomendado) ou para toda a navegacao;
4. versao inicial e data de vigencia dos documentos.

Antes de iniciar C1-E, confirmar remetente, provedor e politica inicial de
frequencia.

## Validacao

- Conteudo publico segue navegavel sem login.
- Usuario autenticado visualiza Termos, Privacidade e sua preferencia atual.
- Novo usuario inicia sem opt-in de novidades.
- Alterar a preferencia registra data, sem expor dados pessoais em analytics.
- Usuario so consulta e altera seus proprios registros.
- Os eventos do C1 aparecem em ambiente de teste.

## Riscos a evitar

- tratar aceite de Termos como autorizacao automatica para marketing;
- enviar e-mail antes de haver descadastro testado;
- guardar e-mail ou nome em eventos analiticos;
- interromper o acesso aberto aos capitulos;
- misturar esta iniciativa com desbloqueios de simulados.
