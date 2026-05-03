# 🛡️ SafeRoute — AI Urban Safety System

> AI-powered safe navigation API for metro cities

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![Fastify](https://img.shields.io/badge/Fastify-5-black)](https://fastify.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com)

## 🚀 What is SafeRoute?

SafeRoute helps metro city commuters navigate safely by avoiding high-risk areas. Instead of finding the fastest route, it finds the **safest route** using AI-powered risk scoring.

## ✨ Features

- 🔐 **Auth** — JWT, Refresh tokens, Google OAuth, Token blacklist
- 🗺️ **Safe Route Finder** — OSRM routing + AI safety score (0-100)
- 🚨 **Incident Reporting** — Report theft, harassment, violence, protests
- ⚡ **Real-time Alerts** — Socket.IO danger zone notifications
- 🆘 **SOS Emergency** — Broadcast to trusted contacts instantly
- 👮 **Admin Dashboard** — Heatmap, analytics, report moderation
- 🐳 **Docker Ready** — One command deployment

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Fastify 5 |
| Database | PostgreSQL 16 + Prisma ORM |
| Real-time | Socket.IO 4 |
| Auth | JWT + Google OAuth2 |
| Docs | Swagger UI |
| Container | Docker + Docker Compose |

## 📡 API Endpoints

### Auth
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/google
GET  /api/v1/auth/me
POST /api/v1/auth/change-password
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Routes
```
POST /api/v1/routes/calculate
GET  /api/v1/routes/history
GET  /api/v1/routes/:id
```

### Incidents
```
POST   /api/v1/incidents/report
GET    /api/v1/incidents/nearby
GET    /api/v1/incidents/my
PATCH  /api/v1/incidents/:id/vote
DELETE /api/v1/incidents/:id
```

### Admin
```
GET   /api/v1/admin/dashboard
GET   /api/v1/admin/heatmap
GET   /api/v1/admin/analytics
GET   /api/v1/admin/users
PATCH /api/v1/admin/incidents/:id
PATCH /api/v1/admin/users/:id/ban
```

## 🚀 Quick Start

### Docker se (Recommended)
```bash
git clone https://github.com/Ahmadsuhel/saferoute-backend.git
cd saferoute-backend
cp .env.example .env
docker-compose up --build
```

### Local development
```bash
npm install
npx prisma migrate dev
npm run dev
```

## 📖 API Docs

```
http://localhost:3000/docs
```

## 🔒 Security

- JWT access tokens (15 min)
- Refresh token rotation
- Token blacklisting
- Token versioning
- bcrypt password hashing
- Helmet + CORS

## 📊 Safety Score

```
Score = 100 - deductions

Violence/Robbery    → -20 pts
Harassment          → -15 pts
Street Fight        → -12 pts
Protest             → -10 pts
Accident/Suspicious → -8 pts

Night time  → weights x2
7+ days old → 50% weight
```

## 👨‍💻 Author

**Ahmad Suhel** — Full Stack Developer  
[GitHub](https://github.com/Ahmadsuhel)