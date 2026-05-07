# Samyrdelan — Assistant IA Professionnel

Interface de chat IA professionnelle, propulsée par Claude (Anthropic), déployable sur Vercel en 5 minutes.

---

## 🚀 Déploiement sur Vercel (recommandé)

### Étape 1 — Installer les dépendances
```bash
npm install
```

### Étape 2 — Tester en local
```bash
# Créez un fichier .env.local avec votre clé API :
echo "ANTHROPIC_API_KEY=sk-ant-votre-clé-ici" > .env.local

# Lancez le serveur de développement Vercel (simule les fonctions serverless) :
npx vercel dev
```
→ Ouvrez http://localhost:3000

### Étape 3 — Déployer sur Vercel
```bash
# Installez la CLI Vercel (une seule fois)
npm install -g vercel

# Déployez
vercel
```
Suivez les instructions : choisissez votre compte, acceptez les paramètres par défaut.

### Étape 4 — Ajouter la clé API dans Vercel
1. Allez sur https://vercel.com → votre projet → **Settings → Environment Variables**
2. Ajoutez :
   - **Name** : `ANTHROPIC_API_KEY`
   - **Value** : `sk-ant-votre-clé-ici`
   - **Environment** : Production + Preview + Development
3. Cliquez **Save**, puis redéployez : `vercel --prod`

---

## 🔑 Obtenir une clé API Anthropic
1. Créez un compte sur https://console.anthropic.com
2. Allez dans **API Keys** → **Create Key**
3. Copiez la clé (elle commence par `sk-ant-`)

---

## 📁 Structure du projet
```
samyrdelan/
├── api/
│   └── chat.js          ← Proxy serverless (cache la clé API)
├── src/
│   ├── main.jsx         ← Point d'entrée React
│   └── App.jsx          ← Application complète
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

---

## ✨ Fonctionnalités
- 🌐 Interface multilingue (FR, EN, ES, DE)
- 💬 Streaming en temps réel
- 📝 Rendu Markdown (gras, italique, code, listes)
- 💾 Historique sauvegardé (localStorage)
- ⏹ Arrêt de génération
- 📋 Copie des réponses

---

## 🛡️ Sécurité
La clé API Anthropic n'est **jamais exposée** côté client.  
Elle reste dans les variables d'environnement Vercel et n'est utilisée que dans `api/chat.js` (fonction serverless).
