# 🐳 ARKON Docker Setup Guide

Panduan menjalankan ARKON menggunakan Docker dan Docker Compose untuk development dan deployment.

## Prerequisites

- ✅ Docker (v20.10+): https://www.docker.com/products/docker-desktop
- ✅ Docker Compose (v2.0+): biasanya sudah included dengan Docker Desktop

Verify instalasi:
```bash
docker --version
docker-compose --version
```

## Quick Start (Development)

### 1. Setup Environment Variables

```bash
# Copy development environment file
cp .env.docker .env

# Edit .env jika perlu customisasi
# Minimal: set GEMINI_API_KEY jika ingin pakai fitur AI
```

### 2. Start Containers

```bash
# Build dan jalankan semua services (postgres, backend, frontend)
docker-compose up --build

# Atau di background:
docker-compose up -d --build
```

### 3. Akses Aplikasi

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

### 4. Initialize Database (First Run)

Database schema akan otomatis dibuat saat backend startup. Check logs:

```bash
docker-compose logs backend
```

Jika ada error, run migrations manual:

```bash
docker-compose exec backend node -e "require('./config/db').query('SELECT 1')"
```

## Docker Commands Cheat Sheet

### Container Management

```bash
# Start containers
docker-compose up

# Start in background
docker-compose up -d

# Stop all containers
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Debugging

```bash
# Access backend container shell
docker-compose exec backend sh

# Access postgres container
docker-compose exec postgres psql -U postgres -d arkon_db

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend
```

## Production Deployment

### Build Production Images

```bash
# Build backend
docker build -t arkon-backend:latest ./arch-ai-backend

# Build frontend  
docker build -f Dockerfile.frontend -t arkon-frontend:latest .

# Tag for registry (example: DockerHub)
docker tag arkon-backend:latest username/arkon-backend:latest
docker tag arkon-frontend:latest username/arkon-frontend:latest

# Push to registry
docker push username/arkon-backend:latest
docker push username/arkon-frontend:latest
```

### Deploy with Docker Compose (Production)

1. **Prepare production `.env`:**

```bash
cp .env.docker .env.prod

# Edit with production values:
NODE_ENV=production
DB_HOST=prod-postgres-server
DB_PASSWORD=<secure-password>
JWT_SECRET=<generate-random-key>
REFRESH_SECRET=<generate-random-key>
GEMINI_API_KEY=<your-api-key>
ALLOWED_ORIGINS=https://arkon.example.com
```

2. **Use production compose:**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.prod \
  up -d
```

3. **Setup reverse proxy (Nginx):**

```nginx
upstream arkon-backend {
  server backend:3000;
}

upstream arkon-frontend {
  server frontend:80;
}

server {
  listen 443 ssl http2;
  server_name arkon.example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # Frontend
  location / {
    proxy_pass http://arkon-frontend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # API
  location /api/ {
    proxy_pass http://arkon-backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # WebSocket
  location /socket.io/ {
    proxy_pass http://arkon-backend/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

### Database Connection Error

```bash
# Check if postgres is healthy
docker-compose ps

# Check postgres logs
docker-compose logs postgres

# Manually connect to verify
docker-compose exec postgres psql -U postgres -d arkon_db -c "SELECT 1"
```

### Out of Disk Space

```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Remove specific image
docker rmi arkon-backend:latest
```

### Frontend Build Error

```bash
# Clean build
docker-compose down
docker system prune -a

# Rebuild
docker-compose up --build
```

## Environment Variables Reference

| Variable | Default | Required | Notes |
|----------|---------|----------|-------|
| `NODE_ENV` | development | No | Set to `production` for deployment |
| `PORT` | 3000 | No | Backend API port |
| `DB_HOST` | localhost | No | `postgres` when using compose |
| `DB_USER` | postgres | No | PostgreSQL username |
| `DB_PASSWORD` | postgres123 | ⚠️ | Change in production! |
| `DB_NAME` | arkon_db | No | Database name |
| `JWT_SECRET` | - | ✅ | Generate secure key in production |
| `GEMINI_API_KEY` | - | No | Required for AI features |
| `ALLOWED_ORIGINS` | http://localhost:5173 | No | CORS whitelist (comma-separated) |

## Performance Tips

1. **Database Optimization:**
   ```bash
   # Create indexes
   docker-compose exec postgres psql -U postgres -d arkon_db -c \
     "CREATE INDEX idx_users_id ON users(id); \
      CREATE INDEX idx_rooms_dosen_id ON rooms(dosen_id);"
   ```

2. **Resource Limits:**
   ```yaml
   # docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '1'
             memory: 512M
   ```

3. **Health Checks:**
   ```bash
   # Monitor container health
   docker-compose ps
   ```

## Support & Issues

- 📝 Check logs: `docker-compose logs -f`
- 🔍 Debug container: `docker-compose exec backend sh`
- 📚 Docker docs: https://docs.docker.com/compose/
