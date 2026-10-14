# Importação de extratos e faturas de cartão

> **Status:** implementado em OFX e CSV (Fase 5, etapas 5.2 a 5.8 do [PLANO.md](PLANO.md)), no backend, no web e no mobile, atrás da flag `STATEMENT_IMPORT_ENABLED`. **Faltam:** a leitura do PDF do extrato do C6 (etapa 5.9) e a conferência dos modelos com arquivos reais (etapa 5.1). Os trechos abaixo que falam em "será" descrevem o desenho; o que ainda não existe está listado aqui.
>
> A conexão automática com os bancos (Open Finance) ficou para o futuro (Fase 8): veja [DESPESAS-BANCARIAS.md](DESPESAS-BANCARIAS.md). A lista de Pendências definida aqui será reaproveitada por ela.

Hoje o usuário preenche valor, data, categoria e família de cada despesa à mão. A melhoria permite **carregar um extrato bancário ou uma fatura de cartão de crédito**. Cada linha do arquivo vira uma **pendência**, e o usuário decide quais serão vinculadas a uma família e quais serão descartadas.

## 1. Fluxo

```text
usuário baixa o extrato/fatura no app ou site do banco (OFX ou CSV)
        │
        ▼
 envia o arquivo (web: arrastar e soltar · mobile: seletor de arquivos)
        │
        ▼
 API lê o arquivo em memória, valida, extrai as linhas, ignora as já importadas
        │ (o arquivo original NÃO é guardado)
        ▼
 resumo: "42 novas · 8 já importadas · período 01/09 a 30/09"
        │
        ▼
 lista de Pendências  ──►  o usuário seleciona uma ou várias linhas e escolhe:
        │
        ├─ "Registrar como despesa": família (se houver mais de uma),
        │      categoria (obrigatória), e pode editar valor, data e descrição
        │
        └─ "Marcar como lida": a linha sai da lista e os dados são apagados
```

### Regras de negócio

- **Origem:** cada importação registra a fonte (`STATEMENT` para extrato, `CARD_INVOICE` para fatura) e o arquivo de origem (`ImportBatch`).
- **Toda linha entra na lista**, débito ou crédito. Cada uma guarda a **direção** (`DEBIT` ou `CREDIT`) e o tipo informado pelo banco (texto livre, só para exibição).
- **Débitos** viram despesa. **Créditos** (salário, Pix e transferências recebidas) serão preenchidos como **renda**, mas isso é uma etapa futura (5C): por enquanto só podem ser marcados como lidos.
- **A pendência é do usuário, não da família.** Só ao registrar ela passa a uma família e fica visível para os membros.
- **Ações em lote:** o extrato tem dezenas ou centenas de linhas, então é possível selecionar várias e registrar ou marcar como lidas de uma vez (mesma família e categoria para o lote; cada linha continua editável depois).
- **Família:** se o usuário tem uma só, vem selecionada; se tem várias, começa pela família ativa (`current_family`).
- **Campos editáveis** antes de salvar: valor, data, descrição, categoria e família. A categoria continua obrigatória; sugestão automática é melhoria futura.
- **Estados:** `PENDING` → `IMPORTED` (vinculada a uma `Expense`; no futuro, a uma renda) ou `DISMISSED` (lida). Sair de `PENDING` remove a linha da lista.
- **Duplicidade entre importações:** a chave é o id da transação no arquivo (`FITID` no OFX); sem id, um hash de `(conta, data, valor, descrição, ordem no dia)`. Reenviar o mesmo arquivo, ou outro que se sobreponha, não cria linhas repetidas.
- **Duplicidade com lançamentos manuais:** ao abrir uma pendência, o app avisa se já existe despesa com mesmo valor e data próxima (±2 dias).
- **Data da despesa:** em fatura de cartão, vale a **data da compra** (a data de vencimento da fatura não é usada), editável.
- **Parcelas:** cada parcela aparece como uma linha da fatura do mês e vira uma despesa avulsa. O vínculo entre parcelas fica para a Fase 6.
- **Pagamento da fatura:** o débito "pagamento de fatura" no extrato duplica as compras da fatura. Ele é **marcado** como provável duplicidade, nunca descartado automaticamente. O usuário decide.
- **Retenção:** pendência não tratada expira em 60 dias. Ao marcar como lida, importar ou expirar, descrição e contraparte são apagadas; fica só o hash do id para impedir que a linha reapareça.
- **Remover importação:** o usuário pode desfazer um lote inteiro enquanto houver pendências dele; despesas já registradas não são apagadas.

