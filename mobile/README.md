# 📱 Equaliza Mobile

Aplicativo mobile do **Equaliza**, desenvolvido com **Flutter**.

---

## 📂 Estrutura

```text
mobile/
├── android/
├── ios/
├── assets/             # Logos e avatares (os mesmos do frontend web)
├── lib/
│   ├── core/
│   │   ├── config/     # Variáveis de ambiente (--dart-define)
│   │   ├── network/    # Cliente HTTP da API (cookies de sessão) e erros
│   │   ├── session/    # Sessão do usuário (equivalente ao AuthProvider do web)
│   │   ├── theme/      # Tema claro/escuro e tokens de cor do globals.css
│   │   ├── utils/      # Formatação (moeda, datas) e períodos
│   │   └── widgets/    # Componentes compartilhados (cards, formulários, filtros)
│   ├── features/       # Telas organizadas por funcionalidade, como no web
│   │   ├── auth/       # Login, cadastro e convite
│   │   ├── shell/      # Barra superior e menu lateral
│   │   ├── dashboard/
│   │   ├── finance/
│   │   ├── category/
│   │   ├── member/
│   │   ├── invitation/
│   │   ├── family/
│   │   └── settings/   # Configurações (tema) e perfil
│   ├── models/         # Modelos das respostas da API
│   ├── app.dart
│   └── main.dart
└── test/
```

A autenticação usa os mesmos cookies HttpOnly do web: o app guarda os cookies
(`access_token` e `refresh_token`) em um cookie jar persistente, e o backend renova o
access token automaticamente.

Para aceitar um convite, use **Usar convite** na tela de login e cole o link recebido por e-mail.

---

## 🚀 Executando

Instale as dependências:

```bash
flutter pub get
```

Execute apontando para o backend local (o emulador Android acessa a máquina por `10.0.2.2`):

```bash
flutter run
```

Em um celular conectado por USB, redirecione a porta do backend e aponte para `localhost`:

```bash
adb reverse tcp:8000 tcp:8000
flutter run --dart-define=API_URL=http://localhost:8000
```

### ☁️ Backend em produção (Render)

A URL não fica no código. Copie o exemplo e preencha com o endereço do serviço no Render
(o arquivo `config/production.json` é ignorado pelo Git):

```bash
cp config/production.example.json config/production.json
```

```bash
flutter run --dart-define-from-file=config/production.json
```

Também é possível passar a URL direto: `--dart-define=API_URL=https://sua-api.onrender.com`.

- Use sempre **HTTPS**: em produção o backend redireciona HTTP e envia os cookies de sessão
  com a flag `Secure`. Um build de release sem `API_URL` ou com HTTP abre uma tela
  explicando o erro de configuração.
- Não é preciso ajustar CORS nem CSRF no backend: o app não é um navegador e a API usa JWT
  em cookies, não sessão do Django. Basta o domínio do Render estar em `ALLOWED_HOSTS`.
- No plano gratuito, o Render desliga o serviço quando ocioso; a primeira requisição pode
  levar até um minuto, e o app avisa isso na tela de carregamento.

---

## 🔑 Assinatura do APK

Crie a chave uma única vez e guarde-a fora do repositório, com backup. Sem ela não é possível publicar atualizações do app.

```bash
keytool -genkey -v -keystore ~/equaliza-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Copie `android/key.properties.example` para `android/key.properties` e preencha os dados. Esse arquivo é ignorado pelo Git.

Sem o `key.properties`, o build de release é assinado com a chave de debug.

---

## 📦 Gerando o APK

Aumente a versão em `pubspec.yaml` a cada release. O número após o `+` precisa sempre crescer:

```yaml
version: 1.0.1+2
```

```bash
flutter build apk --release --dart-define-from-file=config/production.json
```

O arquivo é gerado em `build/app/outputs/flutter-apk/app-release.apk`.

---

## 🤖 Publicação automática

O workflow `.github/workflows/mobile-release.yml` gera o APK e cria uma release no GitHub a cada tag `mobile-v*`.

Configure em **Settings → Secrets and variables → Actions**:

| Nome | Tipo | Valor |
|---|---|---|
| `KEYSTORE_BASE64` | Secret | Saída de `base64 -w 0 ~/equaliza-upload.jks` |
| `KEYSTORE_PASSWORD` | Secret | Senha do keystore |
| `KEY_PASSWORD` | Secret | Senha da chave |
| `API_URL` | Variable | URL HTTPS do backend no Render (ex.: `https://sua-api.onrender.com`) |

Para publicar uma versão:

```bash
git tag mobile-v1.0.0 && git push origin mobile-v1.0.0
```

O APK fica disponível em:

```text
https://github.com/KevinAeiou/Equaliza/releases/download/mobile-v1.0.0/equaliza.apk
```
