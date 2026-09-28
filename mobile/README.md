# 📱 Equaliza Mobile

Aplicativo mobile do **Equaliza**, desenvolvido com **Flutter**.

---

## 📂 Estrutura

```text
mobile/
├── android/
├── ios/
├── lib/
│   ├── core/
│   │   ├── config/     # Variáveis de ambiente (--dart-define)
│   │   ├── network/    # Cliente HTTP da API
│   │   └── theme/      # Tema e cores da aplicação
│   ├── features/       # Telas organizadas por funcionalidade
│   ├── app.dart
│   └── main.dart
└── test/
```

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

Ou para outro backend:

```bash
flutter run --dart-define=API_URL=https://sua-api.onrender.com
```

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
flutter build apk --release --dart-define=API_URL=https://sua-api.onrender.com
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
| `API_URL` | Variable | URL do backend em produção |

Para publicar uma versão:

```bash
git tag mobile-v1.0.0 && git push origin mobile-v1.0.0
```

O APK fica disponível em:

```text
https://github.com/KevinAeiou/Equaliza/releases/download/mobile-v1.0.0/equaliza.apk
```
