# Despesas a partir de transações bancárias

> **Status:** futuro, sem prazo (Fase 8 do [PLANO.md](PLANO.md)). Nada deste documento está implementado.
>
> A entrega atual é a **importação de extratos e faturas** ([IMPORTACAO-EXTRATOS.md](IMPORTACAO-EXTRATOS.md), Fase 5, etapa 5B). Esta conexão automática reaproveita a mesma lista de Pendências. Onde este documento fala em `BankTransaction`, leia `PendingTransaction` com `source = BANK_CONNECTION`.

Em vez de enviar arquivos, o usuário conecta suas contas bancárias e **toda transação** (débito, crédito, Pix, transferência recebida etc.) chega sozinha à lista de **Pendências** e é notificada no celular. O usuário decide o que fazer com cada uma; ao registrar uma despesa, o formulário já vem preenchido.

## 0. Ordem de entrega

1. **Fase 5B (primeiro):** importação de extratos e faturas, com a lista de Pendências no web e no mobile.
2. **Conexão com o banco:** sincronização automática alimentando a mesma lista.
3. **Notificações (por último):** só depois da conexão e das dependências da Fase 4 (serviço `notify`, token FCM e preferências).
4. **Rendas:** créditos já chegam à lista; a etapa 5C da Fase 5 permite registrá-los como renda.

### Agregador (pesquisa de 2026-10)

Para uso pessoal, a opção gratuita encontrada é o **Meu Pluggy** (Pluggy): API com Client ID e Secret, webhook, 5 conexões ativas por titular e sincronização a cada 24 horas; só para os dados do próprio usuário. Os planos empresariais custam a partir de R$ 2.500/mês (Pluggy) e US$ 1.000/mês (Belvo, fonte de terceiros). Consequências: o aviso pode atrasar até um dia, e a integração fica restrita ao dono da conta, com credenciais em variáveis de ambiente e conexão feita no site do Meu Pluggy. Confirmar termos e cobertura dos bancos antes de decidir.

## 1. Fluxo

```text
Banco ──(Open Finance)──► Agregador ──webhook──► API Equaliza
                                                      │ busca a transação por id,
                                                      │ deduplica e grava em "Pendência"
                                                      │ (débito ou crédito)
                          ┌───────────────────────────┤
                          ▼                           ▼
              lista de Pendências            push (FCM/APNs) ──► celular   [última etapa]
              (web e mobile)                          │ toque
                          │◄──────────────────────────┘
                          ▼
           abre a pendência (exige sessão e biometria no mobile)
              │                │                      │
   débito: "Registrar     crédito: "Registrar     "Ignorar"
   despesa"               como renda"                 │
              │           (etapa futura)         marca como lida
   formulário pré-preenchido                     e apaga os dados
   (valor, data, descrição);
   escolhe a família se houver
   mais de uma; categoria obrigatória
```

A lista de **Pendências** é a fonte da verdade e funciona com ou sem o app instalado. O push, quando existir, é só um aviso.

### Regras de negócio

- **Toda transação entra na lista**, de qualquer tipo: débito, crédito, Pix enviado ou recebido, transferência, compra no cartão, estorno. Cada registro guarda a **direção** (`DEBIT` ou `CREDIT`) e o tipo informado pelo banco (texto livre, só para exibição).
- **Débitos** são preenchidos como **despesa**. **Créditos** (salário, Pix e transferências recebidas) serão preenchidos como **renda**, mas isso fica para uma etapa futura: por enquanto o crédito aparece na lista (e será notificado) e só pode ser marcado como lido.
- **A pendência é do usuário, não da família.** Só ao registrar ela passa a pertencer a uma família e fica visível para os membros.
- **Família:** se o usuário tem uma só, vem selecionada; se tem várias, começa pela família ativa (`current_family`) e ele pode trocar.
- **Campos editáveis** antes de salvar: valor, data, descrição, categoria e família. A categoria continua obrigatória (como na despesa manual); a sugestão automática é opcional e vem depois.
- **Estados:** `PENDING` → `IMPORTED` (vinculada a uma `Expense`; no futuro, a uma renda) ou `DISMISSED` (lida/ignorada). Sair de `PENDING` remove a transação da lista.
- **Duplicidade:** a chave é `(conexão, id externo da transação)`. Além disso, ao abrir uma pendência, o app avisa se já existe despesa com mesmo valor e data próximos (o usuário pode ter lançado à mão).
- **Retenção:** pendência não tratada expira em 60 dias (configurável). Ao ignorar, importar ou expirar, os campos sensíveis (descrição, contraparte) são apagados; fica apenas o hash do id externo para impedir que a mesma transação reapareça.
- **Notificação (última etapa):** todo tipo de transação é notificado, inclusive os créditos. Modo *privado* (padrão: "Nova movimentação em sua conta") ou *detalhado* (valor e descrição). Ver seção 3.