## 2. O que é e o que não é viável

### Viável

| Item | Como |
| --- | --- |
| **OFX** (extrato de conta e de cartão) | Formato padronizado, exportado pela maioria dos bancos brasileiros. Traz id da transação, data, valor e descrição. É o formato principal. |
| **CSV** | Cada banco usa colunas, separador e formato de valor diferentes. Solução: modelos prontos para os bancos do usuário e, para os demais, mapeamento de colunas (data, valor, descrição) que o usuário informa uma vez e que fica salvo. |
| Faturas de cartão | Mesmos formatos (OFX ou CSV), com `source = CARD_INVOICE`. |
| Lista de Pendências, ações em lote, web e mobile | Endpoints novos; o mesmo contrato OpenAPI. |
| Créditos na lista | Sim; só são marcados como lidos até a etapa de rendas. |

### Bancos-alvo e formatos

Bancos prioritários: **Nubank, C6 Bank e Bradesco**. As linhas do Nubank e do C6 foram **confirmadas pelo usuário** (2026-10); o Bradesco vem de fontes públicas e será confirmado depois.

| Banco | Extrato da conta | Fatura do cartão |
| --- | --- | --- |
| Nubank | **OFX, CSV e PDF** do período escolhido (confirmado) | **OFX ou CSV** (confirmado) |
| C6 Bank | Só **PDF**, protegido por senha (confirmado) | **PDF, CSV ou XLSX** (um deles), protegido por senha (confirmado) |
| Bradesco | A confirmar. Fontes públicas indicam **OFX** pelo internet banking (Saldos e Extratos, salvar como arquivo), com possível limite de 60 dias | A confirmar; provavelmente PDF |

Consequências:
- **Nubank:** coberto por OFX e CSV, sem PDF.
- **Fatura do C6:** chega como **ZIP com senha** (confirmado). Escolher o **CSV** ao exportar; o ZIP contém o arquivo no formato escolhido. O sistema abre o ZIP em memória com a senha informada, aceita só o arquivo esperado dentro dele e trata o CSV normalmente. XLSX só se o CSV não servir. Conferido em um arquivo real (2026-10): o ZIP tem **um único arquivo `.csv`** e usa a criptografia tradicional (**ZipCrypto**, compressão Deflate, sem AES), que a biblioteca padrão do Python lê com a senha; não precisa de biblioteca extra. ZipCrypto é uma criptografia fraca, então a senha só protege contra olhares casuais, e é mais um motivo para o arquivo ser descartado após o envio.
- **Extrato do C6:** só existe em PDF, então a **leitura de PDF é necessária** (etapa 5.9 do plano) para esse caso.
- **Bradesco:** decidir quando for confirmado.
- **Senhas dos arquivos:** o usuário informa a senha no momento do envio. Ela é usada só em memória para abrir o arquivo e nunca é guardada nem registrada em log. Pelo blog do C6, a senha do extrato são os 4 últimos dígitos do cartão físico e a da fatura são os 6 primeiros dígitos do CPF; ambas são dados pessoais.

### Modelo de CSV: fatura do C6

Cabeçalho do arquivo dentro do ZIP (conferido em 2026-10), com os nomes como o banco os escreve:

| Coluna | Uso |
| --- | --- |
| `Data de Compra` | Data da despesa (data da compra, editável) |
| `Nome no Cartão` | **Descartada.** Nome do titular ou do adicional; dado pessoal que não precisamos guardar |
| `Final do Cartão` | Guardada só como os 4 últimos dígitos, para distinguir cartões (físico, virtual, adicional) e compor a chave de deduplicação |
| `Categoria` | Guardada como **sugestão** (`source_category`); o usuário escolhe a categoria do Equaliza. Serve de base para uma futura sugestão automática |
| `Descrição` | Descrição da pendência (cifrada) |
| `Parcela` | Ex.: "2/6" ou "Única". Fica junto da descrição; sem vínculo entre parcelas até a Fase 6 |
| `Valor (em US$)` e `Cotação (em R$)` | Compras internacionais: só informativas |
| `Valor (em R$)` | **Valor da pendência**, sempre em reais |

