# CECA-Solutions - Backend (démo)

Petit serveur Express pour la gestion utilisateur (demo, stockage JSON). Ne convient pas pour production — utiliser une vraie base de données et sécuriser la clé JWT.

Prérequis
- Node.js 18+

Installation & exécution (macOS, zsh)

```bash
cd /Users/apple/Desktop/Plate-Form-\ ceca/server
npm install
# en développement avec redémarrage automatique
npm run dev
# ou pour exécuter sans nodemon
npm start
```

Endpoints
- `POST /api/register` — {name,email,password,role?}
- `POST /api/login` — {email,password}
- `GET /api/me` — besoin du header `Authorization: Bearer <token>`

Sécurité
- Défini `JWT_SECRET` dans l'environnement pour remplacer la valeur par défaut `dev-secret`.
- Pour production, remplacez le stockage JSON par une base de données (Postgres, MySQL, SQLite) et activez HTTPS.
