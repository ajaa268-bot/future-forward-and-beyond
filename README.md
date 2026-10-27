# Future Forward and Beyond
**Multi-Barrier Navigator & Co-Pilot Workbook (v4.0 Master Consolidated Edition)**

This project implements the full-stack architecture defined in [multi_barrier_navigator_master_spec.md](./multi_barrier_navigator_master_spec.md):
1. **Interest-First Entry Bridge:** Uses casual everyday interests (cooking, gaming, audio/music, fixing bikes/hardware, gardening) as a low-stakes bridge to extract professional trade & technical competencies.
2. **Decoupling Literacy from Intelligence (Dual-Axis Model):** Evaluates `problem_solving_complexity` (1–5) completely independently from `text_admin_tolerance` (1–5), routing high-IQ, low-text-tolerance adults (Quadrant A) into hands-on trades, fabrication, culinary, and stagecraft with oral/practical assessment accommodations.
3. **Deterministic Coordinator DDL Verification (`verify_programs_ddl`):** Cross-references every recommendation against active Lower Mainland / BC programs (`coordinator_dual_axis_check`) verified within `< 14 days`, checking government ID rules, oral exam accommodations, scribe availability, and immediate Maslow Tier-1 barrier relief (Compass transit tickets, meals, CSA work boots).
4. **Dual-Device "Co-Pilot" Workbook (WebSockets):** Real-time synchronization between the **Coordinator Shared Tablet** (with all 5 zero-spelling Pro-Studio modules) and the **Client Companion Phone App**.
5. **Main Landing Login, Zero-Email 4-Digit PIN Client Onboarding & Anonymous Guest Sanctuary Mode:**
   - **Returning Client 4-Digit PIN Sign-In (`/api/auth/login`):** Clients sign in with a nickname and a tactile 4-digit PIN pad (plus optional memory cue / coordinator hint) — zero email address or complex password required.
   - **3-Step New Client PIN Onboarding (`/api/auth/register`):** 30-second trauma-informed registration where clients choose a first name/nickname, a comfort symbol/avatar, their Lower Mainland city, life stage (Youth, Adult, Senior 55+, Family/Parent), a 4-digit PIN, and immediate help priorities.
   - **Anonymous Guest Sanctuary Page (`/api/auth/guest`):** One-click Guest Mode to browse all 78+ verified Lower Mainland hospitals, walk-in UPCC doctors, labs, free counselors, pregnancy & baby care, shelters, food banks, subsidies, and schools without registering—with a one-tap option to upgrade and save pinned programs with a 4-digit PIN at any time.

## Quick Start

```bash
npm install
npm run start
```

The unified server + Co-Pilot UI runs at `http://localhost:4180` (or `npm run dev` on port `5185` with Vite HMR).

## Railway & Custom Domain (`https://plauxie.life/`) Configuration

This repository is pre-configured for **Railway** (`https://railway.com/project/9821be45-444b-4d47-b79e-2b811be6851f`) and the custom domain **`https://plauxie.life/`**:

- **Builder:** `DOCKERFILE` ([Dockerfile](./Dockerfile) & [railway.json](./railway.json))
- **Healthcheck Path:** `/api/health`
- **Start Command:** `npm start` (binds automatically to `0.0.0.0:$PORT`)
- **Allowed Hosts & CORS:** `plauxie.life`, `www.plauxie.life`, `*.plauxie.life`, `*.railway.app`

### Connecting in Railway (`9821be45-444b-4d47-b79e-2b811be6851f`)
1. Open `https://railway.com/project/9821be45-444b-4d47-b79e-2b811be6851f`.
2. In the **Deploy from GitHub repo** picker:
   - Paste `https://github.com/ajaa268-bot/future-forward-and-beyond` directly into the **Search repositories, or paste a URL...** box, **or**
   - Click **Configure GitHub App**, grant access to `ajaa268-bot/future-forward-and-beyond`, and click **Refresh**.
3. Under the service's **Settings → Networking → Custom Domains**, add `plauxie.life` (and optionally `www.plauxie.life`).

## Optional PostgreSQL + `pgvector` Database

To spin up the standalone PostgreSQL 16 + `pgvector` container with the master DDL schema ([db/schema.sql](./db/schema.sql)):

```bash
docker compose up -d
```
