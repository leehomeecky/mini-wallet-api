# 🪙 Mini Wallet API

A secure wallet API built with **Node.js**, **Express**, **MongoDB**, and **TypeScript**. Supports:

- 💸 Internal wallet-to-wallet transfers
- 🏦 External bank transfers via Paystack
- 📊 Transaction tracking with filters and pagination
- 🔐 Auth middleware & transaction PIN verification
- 📦 Clean architecture (controller/service/repo)

## 🚀 Features

### 🧍 User Wallet
- Fund wallet
- Transfer to another wallet (internal)
- Transfer to bank account (Paystack)
- View wallet balance

### 💰 Transactions
- Log **DEBIT / CREDIT / REFUND** operations
- Filter by type, status, channel, date
- Pagination (limit, offset)

### 🔒 Security
- JWT-based Auth
- Hashed transaction PIN
- Webhook verification logic in place

---

## 🧪 Tech Stack

| Stack       | Tool                    |
|-------------|-------------------------|
| Language    | TypeScript              |
| Framework   | Node.js/Express.js      |
| Database    | MongoDB (Mongoose)      |
| Payments    | Paystack API            |
| Validation  | Zod                     |
| HTTP Client | Axios + custom util     |

---

## 🛠️ Setup

1. **Clone & Install**

```bash
git clone https://github.com/leehomeecky/mini-wallet-api.git
cd mini-wallet-api
npm install
```
## Configure `.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wallet_db
JWT_SECRET=your_jwt_secret

# Paystack
PAYSTACK_SECRET_KEY=sk_test_*************
```
## Run the App

```bash
# Development mode
npm run start:dev

# Build app
npm run start:build

# Production mode
npm run start
```

### 🐳 Optional: Run with Docker

Make sure [Docker](https://docs.docker.com/get-docker/) is installed on your machine.

To start the app with Docker:

```bash
docker-compose up --build
```
This will spin up:
- 🟢 **Express API container** (Mini Wallet API)
- 🟣 **MongoDB container** (with volume persistence)

  ---

## 📫 API Endpoints (Postman Docs)
[View the API documentation on Postman](https://documenter.getpostman.com/view/23282509/2sB2qdfKQC)

## 🔍 Transaction Filters

Supports filtering by:

- `type` = DEBIT \| CREDIT \| REFUND
- `status` = PENDING \| SUCCESSFUL \| FAILED
- `channel` = INTERNAL \| EXTERNAL \| INTERNATIONAL
- `startDate`, `endDate` (ISO string)
- `limit`, `offset`

### Example:

```http
GET /wallet/transactions?type=DEBIT&status=SUCCESSFUL&limit=10&offset=0&startDate=2024-01-01
```
---
## 🧱 Architecture Decisions

This project follows a layered clean architecture:

- **Controllers** handle HTTP routing and request validation.
- **Services** contain business logic, orchestrating repo and external calls.
- **Repositories** encapsulate all MongoDB persistence logic using Mongoose.
- **Utilities** abstract third-party services like Paystack into reusable components.
- **Validation** is handled with **Zod**, offering runtime type safety and schema enforcement.
- **Webhook-first transfer tracking**: external transfers are saved as `PENDING` and updated via Paystack webhooks.
- **Custom Axios wrapper** provides centralized error handling, headers, and timeout behavior for all outbound API calls.
- **Dockerized environment** using `docker-compose` for local dev with isolated MongoDB instance.

---

## 🤔 Assumptions Made

- Each user has exactly **one wallet**.
- Wallet balances are stored in **NGN** as an integer (kobo-level precision).
- All users must set a **transaction PIN** before initiating a transfer.
- External transfers are initially **`PENDING`** until webhook confirms status.
- **Paystack HMAC signature verification is skipped** for assessment simplicity — it should be enabled in production.
- The application currently **does not support**:
  - Multi-currency wallets
  - Admin dashboards or roles
  - Retry or failover logic for webhook failures
---
## 🧪 Testing

- Unit tests for service + repo layers
- Integration tests for core flows
  
## Run the Unit test

```bash
npm run test
```
