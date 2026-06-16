# SAHE Hostel — Production Deployment (Docker)

Single-container deployment: Express serves the React frontend, `/api`, and `/uploads`. MySQL runs in a companion Docker service (or use an external MySQL instance). Uploaded documents persist in `./data/uploads` on the host.

**Important:** Run only **one** application replica while the embedded meal-report scheduler is enabled. Multiple replicas would send duplicate report emails.

---

## Prerequisites

- Docker Engine and Docker Compose v2 on the college server
- MySQL 8 (included in `compose.yaml`) or external MySQL reachable from the server
- Host port **80** available (or change the port mapping in `compose.yaml`)

---

## 1. Prepare deployment directory

On the server, use the `project/` folder as the deployment root (where `Dockerfile` and `compose.yaml` live).

### Create persistent uploads directory

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force data\uploads
```

**Linux:**
```bash
mkdir -p data/uploads
```

### Migrate existing uploads (initial deployment only)

Move existing student documents from the development `uploads/` folder into the persistent host directory. **Verify source and destination paths before copying.**

**PowerShell:**
```powershell
Copy-Item uploads\* data\uploads\ -Recurse
```

**Linux:**
```bash
cp -a uploads/. data/uploads/
```

Do **not** copy `uploads/` into the Docker image. The image excludes uploads via `.dockerignore`.

---

## 2. Configure environment

```bash
cp .env.production.example .env
```

Edit `.env` with real values:

- `MYSQL_HOST`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` — database connection (defaults to compose `mysql` service)
- `MYSQL_ROOT_PASSWORD` — root password for the bundled MySQL container
- `JWT_SECRET` — strong random secret (required in production)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — system admin login
- Optional: email, SaleSquared SMS, OTP settings

Store `.env` beside `compose.yaml`. **Never commit `.env`.**

---

## 3. Build and start

```bash
docker compose up -d --build
```

---

## 4. Verify

**Status:**
```bash
docker compose ps
```

**Logs:**
```bash
docker compose logs -f sahe-hostel
```

**Health:**
```bash
curl http://localhost/health
```

Expected when healthy:
```json
{"status":"ok","database":"connected"}
```

**Frontend:** open `http://localhost/` in a browser.

**API 404 (must be JSON, not HTML):**
```bash
curl -i http://localhost/api/does-not-exist
```

**Uploads mount:** place a test file in `data/uploads/`, restart the container, confirm it is still present and reachable at `/uploads/<filename>`.

---

## 5. Operations

**Restart:**
```bash
docker compose restart sahe-hostel
```

**Stop:**
```bash
docker compose down
```

**Update application:**
```bash
# Pull or copy new source, then:
docker compose up -d --build
```

- Do **not** delete `data/uploads` during updates.
- Do **not** run `docker compose down -v` — it can remove named volumes if added later.

---

## 6. Backups

| Asset | Backup method |
|-------|----------------|
| MySQL | `docker compose exec mysql mysqldump ...` or college DB backup policy |
| Uploaded files | Back up `data/uploads/` on the host |
| `.env` | Secure offline backup (contains secrets) |
| Docker image | **Not** a backup of uploads |

Rebuilding or replacing the container does **not** remove files in `data/uploads` as long as the volume mount is unchanged.

---

## Architecture summary

| Component | Location |
|-----------|----------|
| Application container | `sahe-hostel:latest` |
| HTTP port | Host `80` → container `5000` |
| Frontend (built) | `/app/public` inside container |
| Backend | `/app/server` |
| Uploads | Host `./data/uploads` → `/app/uploads` |
| MySQL | Compose service `mysql` (volume `mysql_data`) or external instance |
| Secrets | Host `.env` (not in image) |

---

## College server quick start

```bash
cd /path/to/project
mkdir -p data/uploads
cp .env.production.example .env
# edit .env with production values
docker compose up -d --build
curl http://localhost/health
```
