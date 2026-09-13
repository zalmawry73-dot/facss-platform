# Production Deployment Guide: FACSS Platform

---

## 1. Hosting Architecture Options
The platform is designed to be hosted on any Linux/Windows server, cloud VM (AWS EC2, DigitalOcean, Hetzner), or container platform (Docker, Kubernetes).

### Option A: Node.js + PM2 Process Manager (Recommended for Dedicated/VPS)
1. **Clone repository onto server:**
   ```bash
   git clone <repo-url> /var/www/facss
   cd /var/www/facss
   ```
2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```
3. **Configure production environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your production PostgreSQL DATABASE_URL and strong AUTH_SECRET
   ```
4. **Push database migrations:**
   ```bash
   npx prisma db push
   ```
5. **Build production bundle:**
   ```bash
   npm run build
   ```
6. **Start with PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "facss-platform" -- start
   pm2 save
   pm2 startup
   ```

---

## 2. Nginx Reverse Proxy Configuration
```nginx
server {
    listen 80;
    server_name www.facss-aden.com facss-aden.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.facss-aden.com facss-aden.com;

    ssl_certificate /etc/letsencrypt/live/www.facss-aden.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.facss-aden.com/privkey.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. SSL Certificate Setup
```bash
sudo certbot --nginx -d www.facss-aden.com -d facss-aden.com
```