## 2. O que é e o que não é viável

### Viável

| Item | Como |
| --- | --- |
| Conectar bancos do usuário no Brasil | **Open Finance Brasil**, por meio de um **agregador** autorizado (ex.: Pluggy, Belvo). O usuário autoriza no app do próprio banco; o Equaliza nunca vê a senha. |
| Receber novas transações | Webhook do agregador, depois de cada sincronização. Buscamos a transação pela API; não confiamos no corpo do webhook. |
| Notificar todo tipo de transação (débito, crédito, Pix, transferência) | Push via FCM (Android e iOS, que usa APNs por baixo), **na última etapa**. O PLANO já prevê o registro do token do dispositivo na Fase 4. |
| Abrir o app já no formulário preenchido | Deep link (App Links no Android, Universal Links no iOS) com só o id da pendência. |
| Lista de pendências no web e no mobile (**prioridade**) | Endpoints novos; o mesmo contrato OpenAPI. Não depende do push. |
| Créditos como renda | Viável, mas em etapa futura; o crédito já aparece na lista e só pode ser marcado como lido até lá. |
| Valor e descrição na notificação | Sim, com a ressalva de privacidade da seção 3. |
| Revogar a qualquer momento | Desconectar o banco apaga o vínculo no agregador e os dados locais. |

### Não viável (ou com restrições que mudam a expectativa)

| Item | Motivo |
| --- | --- |
| **Notificar no instante da transação** | O Open Finance é baseado em consulta, não em eventos. Os bancos não empurram transações; o agregador sincroniza em intervalos (de minutos a horas, conforme o plano contratado e o banco). Compra no cartão pode aparecer só depois, e transação pendente pode mudar de valor. Comunicar como "pouco depois", nunca "em tempo real". |
| Conectar qualquer banco | Só instituições participantes do Open Finance e cobertas pelo agregador. Cobertura de contas varia (corrente e cartão são as mais comuns). |
| Cadastrar o Equaliza direto no Open Finance | Exige ser instituição autorizada pelo Banco Central, com certificados, certificação e auditoria. Inviável para este projeto; por isso o agregador. |
| Pedir login e senha do banco (*scraping*) | Proibido pelo princípio de segurança do projeto e contrário às regras do setor. Nunca. |
| Ler as notificações ou SMS do app do banco | iOS não permite. No Android exige `NotificationListenerService`, que as políticas da Google Play restringem, é frágil e lê dados que não são nossos. Fora do escopo. |
| Consentimento permanente | O consentimento do Open Finance é limitado (até 12 meses) e precisa ser renovado. O app avisa antes de vencer e mostra o status da conexão. |
| Garantia de entrega do push | FCM/APNs são "melhor esforço". Por isso a lista de Pendência existe. |
| Gratuidade | Agregadores cobram por conexão ativa, e há plano gratuito só para uso pessoal ou em teste (**verificar preços e termos antes de decidir**). O custo cresce com o número de usuários. |
| Classificar corretamente toda transação | Como tudo é notificado, entram também transferências entre contas próprias, estornos, parcelas e **pagamento de fatura do cartão** (que duplica as compras já listadas). O sistema só sinaliza o tipo; quem decide é o usuário, ignorando o que não for despesa. Regras de sugestão (ex.: marcar fatura como provável duplicidade) ficam como melhoria. |
| Categoria automática confiável | Pode vir como sugestão do agregador, sempre editável. |

## 3. Riscos e medidas contra vazamento de dados bancários

Esta funcionalidade muda o perfil de risco do Equaliza: hoje o app guarda o que o usuário digita; depois guardará dados financeiros reais, vindos do banco. O princípio é **coletar o mínimo, guardar o mínimo, pelo menor tempo**.

### Riscos

| # | Risco | Impacto |
| --- | --- | --- |
| R1 | Vazamento do banco de dados ou de backups | Exposição de transações e dos vínculos com o agregador |
| R2 | Vazamento de tokens/credenciais do agregador (guardados no backend) | Acesso às contas do usuário, no limite do consentimento |
| R3 | Webhook falsificado ou repetido | Inserir transações falsas nas pendências, spam de push |
| R4 | Acesso indevido entre usuários (IDOR) | Um usuário ver ou importar a transação de outro |
| R5 | Dados no push: tela de bloqueio, Google/Apple e histórico de notificações | Quem vê o aparelho ou o provedor do push lê valor e descrição |
| R6 | Deep link ou notificação abrindo dados sem autenticação | Exposição em celular perdido ou emprestado |
| R7 | Logs, erros (Sentry etc.) e métricas com valor e descrição | Vazamento por ferramentas de observabilidade |
| R8 | Visibilidade para a família ao registrar | A descrição de um Pix revela contraparte e hábitos; o usuário pode não perceber que os membros verão |
| R9 | Comprometimento do agregador (terceiro) | Vazamento fora do nosso controle |
| R10 | Conta do Equaliza invadida (senha fraca, sessão roubada) | Atacante lê pendências e histórico |
| R11 | Dados retidos além do necessário; revogação que não apaga | Passivo desnecessário e descumprimento da LGPD |
| R12 | Consentimento vencido ou revogado e o sistema continua a coletar | Coleta sem base legal |
| R13 | Capturas de tela, área de transferência, backup do aparelho | Vazamento no dispositivo |

