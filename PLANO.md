# Plano de implementação por fases

Cada fase termina em algo que pode ser mergeado e usado sozinho. Estimativas em dias de uma pessoa.
**[B]** = backend, **[F]** = frontend, **[M]** = mobile.

## Fase 0: Fundação de segurança e CI (2–3 dias)

Tudo o que reduz risco e protege as fases seguintes.

1. **[B]** `DEFAULT_PERMISSION_CLASSES = IsAuthenticated`. Liberar com `AllowAny` só login, registro, reset de senha e validar/aceitar convite. Escrever um teste que percorre todas as rotas e falha se alguma pública não estiver na lista.
2. **[B]** Em produção, exigir `SECRET_KEY` por ambiente. Trocar `.split(",")` por `env.list` em hosts, CORS e CSRF.
3. **[B]** JWT: ler os tempos de expiração do ambiente e ativar `ROTATE_REFRESH_TOKENS` e `BLACKLIST_AFTER_ROTATION`. Ajustar o refresh em `CookieJWTAuthentication` para gravar o novo refresh cookie.
4. **[B]** Throttling (`ScopedRateThrottle`) em login, registro, reset e convite.
5. **[B]** Fixar a versão do `psycopg`, remover o `python-decouple` e configurar `LOGGING`. Criar o endpoint `/health` e apontá-lo no `render.yaml`.
6. **CI:** novo workflow `ci.yml` em PR e push (backend: ruff + `manage.py test` com `settings.ci`; frontend: lint + `tsc` + build; mobile: `flutter analyze` + `flutter test`). Os workflows de deploy passam a depender do CI verde.
7. `pre-commit` com ruff e eslint.

**Pronto quando:** o CI roda nos PRs, o teste de rotas públicas passa e o deploy não sai com o CI quebrado.

## Fase 1: Contrato de API e limpeza estrutural (3–4 dias)

Fazer antes das funcionalidades novas, para não replicar a bagunça.

1. **[B]** Renomear: `enuns.py` → `enums.py`, `dashboard_sumarry.py` → `dashboard_summary.py`, `manager/` → `managers/`. Consolidar `invitations/viewsets.py` com `views/` e remover os serializers vazios. Unificar os três `register*` em `users/services`. Usar `git mv` para preservar o histórico. Rodar os testes a cada rename.
2. **[B]** Adicionar `drf-spectacular` e publicar `/api/schema/`.
3. **[F]** Gerar os tipos com `openapi-typescript` num script `npm run gen:api`, e migrar `types/` aos poucos.
4. **[F]** Mover componentes de domínio de `components/` para `features/`. Corrigir `userNavegation` → `userNavigation`.
5. Atualizar o README (estrutura, rotas, variáveis, recorrências, insights, Render, `seed_demo`) e confirmar o encoding UTF-8.

**Pronto quando:** testes e build passam sem mudança de comportamento, e o schema OpenAPI é gerado no CI.

## Fase 2: Refatoração do financeiro e dos relatórios (4–5 dias)

1. **[B]** Criar `BaseFinancialService` e `BaseFinancialViewSet`, parametrizados por modelo. Migrar Income e Expense e apagar os arquivos duplicados. Os testes de ownership, permissões e performance existentes servem de rede de segurança: rodar antes e depois.
2. **[B]** `DashboardManager`: usar `for_family` de forma consistente e mover a agregação de membros para SQL (`Sum` com `filter`). Devolver `period` em ISO e deixar o rótulo do mês para o cliente. Comparar a saída antiga e a nova com um teste de snapshot.
3. **[B]** Quebrar `reports/insights.py` em um pacote (`insights/units.py`, `formatting.py`, um módulo por tipo de insight). Trocar `float` por `Decimal`. `reports/tests.py` já tem cobertura e serve de guarda.
4. **[B]** Mover o agendador para um Cron Job do Render com `generate_recurring`. Manter a thread atrás de uma flag desligada por padrão por um ciclo de release e remover depois.

**Pronto quando:** o número de arquivos em `finance/` cai de forma visível, e todos os testes passam sem alterar os asserts.

## Fase 3: Acerto de contas entre membros (~13 dias)

A funcionalidade central do produto. Hoje o "Para equilibrar" é calculado no cliente (`buildSettlements`, duplicado em `frontend/src/features/dashboard/utils.ts` e `mobile/lib/core/utils/period.dart`), a partir do `member_contributions` do período filtrado e identificando as pessoas pelo **nome**. Esta fase move o cálculo para o backend (com ids), permite **registrar pagamentos totais ou parciais** e guarda o **histórico**.

### Decisões já tomadas

