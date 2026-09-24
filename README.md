# Parcelix Backend

A production-grade REST API powering **Parcelix**, a courier & parcel delivery management platform. It manages customers, couriers, admins, shipments, zones, hubs, pricing, real-time tracking, bKash payments, and automated email communications.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Deployment](#deployment)
- [License](#license)

## Features

**Authentication & Users**
- Customer registration, login, and email verification
- Google OAuth login
- JWT access + refresh token flow
- Forgot / reset password via email
- Role-based access control with three roles: `CUSTOMER`, `COURIER`, `ADMIN`

**Shipments & Delivery**
- Create shipments with sender/receiver details, weights, and fragile handling
- Delivery fee calculation via pricing rules (inside Dhaka vs. outside Dhaka)
- Full shipment lifecycle (pending payment → paid → pickup → in transit → delivered / returned / cancelled)
- Assign couriers to shipments and track shipment progress
- Auto-generated tracking IDs

**Couriers**
- Courier application with resume upload (verified via email)
- Admin approval / rejection workflow
- Availability status management
- Courier-specific shipment and earnings stats

**Payments**
- bKash Tokenized Checkout integration (sandbox + production ready)
- Automatic generation of payment invoices as downloadable PDFs (generated with PDFKit, stored via Cloudinary)

**Real-Time Tracking**
- Public tracking by tracking ID with a full status history timeline

**Admin Dashboard**
- Overall statistics (total earnings, completed shipments, couriers, customers)
- Manage users, couriers, zones, hubs, and pricing rules

**Other**
- Cloudinary media storage (profile photos, resumes, invoices)
- Nodemailer + EJS for transactional emails
- Redis-backed caching for bKash tokens and general-purpose caching
- Automatic seeding of a test admin and courier on server startup

## Tech Stack

| Layer       | Technology                                        |
| ----------- | ------------------------------------------------- |
| Language    | TypeScript                                        |
| Runtime     | Node.js                                           |
| Framework   | Express 5                                         |
| Database    | PostgreSQL                                        |
| ORM         | Prisma 7 (driver adapters)                        |
| Validation  | Zod                                               |
| Auth        | JWT, bcrypt, Google OAuth                         |
| Cache       | Redis                                             |
| Payments    | bKash Tokenized Checkout                          |
| Storage     | Cloudinary                                        |
| Email       | Nodemailer (SMTP) + EJS templates                 |
| PDF         | PDFKit                                            |
| File Upload | Multer                                            |
| Build       | tsup                                              |
| Lint/Format | Biome                                             |
| Deployment  | Vercel                                            |

## Getting Started

### Prerequisites

- Node.js >= 20
- npm
- A PostgreSQL database (or a Prisma Postgres URL)
- A Redis instance
- Cloudinary account
- Gmail / SMTP credentials
- Google OAuth client credentials
- bKash sandbox merchant credentials

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/parcelix-backend.git
cd parcelix-backend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# then fill in the values (see below)

# 4. Generate the Prisma client
npx prisma generate

# 5. Start the development server
npm run dev
```

The server automatically:
- Connects to PostgreSQL and Redis
- Verifies the SMTP connection
- Seeds a test admin and test courier (if none exist)

## Environment Variables

| Variable                        | Description                                    | Default                |
| ------------------------------- | ---------------------------------------------- | ---------------------- |
| `NODE_ENV`                      | Runtime environment                            | `development`          |
| `PORT`                          | Server port                                    | `5000`                 |
| `DATABASE_URL`                  | PostgreSQL connection string                   | —                      |
| `BACKEND_URL`                   | Public backend URL                             | —                      |
| `FRONTEND_URL`                  | Allowed CORS origin (frontend)                 | `http://localhost:3000`|
| `JWT_ACCESS_SECRET`             | Access token signing secret                    | —                      |
| `JWT_REFRESH_SECRET`            | Refresh token signing secret                   | —                      |
| `JWT_ACCESS_EXPIRES_IN`         | Access token lifetime (e.g. `1d`)              | `1d`                   |
| `JWT_REFRESH_EXPIRES_IN`        | Refresh token lifetime (e.g. `7d`)             | `7d`                   |
| `BCRYPT_SALT_ROUNDS`            | Salt rounds for password hashing               | `10`                   |
| `GOOGLE_CLIENT_ID`              | Google OAuth client ID                         | —                      |
| `TEST_ADMIN_NAME`               | Seeded admin name                              | —                      |
| `TEST_ADMIN_EMAIL`              | Seeded admin email                             | —                      |
| `TEST_ADMIN_PASSWORD`           | Seeded admin password                          | —                      |
| `TEST_COURIER_NAME`             | Seeded courier name                            | —                      |
| `TEST_COURIER_EMAIL`            | Seeded courier email                           | —                      |
| `TEST_COURIER_PASSWORD`         | Seeded courier password                        | —                      |
| `REDIS_USERNAME`                | Redis username                                 | `default`              |
| `REDIS_PASSWORD`                | Redis password                                 | —                      |
| `REDIS_HOST`                    | Redis host                                     | —                      |
| `REDIS_PORT`                    | Redis port                                     | —                      |
| `EMAIL_SENDER`                  | Sender email address                           | —                      |
| `SMTP_USER`                     | SMTP username                                  | —                      |
| `SMTP_PASSWORD`                 | SMTP app password                              | —                      |
| `CLOUDINARY_CLOUD_NAME`         | Cloudinary cloud name                          | —                      |
| `CLOUDINARY_API_KEY`            | Cloudinary API key                             | —                      |
| `CLOUDINARY_API_SECRET`         | Cloudinary API secret                          | —                      |
| `BKASH_BASE_URL`                | bKash API base URL                             | —                      |
| `BKASH_USERNAME`                | bKash merchant username                        | —                      |
| `BKASH_PASSWORD`                | bKash merchant password                        | —                      |
| `BKASH_APP_KEY`                 | bKash app key                                  | —                      |
| `BKASH_APP_SECRET`              | bKash app secret                               | —                      |
| `BKASH_CALLBACK_URL`            | bKash payment callback URL                     | —                      |

> **Note:** Never commit real credentials. The `.env` file is gitignored; provide a `.env.example` with placeholder values instead.

## Available Scripts

| Script             | Description                                   |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Start the dev server with hot reload (`tsx`)  |
| `npm run build`    | Bundle the app to `dist/` with `tsup`         |
| `npm start`        | Run the production build from `dist/server.js`|
| `npm run format:check` | Check formatting with Biome                |
| `npm run format:fix`   | Fix formatting with Biome                  |
| `npm run lint:check`   | Lint the source with Biome                 |
| `npm run lint:fix`     | Auto-fix lint issues with Biome            |

## Project Structure

```
parcelix-backend/
├── prisma/
│   ├── schema/            # Modular Prisma schema files
│   │   ├── schema.prisma  # Client generator + datasource
│   │   ├── enums.prisma   # Shared enums
│   │   └── *.prisma       # One file per model
│   └── migrations/        # Database migrations
├── src/
│   ├── app.ts             # Express app & route mounting
│   ├── server.ts          # Entry point (connects DB/Redis/SMTP, seeds)
│   ├── app/
│   │   ├── config/        # Environment configuration
│   │   ├── interfaces/    # Shared interfaces
│   │   ├── lib/           # Prisma, Redis, bKash, Cloudinary, SMTP, Multer, Google OAuth
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── module/        # Feature modules (controller/service/route/validation)
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   ├── courier/
│   │   │   ├── shipment/
│   │   │   ├── payment/
│   │   │   ├── tracking/
│   │   │   ├── zone/
│   │   │   ├── hub/
│   │   │   ├── pricing/
│   │   │   └── stats/
│   │   └── utils/         # Shared helpers (JWT, PDF, seed, responses, errors)
│   └── generated/prisma/  # Generated Prisma client (do not commit)
├── postman/               # Postman collection
├── tsup.config.ts         # Build configuration
├── prisma7.config.ts      # Prisma CLI configuration
├── vercel.json            # Vercel deployment config
└── biome.json             # Lint & format configuration
```

## API Endpoints

Base URL: `http://localhost:5000` (development) · `/api/v1` prefix

### Authentication (`/auth`)

| Method | Endpoint             | Access    | Description                      |
| ------ | -------------------- | --------- | -------------------------------- |
| POST   | `/auth/register`     | Public    | Register a new customer          |
| POST   | `/auth/email-verification` | Public | Verify registration email    |
| POST   | `/auth/login`        | Public    | Login with email + password      |
| GET    | `/auth/profile`      | Auth      | Get the logged-in user's profile |
| POST   | `/auth/refresh-token`| Public    | Refresh the access token         |
| POST   | `/auth/forgot-password` | Public | Request a password reset        |
| POST   | `/auth/reset-password` | Public | Reset the password              |
| POST   | `/auth/google`       | Public    | Login / register via Google      |

### Couriers (`/couriers`)

| Method | Endpoint                | Access   | Description                          |
| ------ | ----------------------- | -------- | ------------------------------------ |
| POST   | `/couriers`             | Public   | Apply as a courier (resume upload)   |
| POST   | `/couriers/verify-email`| Public   | Verify courier application email     |
| POST   | `/couriers/review-courier` | Admin | Approve / reject a courier         |
| GET    | `/couriers`             | Admin    | List all couriers                    |
| GET    | `/couriers/details/:courierId` | Admin | Get a courier by ID            |
| GET    | `/couriers/stats`       | Courier  | Get courier stats                    |
| PATCH  | `/couriers/availability-status` | Courier | Update availability status    |

### Users (`/users`)

| Method | Endpoint                      | Access   | Description                    |
| ------ | ----------------------------- | -------- | ------------------------------ |
| PATCH  | `/users/profile`              | Auth     | Update own profile             |
| PATCH  | `/users/profile-photo`        | Auth     | Upload profile photo           |
| GET    | `/users`                      | Admin    | List all users                 |
| GET    | `/users/details/:userId`      | Admin    | Get a user by ID               |
| PATCH  | `/users/update-status/:userId`| Admin    | Activate / block / delete user |

### Shipments (`/shipments`)

| Method | Endpoint                              | Access         | Description                        |
| ------ | ------------------------------------- | -------------- | ---------------------------------- |
| POST   | `/shipments`                          | Customer       | Create a shipment                  |
| POST   | `/shipments/pay-shipment`             | Customer       | Initiate bKash payment             |
| GET    | `/shipments/payment/callback`         | Public         | bKash payment callback endpoint    |
| PATCH  | `/shipments/request-pickup`           | Customer       | Request pickup after payment       |
| GET    | `/shipments`                          | Admin          | List all shipments                 |
| GET    | `/shipments/details/:shipmentId`      | Auth           | Get a shipment by ID               |
| PATCH  | `/shipments/cancel/:shipmentId`       | Customer       | Cancel a shipment                  |
| PATCH  | `/shipments/assign-courier/:shipmentId` | Admin       | Assign a courier to a shipment     |
| GET    | `/shipments/assigned`                 | Courier        | Get shipments assigned to me       |
| PATCH  | `/shipments/update-status/:shipmentId`  | Courier      | Update shipment status             |
| GET    | `/shipments/my-shipments`             | Customer       | Get my shipments                   |

### Payments (`/payments`)

| Method | Endpoint                    | Access              | Description                 |
| ------ | --------------------------- | ------------------- | --------------------------- |
| GET    | `/payments/my-payments`     | Customer            | Get my payments             |
| GET    | `/payments/details/:paymentId` | Customer, Admin  | Get a payment by ID         |
| GET    | `/payments`                 | Admin               | List all payments           |

### Tracking (`/trackings`)

| Method | Endpoint              | Access    | Description                         |
| ------ | --------------------- | --------- | ----------------------------------- |
| GET    | `/trackings/:trackingId` | Customer, Admin | Track a shipment by tracking ID |

### Management (`/zones`, `/hubs`, `/pricings`)

| Method | Endpoint              | Access | Description              |
| ------ | --------------------- | ------ | ------------------------ |
| GET    | `/zones`              | Public | List all zones           |
| POST   | `/zones`              | Admin  | Create a zone            |
| PATCH  | `/zones/:zoneId`      | Admin  | Update a zone            |
| GET    | `/hubs`               | Public | List all hubs            |
| POST   | `/hubs`               | Admin  | Create a hub             |
| PATCH  | `/hubs/:hubId`        | Admin  | Update a hub             |
| GET    | `/pricings`           | Public | List all pricings        |
| POST   | `/pricings`           | Admin  | Create a pricing rule    |
| PATCH  | `/pricings/:pricingId`| Admin  | Update a pricing rule    |

### Statistics (`/stats`)

| Method | Endpoint | Access | Description                       |
| ------ | -------- | ------ | --------------------------------- |
| GET    | `/stats` | Admin  | Overall dashboard statistics      |

A ready-to-import **Postman collection** is included at `postman/parcelix-backend.postman_collection.json`.

## Database Models

| Model             | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `User`            | Account for all roles (`CUSTOMER`, `COURIER`, `ADMIN`) |
| `Customer`        | Customer profile linked to a `User`                  |
| `Courier`         | Courier profile with resume, verification & availability |
| `Zone`            | Delivery zone used for origin/destination routing    |
| `Hub`             | Delivery hub linked to a zone                        |
| `Pricing`         | Delivery fee rules (inside/outside Dhaka)            |
| `Shipment`        | Parcel with sender/receiver info, status, invoice    |
| `TrackingShipment`| Immutable status history events for a shipment       |
| `Payment`         | bKash payment with company & courier earnings splitting |

Schema files live under `prisma/schema/`; run `npx prisma migrate dev` to create/apply migrations.

## Deployment

The backend is configured for **Vercel** (`vercel.json`) but can run anywhere Node.js is available.

```bash
# Build the production bundle
npm run build

# Run locally in production mode
npm start
```

For Vercel, connect the repo and set the `DATABASE_URL`, `REDIS_*`, `BKASH_*`, `CLOUDINARY_*`, `SMTP_*`, and `JWT_*` environment variables in the project settings.

> **Heads-up for serverless:** In `development`, `npm run dev` auto-connects Redis/SMTP and seeds test data. On platforms like Vercel, keep the entry route-agnostic since connections are established at request time, not at boot.

## License

This project is for educational purposes.
