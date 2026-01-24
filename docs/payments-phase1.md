# Payments Phase 1 - Collections Only

This document describes the payment system implementation for MyDoctor Phase 1, supporting collections (receiving payments) in Mozambique and Angola.

## Overview

Phase 1 implements a **collections-only** payment system with two primary rails:

| Country | Provider | Method | Currency |
|---------|----------|--------|----------|
| Mozambique (MZ) | eMola | Mobile Money (push) | MZN |
| Angola (AO) | Multicaixa Express | Local Rail (reference) | AOA |

**Key Features:**
- Provider-agnostic Payment Orchestrator
- Async payment state management
- Idempotency (10-minute window)
- Webhook ingestion with signature verification
- Reconciliation polling (every 15 minutes)
- Encrypted PII storage (AES-256-GCM)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    CheckoutPage.tsx                      │ │
│  │  - Country selection (MZ/AO)                             │ │
│  │  - Amount + phone input                                  │ │
│  │  - Status polling (3s interval, 2min max)                │ │
│  │  - Resend + Check Status buttons                         │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express/Node)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Payment API Routes                      │ │
│  │  POST /api/payments/initiate                             │ │
│  │  GET  /api/payments/:id                                  │ │
│  │  POST /api/payments/:id/resend                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               Payment Orchestrator                       │ │
│  │  - Idempotency checking                                  │ │
│  │  - Provider routing (country → provider)                 │ │
│  │  - Status transition validation                          │ │
│  │  - Event logging                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│           ┌──────────────────┴──────────────────┐           │
│           ▼                                     ▼           │
│  ┌─────────────────┐                  ┌─────────────────┐   │
│  │  eMola Provider │                  │ Multicaixa Prov │   │
│  │  (MZ - Mobile)  │                  │ (AO - Reference)│   │
│  └─────────────────┘                  └─────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Webhook Routes                          │ │
│  │  POST /api/webhooks/emola                                │ │
│  │  POST /api/webhooks/multicaixa                           │ │
│  │  POST /api/webhooks/mock/:provider (dev only)            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Reconciliation Job (15min)                  │ │
│  │  - Queries PENDING payments older than 10 minutes        │ │
│  │  - Calls provider queryStatus                            │ │
│  │  - Updates status if changed                             │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB (Mongoose)                       │
│  ┌─────────────────┐    ┌───────────────────┐               │
│  │     Payment     │    │   PaymentEvent    │               │
│  │  - orderId      │    │  - paymentId (ref)│               │
│  │  - country      │◄───│  - eventType      │               │
│  │  - amount       │    │  - payloadJson    │               │
│  │  - status       │    │  - receivedAt     │               │
│  │  - provider     │    └───────────────────┘               │
│  │  - msisdnEncrypted                                       │
│  │  - idempotencyKey                                        │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
packages/webapp-backend/src/payments/
├── api/
│   ├── index.ts
│   ├── payment.routes.ts      # REST endpoints
│   └── webhook.routes.ts      # Webhook handlers
├── crypto/
│   ├── index.ts
│   └── piiCrypto.ts           # AES-256-GCM encryption
├── mapping/
│   ├── index.ts
│   └── statusMapping.ts       # Status transitions
├── models/
│   ├── index.ts
│   ├── payment.model.ts       # Payment schema
│   └── payment-event.model.ts # Event schema
├── providers/
│   ├── index.ts               # Provider registry
│   ├── providerTypes.ts       # Interfaces
│   ├── emolaProvider.ts       # eMola adapter
│   └── multicaixaProvider.ts  # Multicaixa adapter
├── reconciliation/
│   ├── index.ts
│   └── reconcileJob.ts        # Cron job
├── __tests__/
│   ├── idempotency.test.ts
│   ├── webhookVerification.test.ts
│   ├── statusTransitions.test.ts
│   └── piiCrypto.test.ts
├── index.ts                   # Module exports
└── paymentOrchestrator.ts     # Core logic
```

---

## Payment Statuses

| Status | Description | Terminal |
|--------|-------------|----------|
| `CREATED` | Record created, not yet initiated | No |
| `PENDING` | Provider initiated, awaiting confirmation | No |
| `SUCCESS` | Payment confirmed | Yes |
| `FAILED` | Payment failed | Yes |
| `EXPIRED` | Timeout after TTL | Yes |
| `CANCELED` | User canceled | Yes |

### Valid Transitions

```
CREATED  → PENDING, FAILED, CANCELED
PENDING  → SUCCESS, FAILED, EXPIRED, CANCELED
SUCCESS  → (none - terminal)
FAILED   → (none - terminal)
EXPIRED  → (none - terminal)
CANCELED → (none - terminal)
```

---

## API Endpoints

### POST /api/payments/initiate

Initiate a new payment.

**Request:**
```json
{
  "orderId": "ORD-123456",
  "country": "MZ",
  "amount": 10000,
  "currency": "MZN",
  "method": "MOBILE_MONEY",
  "msisdn": "+258841234567",
  "customer": {
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

**Response (201):**
```json
{
  "paymentId": "60a7b8c9d0e1f2a3b4c5d6e7",
  "status": "PENDING",
  "provider": "EMOLA",
  "providerReference": "EMOLA-A1B2C3D4",
  "nextAction": {
    "type": "POLL",
    "pollIntervalMs": 3000,
    "maxPollDurationMs": 120000,
    "instructions": "Check your phone for the eMola payment prompt."
  }
}
```

### GET /api/payments/:paymentId

Get payment details.

**Response:**
```json
{
  "paymentId": "60a7b8c9d0e1f2a3b4c5d6e7",
  "orderId": "ORD-123456",
  "status": "PENDING",
  "amount": 10000,
  "currency": "MZN",
  "country": "MZ",
  "provider": "EMOLA",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:05Z",
  "msisdnLast4": "4567",
  "providerReference": "EMOLA-A1B2C3D4"
}
```

### POST /api/payments/:paymentId/resend

Resend payment prompt (eMola only, 30s throttle).

**Response:** Same as initiate.

---

## Idempotency

The system uses SHA-256 hash of:
```
orderId + country + amountMinor + currency + provider + "phase1" + timeBucket
```

Where `timeBucket = floor(now / 10 minutes)`.

Same request within 10 minutes returns the existing payment instead of creating a new one.

---

## Webhook Handling

### Verification

Webhooks are verified using HMAC-SHA256 signatures:

1. Read signature from header (`X-Emola-Signature` or `X-Multicaixa-Signature`)
2. Compute HMAC-SHA256 of raw body using webhook secret
3. Compare signatures using timing-safe comparison

If signature verification is not available, IP allowlist can be used.

### Testing Webhooks Locally

Use the mock endpoint (dev only):

```bash
# Simulate eMola SUCCESS
curl -X POST http://localhost:3003/api/webhooks/mock/emola \
  -H "Content-Type: application/json" \
  -d '{"reference": "EMOLA-A1B2C3D4", "status": "SUCCESS"}'

# Simulate Multicaixa FAILED
curl -X POST http://localhost:3003/api/webhooks/mock/multicaixa \
  -H "Content-Type: application/json" \
  -d '{"reference": "123456789", "status": "FAILED", "reason": "Insufficient funds"}'
```

---

## Mock Mode

Enable mock mode for development:

```env
EMOLA_MOCK=true
MULTICAIXA_MOCK=true
```

In mock mode:
- `initiate()` returns a fake provider reference
- `queryStatus()` always returns PENDING
- Webhooks can be simulated via `/api/webhooks/mock/:provider`

For auto-completion (optional):
```env
EMOLA_MOCK_AUTO_COMPLETE=true
EMOLA_MOCK_COMPLETE_DELAY=10000
```

---

## Environment Variables

Add to `.env.development`:

```env
# Payment Provider Configuration
EMOLA_API_URL=https://api.emola.co.mz
EMOLA_API_KEY=your-emola-api-key
EMOLA_API_SECRET=your-emola-api-secret
EMOLA_WEBHOOK_SECRET=your-emola-webhook-secret
EMOLA_MERCHANT_ID=your-merchant-id
EMOLA_MOCK=true

MULTICAIXA_API_URL=https://api.multicaixa.co.ao
MULTICAIXA_API_KEY=your-multicaixa-api-key
MULTICAIXA_API_SECRET=your-multicaixa-api-secret
MULTICAIXA_WEBHOOK_SECRET=your-multicaixa-webhook-secret
MULTICAIXA_MERCHANT_ID=your-merchant-id
MULTICAIXA_MOCK=true

# PII Encryption (32 bytes, base64)
PII_ENCRYPTION_KEY=your-32-byte-key-base64-encoded==

# Reconciliation Schedule (cron format)
RECONCILE_CRON=*/15 * * * *
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Running the System

### Start Backend
```bash
cd packages/webapp-backend
pnpm dev
```

### Start Frontend
```bash
cd packages/webapp
pnpm dev
```

### Access Checkout
Navigate to `http://localhost:3000/checkout`

---

## Testing

Run unit tests:
```bash
cd packages/webapp-backend
pnpm test -- --testPathPattern=payments
```

---

## Provider-Specific TODOs

### eMola (MZ)
- [ ] Obtain sandbox credentials from eMola
- [ ] Implement real API client in `emolaProvider.ts`
- [ ] Adjust webhook payload parsing to match actual format
- [ ] Configure webhook URL in eMola dashboard

### Multicaixa Express (AO)
- [ ] Obtain sandbox credentials from Multicaixa
- [ ] Implement real API client in `multicaixaProvider.ts`
- [ ] Adjust webhook payload parsing to match actual format
- [ ] Configure webhook URL in Multicaixa dashboard

---

## Phase 2 Roadmap

- [ ] Add M-Pesa MZ provider
- [ ] Add Unitel Money AO provider
- [ ] Card payments (Stripe/other)
- [ ] Payment history UI
- [ ] Refunds/disbursements
- [ ] Subscription payments

---

## Security Considerations

1. **PII Encryption**: Phone numbers are encrypted with AES-256-GCM before storage
2. **Webhook Verification**: HMAC-SHA256 signature verification or IP allowlist
3. **Idempotency**: Prevents duplicate payments
4. **Rate Limiting**: Applied to all payment endpoints
5. **Authentication**: All payment endpoints require JWT auth
6. **Audit Trail**: All events logged to `PaymentEvent` collection
