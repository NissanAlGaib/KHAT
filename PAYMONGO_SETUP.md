# PayMongo Payment Integration

This document explains how to set up and use the PayMongo payment integration for the PawLink breeding app.

## Setup

### 1. Create a PayMongo Account

1. Go to [PayMongo Dashboard](https://dashboard.paymongo.com)
2. Sign up for an account if you don't have one
3. Complete the verification process (for live payments)

### 2. Get Your API Keys

1. Log in to your PayMongo dashboard
2. Navigate to **Developers** > **API Keys**
3. You'll find two sets of keys:
   - **Test keys** (for development): Start with `pk_test_` and `sk_test_`
   - **Live keys** (for production): Start with `pk_live_` and `sk_live_`

### 3. Configure Environment Variables

Add the following to your `.env` file in the backend directory:

```env
# PayMongo Configuration
# For testing, use test API keys (start with pk_test_ and sk_test_)
PAYMONGO_PUBLIC_KEY=pk_test_your_public_key_here
PAYMONGO_SECRET_KEY=sk_test_your_secret_key_here
PAYMONGO_WEBHOOK_SECRET=whsk_your_webhook_secret_here
```

**Important**: 
- Use **test keys** during development
- Switch to **live keys** only when going to production
- Never commit your actual API keys to version control

### 4. Set Up Webhooks (Optional but Recommended)

Webhooks allow PayMongo to notify your application when payment events occur.

1. In PayMongo dashboard, go to **Developers** > **Webhooks**
2. Click **Create Webhook**
3. Set the URL to: `https://your-domain.com/api/webhooks/paymongo`
4. Select the following events:
   - `checkout_session.payment.paid`
   - `payment.paid`
   - `payment.failed`
5. Copy the webhook secret and add it to your `.env` as `PAYMONGO_WEBHOOK_SECRET`

### 5. Run Database Migration

```bash
cd backend
php artisan migrate
```

This will create the `payments` table to track all payment transactions.

## Usage

### Creating a Payment

To create a payment checkout session, use the `/api/payments/checkout` endpoint:

```http
POST /api/payments/checkout
Authorization: Bearer {token}
Content-Type: application/json

{
    "contract_id": 123,
    "payment_type": "collateral",
    "amount": 5000.00,
    "success_url": "yourapp://payment/success",
    "cancel_url": "yourapp://payment/cancel"
}
```

**Payment Types:**
- `collateral` - Owner's breeding contract collateral
- `shooter_collateral` - Shooter's collateral payment
- `shooter_payment` - Payment to the shooter for services
- `monetary_compensation` - Monetary compensation between breeding partners

**Response:**
```json
{
    "success": true,
    "message": "Checkout session created successfully",
    "data": {
        "payment_id": 1,
        "checkout_url": "https://checkout.paymongo.com/cs_xxx",
        "expires_at": "2024-01-01T12:00:00.000000Z"
    }
}
```

### Redirecting to Payment

1. Open the `checkout_url` in a web browser (or use WebView in React Native)
2. The user completes payment through PayMongo's checkout page
3. After payment, user is redirected to your `success_url` or `cancel_url`

### Verifying Payment

After the user returns from payment:

```http
GET /api/payments/{payment_id}/verify
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "payment_id": 1,
        "status": "paid",
        "paid_at": "2024-01-01T11:30:00.000000Z"
    }
}
```

### Getting Payment History

```http
GET /api/payments
Authorization: Bearer {token}
```

### Getting Contract Payments

```http
GET /api/contracts/{contract_id}/payments
Authorization: Bearer {token}
```

## Payment Methods Supported

PayMongo supports the following payment methods in the Philippines:

- **GCash** - Mobile wallet
- **Maya** (formerly PayMaya) - Mobile wallet
- **GrabPay** - Mobile wallet
- **Credit/Debit Cards** - Visa, Mastercard

## Testing

### Test Cards

For testing card payments, use these test card numbers:

| Card Number | Result |
|-------------|--------|
| 4343 4343 4343 4345 | Success |
| 4571 7360 0000 0075 | Failure |

Use any future expiry date and any 3-digit CVC.

### Test E-Wallets

When using test mode:
- GCash, Maya, and GrabPay will show mock authentication screens
- Choose "Authorize Test Payment" to simulate successful payment
- Choose "Fail Test Payment" to simulate failed payment

## Security Considerations

1. **Never expose your secret key** - Only use it on the backend
2. **Validate webhook signatures** - Always verify webhook payloads
3. **Use HTTPS** - Ensure your webhook endpoint uses HTTPS
4. **Verify amounts** - Always verify payment amounts match expected values
5. **Store minimal data** - Don't store sensitive payment data locally

## Troubleshooting

### "Invalid API key" Error
- Ensure you're using the correct key (test vs live)
- Check that the key is properly copied without extra spaces

### Webhook Not Receiving Events
- Verify the webhook URL is publicly accessible
- Check that the webhook secret matches
- Ensure HTTPS is properly configured

### Payment Amount Issues
- PayMongo requires a minimum of ₱20
- Amounts are in Philippine Peso (PHP)
- API amounts are in centavos (multiply by 100)

## API Reference

For full PayMongo API documentation, visit:
- [PayMongo API Documentation](https://developers.paymongo.com/reference)
- [PayMongo Checkout API](https://developers.paymongo.com/docs/accepting-payments)