### Medidas

**Credenciais e escopo**
- O Equaliza **nunca** recebe nem guarda senha do banco. A conexão usa o widget do agregador; guardamos só o identificador da conexão (*item/consent id*). (R2)
- Pedir o **menor escopo**: apenas transações de conta corrente e cartão. Sem saldos, investimentos, crédito, dados cadastrais. (R1, R9)
- Segredos (chaves do agregador, segredo do webhook, chave de criptografia) só em variáveis de ambiente/cofre, rotacionáveis, nunca no repositório. (R2)

**Armazenamento**
- Criptografia **em nível de campo** (AES-GCM ou Fernet) para o identificador da conexão, a descrição e a contraparte, com chave separada do banco e versionada para rotação. Criptografia em repouso do banco e dos backups do provedor. (R1, R2)
- Valor e data ficam em claro apenas se necessário para consulta; a descrição é sempre cifrada.
- **Retenção curta e expurgo real:** ignorar, importar ou expirar apaga descrição e contraparte; fica só o hash do id externo. Tarefa agendada de expurgo (cron do Render). Backups com retenção limitada. (R1, R11)
- Desconectar um banco chama a revogação no agregador e apaga a conexão e as pendências dela. Excluir a conta do usuário faz o mesmo. (R11, R12)

**Webhook**
- Validar a assinatura **HMAC** (ou o segredo compartilhado) em tempo constante, com timestamp e janela curta contra repetição; idempotência por id do evento. (R3)
- O corpo do webhook só carrega ids; a transação é **buscada na API do agregador** com credencial nossa. (R3)
- Rota pública e sem sessão, então entra de forma explícita na lista de rotas públicas do teste da Fase 0, com *throttling* e limite de tamanho do corpo. (R3)

**Autorização**
- Toda consulta filtra por `owner = request.user`; testes de IDOR para listar, importar e ignorar. (R4)
- Importar exige que o usuário seja membro da família escolhida (`IsFamilyMember`) e valida valor, data e categoria como em qualquer despesa. Operação em transação, com trava na pendência para não importar duas vezes. (R4)
- Reaproveita a sessão atual (JWT em cookie HttpOnly, rotação do refresh). (R10)

**Notificação (R5, R6)**
- **Modo privado por padrão:** "Nova movimentação na sua conta"; o app mostra valor e descrição só depois de aberto e desbloqueado. No Android, `visibility = PRIVATE` com versão pública genérica; no iOS, usar a prévia oculta da tela de bloqueio.
- **Modo detalhado (opt-in)**, por preferência do usuário, com aviso claro do que aparece na tela de bloqueio.
- Para o detalhado sem passar o dado pelos servidores do Google/Apple: o push leva **só o id** (mensagem de dados; no iOS, *Notification Service Extension*); o app busca a transação na API com a sessão e monta a notificação local. É mais trabalhoso; a primeira versão pode enviar o texto no push e registrar essa melhoria como evolução. Decidir antes da implementação.
- O deep link carrega apenas o id opaco, sem valor nem descrição na URL. Ao abrir, exige sessão válida (e biometria, já disponível no app via `local_auth`); sem sessão, vai ao login e depois à pendência. (R6)
- Token do dispositivo vinculado ao usuário e removido no logout; limite de pushes por minuto. (R3, R5)

**Privacidade na família (R8)**
- Na tela de importação, avisar: "Os membros da família verão valor, data e descrição". A descrição vem editável e o usuário pode encurtá-la antes de salvar.
- Os dados brutos do banco (contraparte, ids) **nunca** vão para a despesa; só os campos que o usuário confirmou.

**Observabilidade (R7)**
- Filtro de campos sensíveis nos logs e no relatório de erros; nunca registrar valor, descrição ou corpo do webhook; logar só ids e status.

**Dispositivo (R13)**
- Bloquear capturas de tela nas telas de pendência (`FLAG_SECURE`/equivalente), sem copiar texto para a área de transferência, e excluir os dados do backup automático do Android.
- Nada de dado bancário em `shared_preferences`; se precisar de cache, usar `flutter_secure_storage` (já na base) com expurgo no logout.