Pontos a tratar no parser:
- **Codificação:** o arquivo é **UTF-8**; o cabeçalho "CartÃ£o" e "DescriÃ§Ã£o" aparece quando ele é aberto como Latin-1 (como o Excel faz sem BOM). O parser tenta UTF-8 primeiro (aceitando BOM) e só então cai para Windows-1252.
- **Separador:** detectado pelo conteúdo (`;`, `,` ou tabulação), sem fixar; o separador do arquivo original ainda será conferido na 5.1.
- **Sem id da transação:** a chave de deduplicação é o hash de `(final do cartão, data, valor, descrição, parcela, ordem entre linhas idênticas)`.
- **Estornos, pagamentos e sinal do valor:** a forma como o C6 marca crédito (valor negativo ou descrição) será conferida na 5.1 com linhas reais, e as linhas de crédito ficam sinalizadas.
- Uma fatura pode misturar mais de um cartão (adicionais e virtuais): todos entram, diferenciados pelo final do cartão.

### Qual formato usar

**Aceitar vários formatos e deixar o sistema decidir** (OFX e CSV na primeira entrega; PDF para o extrato do C6 na 5.9). O usuário não escolhe formato; envia o arquivo e, se houver, a senha.

- **Detecção pelo conteúdo, nunca pela extensão:** OFX começa com `OFXHEADER` ou `<OFX>`; CSV é reconhecido pelo cabeçalho de colunas, que identifica o modelo do banco (Nubank, C6, Bradesco). CSV desconhecido cai no mapeamento de colunas salvo.
- **Quando o banco oferece os dois, preferir OFX:** tem id único da transação (`FITID`, deduplicação confiável), valor com sinal e datas padronizadas e não depende de separador, vírgula decimal ou acentuação. O CSV é o plano B, com o risco de o banco mudar as colunas sem aviso (o modelo falha de forma visível e o usuário pode remapear).
- Arquivo que não for reconhecido é recusado com mensagem genérica, sem mostrar trechos do conteúdo.

### Não viável (ou com limites)

| Item | Motivo |
| --- | --- |
| **PDF** | Cada banco tem um layout diferente e o layout muda sem aviso. A extração é frágil e erros de valor seriam difíceis de perceber. É **necessário para o extrato do C6** (único formato oferecido), então entra como etapa própria (5.9), depois do OFX/CSV, por banco e com revisão obrigatória antes de gravar (mostrar as linhas lidas e conferir o total com o saldo do PDF, quando houver). |
| Todo banco funcionar de imediato | Depende de o banco oferecer OFX ou CSV. Os modelos serão construídos a partir de arquivos reais dos bancos do usuário. |
| Importação automática | O usuário baixa e envia o arquivo; não há notificação nem sincronização. Isso é objetivo da futura conexão bancária. |
| Saber o que é despesa de verdade | Transferências entre contas próprias, estornos e pagamento de fatura entram na lista. O sistema sinaliza; quem decide é o usuário. |
| Categoria automática confiável | Fica como melhoria; a categoria é escolhida pelo usuário. |
| Reconstruir parcelamento | Cada parcela vira uma despesa avulsa até a Fase 6. |

## 3. Riscos e medidas

Um extrato traz **o histórico financeiro inteiro de um período**, de uma vez. O risco muda de "uma transação vazada" para "um mês inteiro vazado". O princípio é **processar sem guardar, guardar o mínimo, pelo menor tempo**.

### Riscos

| # | Risco |
| --- | --- |
| R1 | Vazamento do banco de dados ou de backups (descrições e valores) |
| R2 | O arquivo original ficar guardado (disco, cache, armazenamento temporário) |
| R3 | Arquivo malicioso: bomba de compressão, arquivo gigante, XML com entidades externas (XXE) no OFX, estouro de memória |
| R4 | Conteúdo do arquivo é dado não confiável: texto das descrições com HTML ou script (XSS), fórmulas de planilha |
| R5 | Acesso indevido entre usuários (IDOR) a lotes e pendências |
| R6 | Logs e relatório de erros com valores, descrições ou trechos do arquivo |
| R7 | Visibilidade para a família: a descrição de um Pix revela contraparte e hábitos |
| R8 | Dados retidos além do necessário |
| R9 | Capturas de tela, área de transferência e backup do aparelho; arquivo baixado fica na pasta de downloads do celular |
| R10 | Conta do Equaliza invadida (sessão roubada) |

### Medidas

