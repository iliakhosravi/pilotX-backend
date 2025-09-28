# 🚀 Pilot X Backend – Technical Assessment

This project is a **NestJS backend** built as part of the Pilot X backend engineer assessment.  
It demonstrates API integrations, order imports, dispatch matching, and driver APIs for real-time logistics.

---

## ✨ Features

- **Q1: API Integration & Data Sync**
  - Unified `POST /import-orders` endpoint
  - Idempotent order storage with MongoDB compound indexes
  - Queue-based import pipeline (RabbitMQ + bulk upsert workers)
  - Scalable to 10k+ orders/hour

- **Q2: Dispatch Matching**
  - Redis GEO queries for nearest drivers
  - Atomic driver claim locks (`SET NX PX`)
  - Tie-breaking by distance/availability
  - Real-time push via WebSockets (Socket.IO Gateway)

- **Q4: Driver App APIs**
  - Fetch driver jobs
  - Accept/Decline jobs
  - Update job status (Picked up / Delivered)
  - WebSocket updates for real-time notifications
  - Battery-optimized GPS updates (Redis + throttling)

---

## 🛠️ Tech Stack

- **NestJS** (Node.js + TypeScript)
- **MongoDB** (orders, jobs, drivers)
- **Redis** (GPS caching, driver availability, locks)
- **RabbitMQ** (asynchronous order import pipeline)
- **Socket.IO** (real-time driver dispatch & updates)
- **Docker Compose** (local dev for MongoDB + RabbitMQ + Redis)
- **Swagger/OpenAPI** (Interactive API documentation)

---

## 📚 API Documentation

The API is fully documented with **Swagger/OpenAPI 3.0**. Once the application is running, you can access the interactive API documentation at:

**🔗 [http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas with examples
- Interactive "Try it out" functionality
- Authentication support
- Organized by tags (orders, dispatch, drivers)

All DTOs and controllers are decorated with Swagger annotations for comprehensive documentation.

---

## ⚡ Quick Start

```bash
# Clone repo
git clone https://github.com/yourname/pilotx-backend.git
cd pilotx-backend

# Install dependencies
npm install

# Run with Docker services
docker-compose up -d mongo rabbitmq redis

# Start NestJS
npm run start:dev

# 🎉 Access the application:
# API: http://localhost:3000
# Swagger Docs: http://localhost:3000/api/docs