**Terceiros e conformidade (R9, R12)**
- Escolher agregador regulado, com contrato de tratamento de dados (operador na LGPD), certificações e política de incidentes verificados. Plano de saída (portabilidade e exclusão) definido antes de contratar.
- Consentimento explícito e específico dentro do app (finalidade, quais dados, por quanto tempo, como revogar), separado do consentimento do banco. Registrar quando foi dado.
- Acompanhar o vencimento do consentimento; se vencer ou for revogado no banco, parar de sincronizar e avisar o usuário. (R12)
- LGPD: dados financeiros não são "sensíveis" no sentido do art. 5º, mas pedem cuidado equivalente. Preparar relatório de impacto (RIPD), canal para direitos do titular e um plano de resposta a incidentes (comunicação à ANPD e aos titulares no prazo regulamentar). **Validar com assessoria jurídica antes de abrir para usuários reais.**

**Processo**
- *Feature flag* por ambiente (`BANK_SYNC_ENABLED`), conforme a regra de execução do PLANO. Começar com poucos usuários.
- Testes: assinatura do webhook (válida, inválida, repetida), IDOR, expurgo, deduplicação, criptografia (o campo não aparece em claro no banco), ausência de dados nos logs. Revisão de segurança do PR e análise de dependências.

### Riscos que sobram

Mesmo com tudo isso, continuam: o agregador ser comprometido, o aparelho do usuário estar desbloqueado nas mãos de outra pessoa, e o próprio usuário escolher o modo detalhado. Por isso a documentação ao usuário e os padrões privados.

## 4. Desenho técnico

### Dados

| Modelo | Campos principais |
| --- | --- |
| `BankConnection` | `user`, `provider`, `external_item_id` (cifrado), `institution_name`, `status` (`ACTIVE`, `EXPIRED`, `REVOKED`, `ERROR`), `consent_expires_at`, `last_synced_at` |
| `BankTransaction` (pendência) | `owner` (user), `connection`, `external_id_hash` (único por conexão), `direction` (`DEBIT`/`CREDIT`), `kind` (tipo do banco, só exibição), `amount` (sempre positivo), `occurred_at`, `description` (cifrado, apagado ao sair de `PENDING`), `status` (`PENDING`, `IMPORTED`, `DISMISSED`), `expense` (nulo até importar), `expires_at`, `notified_at` (usado só na etapa de notificações) |
| `PushDevice` *(etapa de notificações)* | `user`, `token`, `platform`, `created_at` (reaproveita o da Fase 4) |
| Preferências *(etapa de notificações)* | `notification_detail` (`PRIVATE`/`DETAILED`) por usuário |

### API (contrato no OpenAPI)

- `POST /api/bank-connections/connect-token/`: token de curta duração para abrir o widget do agregador.
- `POST /api/bank-connections/`: registra a conexão depois do widget. `GET` lista, `DELETE /<id>/` revoga e apaga.
- `POST /api/webhooks/bank-sync/`: público, só com assinatura. Enfileira a sincronização.
- `GET /api/bank-transactions/?status=PENDING&direction=`: lista da Pendência (paginada), só do usuário.
- `GET /api/bank-transactions/<id>/`: detalhe (valor, data, descrição, possível duplicada).
- `POST /api/bank-transactions/<id>/import/` com `{family, amount, date, description, category}`: cria a `Expense` e marca `IMPORTED`. Só aceita `direction = DEBIT`; para crédito responde 409 até a etapa de rendas existir.
- `POST /api/bank-transactions/<id>/dismiss/`: marca como lida e apaga os campos sensíveis (vale para débito e crédito).

### Telas

- **Web e mobile (prioridade):** item "Pendências" no menu (com contador), lista com filtro entre débitos e créditos e as ações Registrar (só débito) e Marcar como lida, formulário de despesa existente com valores iniciais, e "Bancos conectados" com o fluxo de conexão.
- **Mobile, na etapa de notificações:** tratamento do toque na notificação (deep link) e tela de preferência de notificação.

### Dependências

- **Lista de Pendências:** depende das **Fases 0 e 1** (rotas públicas explícitas, OpenAPI) e da decisão do agregador. Não depende da Fase 4.
- **Notificações:** só depois da lista pronta e da **Fase 4** (serviço `notify`, token FCM, preferências e a conta no Firebase).
- **Rendas (futuro):** depende da lista pronta; reaproveita o mesmo fluxo com `Income`.

## 5. Decisões a tomar antes de começar

1. **Agregador:** qual (preço, cobertura, regulação, plano para uso pessoal).
2. **Conteúdo do push (etapa de notificações):** privado por padrão e detalhado opcional (recomendado) ou sempre detalhado.
3. **Retenção da pendência:** 60 dias é o proposto.
4. **Jurídico:** validação de LGPD, termos de uso e política de privacidade.

Já decidido: toda transação é notificada, créditos serão preenchidos como renda (etapa futura) e as notificações ficam por último.
