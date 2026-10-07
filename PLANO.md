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

## Fase 3: Acerto de contas entre membros (4–6 dias)

A funcionalidade central do produto.

1. **[B]** Modelo `Settlement` (família, pagador, recebedor, valor, data, criado por). Migration.
2. **[B]** Serviço de cálculo: parte da diferença `paid − expected` que o dashboard já calcula e inclui os acertos já registrados. Um algoritmo guloso (maior devedor com maior credor) gera o mínimo de transferências. Testes com 2, 3 e N membros e com valores que não fecham em centavos.
3. **[B]** Endpoints `GET /reports/settlement/` (sugestões) e CRUD de `Settlement`, com permissão por perfil.
4. **[F][M]** Tela "Acertos": quem deve quanto a quem, botão "Registrar pagamento", histórico.
5. Card no dashboard: "Você deve R$ X a Fulano".

**Pronto quando:** num cenário de seed, registrar os acertos sugeridos zera as diferenças.

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