| Tema | Decisão |
|---|---|
| Quem registra | Só o devedor: o usuário autenticado paga a si mesmo, a um membro com crédito. Não há confirmação do recebedor. |
| Início do saldo | A partir do mês do deploy (`Family.settlement_start`). Meses anteriores não geram dívida. |
| Mês sem receita | Divide igualmente entre os membros ativos. |
| Cancelamento | Estorno feito só pelo **responsável ou administrador** da família. Não é exclusão: fica no histórico. |
| Interface | Página `/settlement` + modal de pagamento. |
| Membro que saiu com saldo ≠ 0 | Continua no acerto até zerar. |
| Histórico | Apenas os campos listados abaixo. |

### Regras de negócio

- **Competência = mês.** O acerto é sempre de um mês (`YYYY-MM`), independente do filtro do dashboard.
- **Saldo acumulado.** Saldo do membro no fim do mês M = Σ (pago − cota) dos meses entre `settlement_start` e M, mais os acertos: quem paga soma `+valor`, quem recebe soma `−valor`. A soma dos saldos da família é sempre zero.
- **Pagamento parcial.** O restante continua no saldo e aparece no mês seguinte como **"Saldo anterior"**. Cada pagamento também guarda um retrato do que sobrou (`remaining_after`) e do mês para onde foi (`carried_to`), para o histórico informar "Restaram R$ X, lançados em Nov/2026".
- **Quanto pagar.** `0 < valor ≤ min(dívida do pagador, crédito do recebedor)`. **Total** é o valor sugerido para aquele par; **parcial** é qualquer valor menor. O mês de referência não pode ser futuro nem anterior a `settlement_start`, e a data do pagamento não pode ser futura.
- **Cota.** Proporcional à receita do mês (como no dashboard). Sem receita no mês, divisão igual entre os membros ativos. Os centavos que sobram são distribuídos de forma determinística (maior resto), para a soma dar zero.
- **Não é receita nem despesa.** Acertos ficam fora dos totais do dashboard e dos insights. O app registra o acerto, não move dinheiro.
- **Estorno.** `status = CANCELLED` (com `cancelled_at` e `cancelled_by`). O saldo é recalculado sem o acerto estornado.
- **Membros inativos** entram no cálculo enquanto o saldo for diferente de zero.

### Dados (novo app `apps/settlements`)

| Campo | Observação |
|---|---|
| `family`, `payer`, `receiver` | `payer ≠ receiver` (constraint) |
| `amount` | `Decimal(10,2)`, `> 0` (constraint) |
| `reference_month` | primeiro dia do mês acertado |
| `paid_at` | data do pagamento (hoje por padrão) |
| `note` | opcional, até 255 caracteres |
| `status` | `ACTIVE` ou `CANCELLED`, com `cancelled_at` e `cancelled_by` |
| `remaining_after`, `carried_to` | retrato do restante do pagador e do mês para onde foi |

`created_by` e `updated_by` vêm do `BaseModel`. Índices em `(family, reference_month)` e `(family, -paid_at)`. Migration adiciona `Family.settlement_start` (primeiro dia do mês do deploy para as famílias existentes; mês da criação para as novas).

### API (contrato no OpenAPI)

- `GET /api/settlements/balance/?month=YYYY-MM`: por membro (com id), pago, cota, diferença do mês, saldo anterior, acertos do mês e saldo final; mais as **sugestões** (quem paga quem e quanto) e o seu saldo.
- `POST /api/settlements/` com `{receiver, amount, month, note?}`: o pagador é o usuário autenticado. Devolve o acerto com `remaining_after` e `carried_to`.
- `GET /api/settlements/?month=&member=&status=&page_size=`: histórico.
- `POST /api/settlements/{id}/cancel/`: estorno (responsável ou administrador).
- Permissões: `IsAuthenticated` + `IsFamilyMember` (estorno com `IsFamilyAdministrator`). Criar e estornar rodam em transação com `select_for_update` na família, para pagamentos simultâneos não estourarem o saldo.

### Telas

**Web**
- **Card do dashboard:** o "Para equilibrar" vira botão para `/settlement?month=…`. Nas sugestões em que o usuário é o devedor, um atalho `?pay=<id>` abre o modal já preenchido.
- **Página `/settlement`:** seletor de mês, "Seu saldo", sugestões com botão **Pagar** (só nas suas), tabela de membros com a coluna "Saldo anterior" e a aba **Histórico** (filtros por membro e status; ação Cancelar só para responsável/administrador).
- **Modal de pagamento** (`FormDialog`): recebedor, valor (atalhos **Total** e **Parcial**), observação e data, com prévia "Restarão R$ X, lançados em Nov/2026".
- **Menu:** item novo "Acertos" (`menuNavigation`).

**Mobile:** tela equivalente em `features/settlement`, link a partir do card do dashboard e folha de pagamento.

**Histórico (campos):** data do pagamento, mês de referência, quem pagou, quem recebeu, valor, observação, status, quanto restou e o mês para onde foi.

### Etapas (um PR pequeno por etapa, com testes)

