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
npm run start:dev
```
## 📫 API Endpoints (Postman Docs)
[View the API documentation on Postman](https://documenter.getpostman.com/view/23282509/2sB2qdfKQC)

---

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
## 🧪 Testing

- Unit tests for service + repo layers
- Integration tests for core flows
