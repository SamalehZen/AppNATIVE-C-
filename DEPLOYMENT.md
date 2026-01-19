# 🚀 Guide de Déploiement - Speechly Clone

## Aperçu

Ce guide explique comment déployer l'application Speechly Clone en production pour Windows, macOS et Linux.

## Prérequis

- Node.js 20+
- npm 10+
- Git

### Dépendances par plateforme

**Windows:**
- Visual Studio Build Tools (C++ workload)

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`
- Pour signer l'app: Apple Developer Account

**Linux:**
```bash
sudo apt-get install libasound2-dev libx11-dev libxkbfile-dev libxtst-dev libxinerama-dev
```

---

## 🔧 Build Local

### 1. Installation

```bash
cd speechly-clone
npm install
npm run icons  # Génère les icônes de production
```

### 2. Build pour votre plateforme

```bash
# Build pour la plateforme actuelle
npm run make

# Ou spécifiquement:
npm run make:win    # Windows (.exe)
npm run make:mac    # macOS (.dmg, .zip)
npm run make:linux  # Linux (.deb, .rpm)
```

### 3. Localisation des installeurs

Les fichiers générés sont dans `speechly-clone/out/make/`:

| Plateforme | Format | Chemin |
|------------|--------|--------|
| Windows | .exe | `out/make/squirrel.windows/x64/` |
| macOS | .dmg | `out/make/` |
| macOS | .zip | `out/make/zip/darwin/` |
| Linux | .deb | `out/make/deb/x64/` |
| Linux | .rpm | `out/make/rpm/x64/` |

---

## 🤖 Build Automatique avec GitHub Actions

### Configuration

Le workflow est déjà configuré dans `.github/workflows/build-release.yml`.

### Créer une Release

1. **Via Git Tag (recommandé):**

```bash
# Créer et pousser un tag
git tag v1.0.0
git push origin v1.0.0
```

2. **Manuellement via GitHub:**
   - Aller sur Actions → Build and Release → Run workflow
   - Entrer la version (ex: `1.0.0`)
   - Cliquer "Run workflow"

### Résultat

Une fois le build terminé (~15-20 min), vous trouverez les installeurs dans:
**GitHub → Releases → v1.0.0**

---

## 🔐 Signature de Code (Optionnel mais Recommandé)

### Windows (Code Signing)

1. Achetez un certificat de signature de code (DigiCert, Sectigo, etc.)
2. Ajoutez ces secrets GitHub:
   - `WINDOWS_CERTIFICATE`: Certificat en base64
   - `WINDOWS_CERTIFICATE_PASSWORD`: Mot de passe du certificat

3. Modifiez `forge.config.ts`:
```typescript
new MakerSquirrel({
  name: 'speechly-clone',
  certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
  certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
}),
```

### macOS (Notarization)

1. Créez un compte Apple Developer ($99/an)
2. Créez un App-Specific Password sur appleid.apple.com
3. Ajoutez ces secrets GitHub:
   - `APPLE_ID`: Votre Apple ID
   - `APPLE_PASSWORD`: App-Specific Password
   - `APPLE_TEAM_ID`: Team ID (trouvable sur developer.apple.com)

Le `forge.config.ts` est déjà configuré pour utiliser ces variables.

---

## 📦 Distribution

### Option 1: GitHub Releases (Gratuit)

Les releases sont automatiquement créées par GitHub Actions.
Les utilisateurs téléchargent depuis: `https://github.com/SamalehZen/AppNATIVE-C-/releases`

### Option 2: Site Web Personnel

1. Créez une page de téléchargement
2. Liez vers les fichiers GitHub Release:
```
https://github.com/SamalehZen/AppNATIVE-C-/releases/latest/download/speechly-clone-1.0.0-setup.exe
```

### Option 3: Stores (Plus complexe)

- **Microsoft Store**: Requiert MSIX packaging
- **Mac App Store**: Requiert Apple Developer Account + Review
- **Snap Store** (Linux): `npm install @electron-forge/maker-snap`

---

## 🔄 Mises à Jour Automatiques

Pour ajouter les mises à jour automatiques:

### 1. Installer electron-updater

```bash
npm install electron-updater
```

### 2. Configurer dans main/index.ts

```typescript
import { autoUpdater } from 'electron-updater';

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', () => {
  // Notifier l'utilisateur
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});
```

### 3. Publier sur GitHub Releases

Les mises à jour seront détectées automatiquement via GitHub Releases.

---

## 🐛 Dépannage

### Erreur: "better-sqlite3" failed to build

```bash
npm run rebuild
```

### Erreur: "Cannot find module 'sharp'"

```bash
npm install sharp --save-dev
npm run icons
```

### Build Windows échoue sur Linux/macOS

Cross-compilation limitée. Utilisez GitHub Actions ou une VM Windows.

### macOS: "App is damaged and can't be opened"

L'app n'est pas signée. Pour tester localement:
```bash
xattr -cr "/Applications/Speechly Clone.app"
```

---

## 📋 Checklist Pre-Release

- [ ] Mettre à jour la version dans `package.json`
- [ ] Régénérer les icônes: `npm run icons`
- [ ] Tester l'app localement: `npm start`
- [ ] Vérifier que le build fonctionne: `npm run make`
- [ ] Créer le tag Git et pousser
- [ ] Vérifier le workflow GitHub Actions
- [ ] Tester l'installeur sur chaque plateforme

---

## 📞 Support

Pour tout problème:
1. Vérifiez les logs du workflow GitHub Actions
2. Ouvrez une issue sur GitHub
3. Consultez la documentation Electron Forge: https://www.electronforge.io/