**Arquivo**
- Processar **em memória** e descartar. Nunca gravar o arquivo em disco nem em armazenamento de objetos; só ficam as linhas extraídas. (R2)
- Limite de tamanho (por exemplo 5 MB) e de linhas (por exemplo 5.000) por arquivo; aceitar apenas os formatos previstos (OFX, CSV e, na 5.9, PDF) verificando o conteúdo, não só a extensão. Contêineres só para a fatura protegida do C6 (ZIP com senha; XLSX apenas se for o formato dentro dele): abrir em memória, com limite de tamanho descompactado, de número de arquivos e de razão de compressão, aceitando apenas o arquivo esperado dentro dele e ignorando fórmulas e macros do XLSX. (R3)
- **PDF:** leitura em memória com limite de páginas e de tempo, preferencialmente em um processo separado com limite de memória, pois bibliotecas de PDF são alvo comum de arquivos malformados. (R3)
- **Senhas dos arquivos:** enviadas no corpo da requisição (nunca na URL), usadas só em memória, fora dos logs e do relatório de erros, e descartadas ao fim do processamento; o endpoint de envio tem limite de tentativas. (R2, R6)
- Parser de OFX/XML **sem resolver entidades externas nem DTD** (por exemplo `defusedxml`, ou parser de OFX próprio e restrito); CSV lido com limite de colunas e tamanho de campo; decodificação tolerante: UTF-8 primeiro (com ou sem BOM) e, se falhar, Windows-1252/Latin-1. (R3)
- *Throttling* no endpoint de envio (por exemplo 10 por hora) e erro genérico quando o arquivo é inválido, sem devolver trechos do conteúdo. (R3, R6)

**Conteúdo**
- Descrições são tratadas como texto não confiável: sempre escapadas na interface, com tamanho máximo, sem HTML. (R4)
- Se no futuro houver exportação para planilha, neutralizar valores iniciados por `=`, `+`, `-` ou `@`. (R4)

**Armazenamento**
- Descrição e contraparte **cifradas em nível de campo** (AES-GCM ou Fernet) com chave fora do banco e versionada; criptografia em repouso do banco e dos backups. (R1)
- Retenção de 60 dias com expurgo real em tarefa agendada (cron do Render); ao tratar a linha, os campos sensíveis são apagados. Backups com retenção limitada. (R1, R8)
- Nome do arquivo não é guardado (pode conter nome, banco, conta). O lote guarda só: dono, fonte, período, contagens e hash do conteúdo. (R1)
- Número da conta/cartão do arquivo é guardado só mascarado (últimos 4 dígitos), se for guardado. (R1)

**Autorização**
- Toda consulta filtra por `owner = request.user`; testes de IDOR para lotes, listar, importar e marcar como lida. (R5)
- Importar exige que o usuário seja membro da família escolhida (`IsFamilyMember`) e valida valor, data e categoria como em qualquer despesa. Operação em transação com trava, para não importar a mesma linha duas vezes. (R5)
- Reaproveita a sessão atual (JWT em cookie HttpOnly, rotação do refresh). (R10)

**Observabilidade**
- Filtro de campos sensíveis nos logs e no relatório de erros. Nunca registrar valores, descrições ou trechos do arquivo; logar só ids, contagens e status. (R6)

**Privacidade na família**
- Antes de registrar, a tela avisa: "Os membros da família verão valor, data e descrição". A descrição vem editável. (R7)
- Os campos brutos do banco (contraparte, ids, conta) **nunca** vão para a despesa; só o que o usuário confirmou. (R7)

**Dispositivo**
- Mobile: bloquear capturas de tela nas telas de pendência (`FLAG_SECURE` ou equivalente), exigir biometria (já disponível via `local_auth`) para abrir a lista, e não deixar dados em `shared_preferences`. (R9)
- Avisar o usuário que o arquivo baixado continua na pasta de downloads do aparelho e deve ser apagado depois do envio. (R9)

**Processo**
- *Feature flag* por ambiente (`STATEMENT_IMPORT_ENABLED`), como pede a regra de execução do PLANO.
- Testes: arquivo malicioso e gigante, reenvio do mesmo arquivo, sobreposição de períodos, IDOR, expurgo, ausência do arquivo e dos dados em claro no banco e nos logs. Revisão de segurança do PR.
- **Arquivos reais para desenvolvimento** contêm dados do usuário: ficam fora do repositório (`.gitignore`). Os testes usam arquivos sintéticos com o mesmo formato.

