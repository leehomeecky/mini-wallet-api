# 🪙 Mini Wallet API

A secure wallet API built with **Node.js**, **Express**, **MongoDB**, and **TypeScript**. Supports:

- 💸 Internal wallet-to-wallet transfers
- 🏦 External bank transfers via Paystack
- 📊 Transaction tracking with filters and pagination
- 🔐 Auth middleware & transaction PIN verification
- 📦 Clean architecture (controller/service/repo)

---

## 📁 Project Structure

````bash
src/
├── controllers/
├── interfaces/
├── middlewares/
├── models/
├── repositories/
├── routes/
├── services/
├── utils/
├── validators/
└── app.ts

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
- Webhook verification logic in place (optional)

---

## 🧪 Tech Stack

| Stack       | Tool                    |
|-------------|-------------------------|
| Language    | TypeScript              |
| Framework   | Express.js              |
| Database    | MongoDB (Mongoose)      |
| Auth        | JWT + bcrypt            |
| Payments    | Paystack API            |
| Validation  | Zod                     |
| HTTP Client | Axios + custom util     |

---

## 🛠️ Setup

1. **Clone & Install**

```bash
git clone https://github.com/your-username/mini-wallet-api.git
cd mini-wallet-api
npm install

## Configure `.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wallet_db
JWT_SECRET=your_jwt_secret

# Paystack
PAYSTACK_SECRET_KEY=sk_test_*************

## Run the App

```bash
npm run dev

## 📫 API Endpoints (Simplified)

| Method | Endpoint                  | Description                        |
|--------|---------------------------|----------------------------------|
| GET    | /wallet/balance           | Get wallet balance                |
| POST   | /wallet/fund              | Fund wallet                      |
| POST   | /wallet/transfer          | Internal wallet-to-wallet transfer|
| POST   | /wallet/transfer/bank     | External bank transfer via Paystack|
| GET    | /wallet/transactions      | Get transaction history (filters)|
| POST   | /webhook/paystack         | Paystack transfer webhook        |

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

## 🧪 Testing

- Unit tests for service + repo layers
- Integration tests for core flows

---

## 🙌 Credits

Built with ❤️ for educational & assessment purposes.

````