| # | Entrega | Estimativa |
|---|---|---|
| 3.1 | Funções puras de saldo e sugestão (cota por receita, divisão igual sem receita, centavos, saldo acumulado) e testes, incluindo a propriedade "soma dos saldos = 0" | 2 dias |
| 3.2 | App, modelo, constraints, migration e `Family.settlement_start` | 1 dia |
| 3.3 | Serviços: saldo, criar (validações + lock), estornar e listar | 2 dias |
| 3.4 | Endpoints, permissões, OpenAPI e `make gen_api` | 1,5 dia |
| 3.5 | Web: página, modal, CTA no card, menu e histórico | 3 dias |
| 3.6 | Mobile: tela e folha de pagamento | 2–3 dias |
| 3.7 | `seed_demo` com acertos, remoção do `buildSettlements` dos clientes, README e passada manual | 1 dia |

**Pronto quando:**
- num cenário de seed, registrar as sugestões zera os saldos;
- um pagamento parcial reaparece como "Saldo anterior" no mês seguinte;
- o estorno devolve o saldo;
- só o devedor consegue registrar e só responsável/administrador consegue estornar.

## Fase 4: Orçamentos e notificações (5–7 dias)

1. **[B]** Modelo `Budget` (família, categoria, limite mensal) e endpoint com o consumo atual. Entra como novo insight no tom alert ou warning aos 80% e 100%.
2. **[F][M]** Tela de orçamentos com barras de progresso e edição na tela de categorias.
3. **[B]** App `notifications`: modelo de preferências por usuário e um serviço único `notify(user, tipo, payload)` com canais (e-mail primeiro, push depois).
4. **[B]** Gatilhos: orçamento estourado (ao criar ou editar lançamento), recorrência gerada, convite recebido.
5. **[M]** Push via FCM: registro do token do dispositivo, endpoint para guardá-lo e tela de preferências.

Dependência: o item 1 é independente. O item 5 exige conta e credenciais no Firebase; fazer por último.

## Fase 5: Exportação, importação e anexos (5–7 dias)

1. **[B][F][M]** Exportar CSV e PDF dos lançamentos, respeitando os filtros atuais.
2. **[B]** Importar extrato CSV e OFX em dois passos: prévia com categorias sugeridas e depois confirmação. Detectar duplicados por data, valor e descrição.
3. **[B]** Anexos: campo de arquivo no lançamento, armazenamento em S3 compatível (ou disco no Render, com a limitação de ser efêmero). Limite de tamanho e tipos permitidos.
4. **[M]** Foto do comprovante direto na tela de lançamento.

Antes de começar, decidir onde guardar os arquivos: isso muda a infraestrutura.

## Fase 6: Contas, cartão e parcelamento (7–10 dias)

Mudança de modelo de dados, a mais arriscada. Deixar para depois da estabilização.

1. **[B]** Modelo `Account` (corrente, carteira, cartão) e FK opcional em Income e Expense. Migration que cria uma conta padrão por família e vincula o histórico.
2. **[B]** Transferências entre contas, que não contam como receita nem despesa nos relatórios.
3. **[B]** Parcelamento: gerar N lançamentos futuros ligados por um `installment_group`. Fatura do cartão por ciclo de fechamento.
4. **[F][M]** Seletor de conta nos formulários, saldo por conta, fatura.

## Fase 7: Itens independentes (encaixar conforme prioridade)

- **Histórico de alterações** por lançamento (`django-simple-history` ou o `trackable` existente): 2–3 dias.
- **Metas de economia:** modelo `Goal` com progresso no dashboard: 3 dias.
- **2FA (TOTP), sessões ativas e exclusão de conta (LGPD):** 4–5 dias.
- **Mobile offline-first:** cache local e fila de sincronização. É grande e deve virar um projeto à parte, com plano próprio: 10+ dias.
- **Refatorar os widgets grandes do mobile** (`insights_widgets`, `finance_screen`, `form_fields`, `overlays`) e adotar Riverpod ou Bloc. Pode ocorrer em paralelo à Fase 3 ou 4 no mobile, quando mexer nessas telas.
- **Tags e lançamentos divididos:** depois da Fase 6, pois toca o mesmo modelo.

## Ordem e dependências

```
Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6
                     └─ (refatoração protege 3–6)      └─ Fase 7 em paralelo
```

- A Fase 0 vem antes de tudo: os itens de segurança são pequenos e o CI protege o resto.
- As Fases 1 e 2 vêm antes das funcionalidades: a Fase 3 usa o dashboard e a Fase 6 mexe nos modelos de Income e Expense. Se a fatoração vier depois, a duplicação dobra.
- A Fase 6 fica por último por ser a única com migration de dados do histórico existente.

## Regras de execução para todas as fases

- Um PR por item numerado, a partir da branch de implementação, com testes no mesmo PR.
- Migrations sempre reversíveis, testadas contra uma cópia do banco de produção.
- Feature flags (variáveis de ambiente) para o que toca produção, como o agendador e as notificações.

## Pontos a decidir antes da Fase 0

- Lista de rotas que devem continuar públicas.
- Tempo de vida dos tokens de acesso e de refresh.
