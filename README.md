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

## 🔐 JWT Authentication

The API uses **JWT (JSON Web Tokens)** for secure authentication. Driver-specific endpoints require valid JWT tokens.

### 🚀 Getting Started with Authentication

#### 1. **Login to Get JWT Token**
```bash
# Login with driver credentials
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver1@test.com",
    "password": "password123"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. **Use JWT Token in Requests**
Include the JWT token in the `Authorization` header for protected endpoints:

```bash
# Update driver location (requires JWT)
curl -X PATCH http://localhost:3000/drivers/location \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 37.7749,
    "lng": -122.4194
  }'

# Get driver jobs (requires JWT)
curl -X GET http://localhost:3000/drivers/jobs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 🔒 **Protected Endpoints**

The following endpoints require JWT authentication:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/drivers/location` | PATCH | Update driver location |
| `/drivers/availability` | PATCH | Update driver availability |
| `/drivers/jobs` | GET | Get driver's jobs |
| `/drivers/jobs/:jobId/respond` | POST | Respond to job assignment |
| `/drivers/jobs/:jobId/status` | PATCH | Update job status |

### 🎯 **Token Payload Structure**

JWT tokens contain the following information:
```json
{
  "sub": "driver123",           // Driver ID (subject)
  "email": "driver@test.com",   // Driver email
  "iat": 1632150000,           // Issued at timestamp
  "exp": 1632236400            // Expiration timestamp
}
```

### 🛠️ **Using with Swagger UI**

1. Open Swagger docs: http://localhost:3000/api/docs
2. Click the **🔒 Authorize** button at the top
3. Enter: `Bearer YOUR_JWT_TOKEN_HERE`
4. Click **Authorize**
5. Now you can test protected endpoints directly in Swagger!

### 🔧 **Default Test Credentials**

For development/testing, use these default credentials:
- **Email**: `driver1@test.com`
- **Password**: `password123`

### ⚠️ **Security Notes**

- Tokens expire after 24 hours (configurable)
- Use HTTPS in production
- Store tokens securely in your client application
- Never expose JWT secrets in client-side code
- Driver ID is extracted from the token for security (no URL tampering)

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
```

---

## 🎯 **API Usage Examples**

### **Complete Driver Workflow**

```bash
# 1. Login and get JWT token
JWT_TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "driver1@test.com", "password": "password123"}' \
  | jq -r '.access_token')

# 2. Update driver location
curl -X PATCH http://localhost:3000/drivers/location \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"lat": 37.7749, "lng": -122.4194}'

# 3. Set driver as available
curl -X PATCH http://localhost:3000/drivers/availability \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"available": true}'

# 4. Check for new jobs
curl -X GET "http://localhost:3000/drivers/jobs?status=pending" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 5. Accept a job
curl -X POST http://localhost:3000/drivers/jobs/job123/respond \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accept": true}'

# 6. Update job status to picked up
curl -X PATCH http://localhost:3000/drivers/jobs/job123/status \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "picked_up"}'
```

### **Order Import & Dispatch**

```bash
# Import order from e-commerce platform
curl -X POST http://localhost:3000/import-orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER-12345",
    "storeType": "shopify",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "totalAmount": 25.99,
    "currency": "USD"
  }'

# Assign driver to order
curl -X POST http://localhost:3000/dispatch/assign \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER-12345",
    "pickupLat": 37.7749,
    "pickupLng": -122.4194,
    "radiusMeters": 5000
  }'
