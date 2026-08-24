# Mathcamp VPS Cheatsheet

## SSH

Anslut till servern:

```bash
ssh mathcamp
```

eller:

```bash
ssh administrator@85.190.97.203
```

---

## VS Code

Anslut via Remote SSH:

```text
Cmd + Shift + P
Remote-SSH: Connect to Host
mathcamp
```

---

## Git

Status:

```bash
git status
```

Hämta ändringar:

```bash
git pull
```

Lägg till filer:

```bash
git add .
```

Commit:

```bash
git commit -m "Beskrivning"
```

Push:

```bash
git push origin main
```

Visa remote:

```bash
git remote -v
```

---

## GitHub SSH

Testa GitHub-inloggning:

```bash
ssh -T git@github.com
```

Förväntat svar:

```text
Hi niel-78! You've successfully authenticated...
```

---

## Backend

Gå till backend:

```bash
cd ~/mathcamp/backend
```

Starta manuellt:

```bash
node server.js
```

Starta om API:

```bash
pm2 restart mathcamp-api
```

Visa processer:

```bash
pm2 list
```

Visa loggar:

```bash
pm2 logs mathcamp-api
```

Visa senaste loggarna:

```bash
pm2 logs mathcamp-api --lines 100
```

Rensa loggar:

```bash
pm2 flush
```

---

## Frontend

Gå till frontend:

```bash
cd ~/mathcamp/frontend
```

Installera paket:

```bash
npm install
```

Bygg produktion:

```bash
npm run build
```

Deploy:

```bash
sudo cp -r dist/* /var/www/mathcamp/
```

Ladda om Nginx:

```bash
sudo systemctl reload nginx
```

---

## Nginx

Status:

```bash
sudo systemctl status nginx
```

Testa konfiguration:

```bash
sudo nginx -t
```

Ladda om:

```bash
sudo systemctl reload nginx
```

---

## MySQL

Logga in:

```bash
mysql -u mathcamp -p mydb
```

Visa tabeller:

```sql
SHOW TABLES;
```

Beskriv tabell:

```sql
DESCRIBE users;
```

Avsluta:

```sql
exit;
```

---

## Felsökning

Kontrollera att backend svarar:

```bash
curl http://localhost:3000/api/app-settings
```

Kontrollera port 3000:

```bash
sudo ss -tlnp | grep 3000
```

Kontrollera port 80:

```bash
sudo ss -tlnp | grep 80
```

Kontrollera domän:

```bash
dig mathcamp.one A +short
```

Kontrollera IPv6:

```bash
dig mathcamp.one AAAA +short
```

---

## PM2

Starta app:

```bash
pm2 start server.js --name mathcamp-api
```

Starta om:

```bash
pm2 restart mathcamp-api
```

Stoppa:

```bash
pm2 stop mathcamp-api
```

Ta bort:

```bash
pm2 delete mathcamp-api
```

---

## Deploy-flöde

### Lokalt

```bash
git add .
git commit -m "Fix"
git push
```

### Server

```bash
cd ~/mathcamp

git pull

cd backend
pm2 restart mathcamp-api

cd ../frontend
npm run build

sudo cp -r dist/* /var/www/mathcamp/

sudo systemctl reload nginx
```

---

## Vanliga problem

### 502 Bad Gateway

Kontrollera:

```bash
pm2 list
```

```bash
curl http://localhost:3000/api/app-settings
```

---

### Syntaxfel i backend

```bash
cd ~/mathcamp/backend
node server.js
```

---

### Visa alla requests

Lägg i `server.js`:

```js
app.use((req, res, next) => {
    console.log(req.method, req.originalUrl);
    next();
});
```

---

### Testa login

```bash
curl -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"username":"USER","password":"PASSWORD"}'
```