### Riscos que sobram
O aparelho desbloqueado nas mãos de outra pessoa, o arquivo esquecido na pasta de downloads e o usuário registrar uma descrição sensível na família.

**LGPD:** mesmo sendo o próprio usuário que envia os dados dele, são dados financeiros. Prever aviso de privacidade, exclusão dos dados ao excluir a conta e plano de resposta a incidentes. Validar com assessoria jurídica antes de abrir para outros usuários.

## 4. Desenho técnico

### Dados (novo app `apps/imports`)

| Modelo | Campos principais |
| --- | --- |
| `ImportBatch` | `owner`, `source` (`STATEMENT`/`CARD_INVOICE`), `format` (`OFX`/`CSV`), `file_hash`, `period_start`, `period_end`, `rows_total`, `rows_new`, `rows_duplicated`, `created_at` |
| `PendingTransaction` | `owner`, `batch`, `external_id_hash` (único por dono e conta), `direction` (`DEBIT`/`CREDIT`), `kind` (tipo do banco, só exibição), `account_ref` (final do cartão ou da conta, só 4 dígitos), `source_category` (categoria do banco, só como sugestão), `amount` (sempre positivo), `occurred_at`, `description` (cifrado, apagado ao sair de `PENDING`), `status` (`PENDING`, `IMPORTED`, `DISMISSED`), `expense` (nulo até importar), `flag` (ex.: `CARD_PAYMENT`, `POSSIBLE_DUPLICATE`), `expires_at` |
| `CsvMapping` | `owner`, `name`, colunas de data, valor e descrição, separador, formato de data e de decimal, sinal (débito negativo ou coluna própria) |

A tabela `PendingTransaction` é genérica de propósito: a futura conexão bancária grava nela com `source = BANK_CONNECTION`.

### API (contrato no OpenAPI)

- `POST /api/imports/` (multipart, arquivo + `source` + mapeamento opcional): processa e devolve o resumo do lote.
- `GET /api/imports/` e `DELETE /api/imports/<id>/`: lotes do usuário; remover apaga as pendências do lote.
- `GET /api/pending-transactions/?status=PENDING&direction=&batch=&flag=`: lista paginada, só do usuário.
- `GET /api/pending-transactions/<id>/`: detalhe, com aviso de possível duplicidade.
- `POST /api/pending-transactions/<id>/import/` com `{family, amount, date, description, category}`: cria a `Expense` e marca `IMPORTED`. Só aceita `DEBIT`; para crédito responde 409 até a etapa de rendas.
- `POST /api/pending-transactions/bulk/` com `{ids, action: "import"|"dismiss", family?, category?}`: ação em lote, em transação.
- `GET/POST/DELETE /api/imports/csv-mappings/`: mapeamentos salvos.

### Telas

- **Web:** item "Pendências" no menu (com contador), página de importação (arrastar e soltar, escolha entre extrato e fatura, mapeamento de CSV), lista com filtros (débito/crédito, lote, sinalizadas), seleção em lote e o formulário de despesa existente com valores iniciais.
- **Mobile:** o mesmo, com seletor de arquivos do sistema, biometria para abrir a lista e bloqueio de captura de tela.

### Dependências

- Depende só das **Fases 0 e 1** (rotas autenticadas por padrão e OpenAPI). Não depende de push, de Firebase nem de agregador.
- Faz parte da Fase 5 (etapa 5B), junto com a exportação (5A).
- A futura conexão bancária e as notificações dependem desta lista.

## 5. Decisões a tomar antes de começar

1. **Bradesco:** confirmar o que o app exporta (extrato e fatura).
2. **C6, fatura em ZIP:** o cabeçalho já é conhecido. Falta ver como aparecem **estorno, pagamento da fatura, parcelas e compra internacional** (basta 3 ou 4 linhas anonimizadas, ou conferir na etapa 5.1) e o separador real do arquivo.
3. **Jurídico:** validação de LGPD e termos de uso, antes de abrir para outras pessoas.

Já decidido: retenção da pendência de **60 dias**; **mesma família e categoria** para as linhas selecionadas em lote; bancos-alvo Nubank, C6 e Bradesco; aceitar vários formatos com detecção automática (OFX e CSV primeiro; PDF para o extrato do C6); créditos serão preenchidos como renda (etapa futura); o arquivo original não é guardado; a conexão bancária fica para depois.
