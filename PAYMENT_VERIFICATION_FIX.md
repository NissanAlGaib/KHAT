# Payment Verification Fix

## Issue Description

After completing a payment through PayMongo, the application was not detecting successful payments. Users would see a "Payment Pending" dialog even after successfully paying.

## Root Cause

The payment verification logic in `PaymentController::verifyPayment()` was only checking the checkout session's `status` field, but PayMongo's API structure works as follows:

1. When a checkout session is created, the status is `active`
2. After successful payment, the checkout session adds payment records to the `payments` array
3. The checkout session status may still be `active` even with successful payments in the array
4. Each payment in the `payments` array has its own `status` field that indicates if it's `paid`

## Changes Made

### 1. PaymentController.php - Enhanced Verification Logic

**File:** `backend/app/Http/Controllers/PaymentController.php`

**Changes:**

- Added comprehensive logging to track payment verification attempts
- Modified verification to check both:
  - The checkout session status (`paid`)
  - The presence of payment records in the `payments` array with status `paid`
- Iterate through all payments in the checkout session to find successful ones
- Extract the PayMongo payment ID from successful payment records
- Added detailed logging for successful verifications and failures

**Key Logic:**

```php
// Check if there are any payments in the checkout session
$hasSuccessfulPayment = false;
$paymongoPaymentId = null;

if (!empty($payments)) {
    foreach ($payments as $paymentData) {
        $paymentStatus = $paymentData['attributes']['status'] ?? null;
        if ($paymentStatus === 'paid') {
            $hasSuccessfulPayment = true;
            $paymongoPaymentId = $paymentData['id'];
            break;
        }
    }
}

// Check both the checkout status and if we have successful payment records
if ($checkoutStatus === 'paid' || $hasSuccessfulPayment) {
    // Mark payment as paid
}
```

### 2. PayMongoService.php - Improved Logging

**File:** `backend/app/Services/PayMongoService.php`

**Changes:**

- Added detailed logging when retrieving checkout sessions
- Log the checkout status, payment count, and whether payments exist
- Enhanced error logging with full stack traces
- Added warnings for failed checkout session retrievals

## How It Works Now

1. User completes payment on PayMongo
2. User returns to the app and clicks "Check Again" or "Verify Payment"
3. Frontend calls `/api/payments/{id}/verify`
4. Backend retrieves the checkout session from PayMongo
5. Backend checks:
   - Is checkout status `paid`? → Mark as paid
   - OR does the payments array contain a payment with status `paid`? → Mark as paid
6. If either condition is true, the payment is marked as paid in the database
7. The contract/subscription is updated accordingly
8. User sees success message

## Testing Instructions

### 1. Test with Real PayMongo Payment

1. Start the backend server:

   ```bash
   cd backend
   php artisan serve
   ```

2. Start the frontend:

   ```bash
   cd PawLink
   npx expo start
   ```

3. Navigate to the subscription screen in the app

4. Click "Subscribe to Standard" or "Subscribe to Premium"

5. Complete the payment on PayMongo using test payment methods:

   - **GCash Test Number:** 09123456789 (OTP: 123456)
   - **Card Test:** 4120 0000 0000 0007 (any future expiry, any CVV)

6. After payment completion, return to the app

7. Click "I've Completed Payment" or "Verify Payment"

8. The app should now detect the successful payment and show success message

### 2. Check Backend Logs

Monitor the Laravel logs to see payment verification details:

```bash
cd backend
tail -f storage/logs/laravel.log
```

Look for log entries like:

```
[timestamp] local.INFO: Payment verification {"payment_id":123,"checkout_id":"cs_xxx","result_success":true,"checkout_status":"active","has_payments":true}
[timestamp] local.INFO: PayMongo checkout session retrieved {"checkout_id":"cs_xxx","status":"active","has_payments":true,"payment_count":1}
[timestamp] local.INFO: Payment verified as paid {"payment_id":123,"checkout_status":"active","paymongo_payment_id":"pay_xxx"}
```

### 3. Verify in Database

Check the payments table to confirm status updates:

```sql
SELECT id, user_id, payment_type, amount, status, paid_at, paymongo_payment_id
FROM payments
WHERE user_id = <your_user_id>
ORDER BY created_at DESC;
```

The payment should show:

- `status`: `paid`
- `paid_at`: Timestamp of when payment was verified
- `paymongo_payment_id`: The PayMongo payment ID (e.g., `pay_xxx`)

## Webhook Alternative

For production environments, it's recommended to set up PayMongo webhooks to automatically update payment status without user interaction:

1. Configure webhook in PayMongo dashboard pointing to: `https://your-domain.com/api/webhooks/paymongo`
2. Set the webhook secret in `.env`: `PAYMONGO_WEBHOOK_SECRET=whsk_xxx`
3. Subscribe to events:
   - `checkout_session.payment.paid`
   - `payment.paid`
   - `payment.failed`

The webhook handler already exists in `PaymentController::handleWebhook()` and will automatically mark payments as paid when PayMongo sends the notification.

## PayMongo API Documentation

For reference, see PayMongo's documentation:

- [Checkout Sessions](https://developers.paymongo.com/reference/the-checkout-session-object)
- [Payments](https://developers.paymongo.com/reference/the-payment-object)
- [Webhooks](https://developers.paymongo.com/reference/webhook-resource)

## Troubleshooting

### Issue: Still shows "Payment Pending" after verification

**Check:**

1. Are the PayMongo API keys correct in `.env`?
2. Is SSL verification causing issues? (set `PAYMONGO_VERIFY_SSL=false` for local dev only)
3. Check Laravel logs for errors during verification
4. Verify the checkout session ID exists in the database

### Issue: Cannot connect to PayMongo API

**Solutions:**

1. Set `PAYMONGO_VERIFY_SSL=false` in backend `.env` for local development
2. Check internet connection
3. Verify API keys are active in PayMongo dashboard
4. Check if PayMongo service is operational

### Issue: Frontend shows different error

**Check:**

1. Is the backend running and accessible?
2. Check frontend console for errors
3. Verify the API endpoint URL in frontend config
4. Check authentication token is valid

## Additional Notes

- The fix applies to both subscription payments and contract-related payments (collateral, shooter payments, etc.)
- Payments are verified on-demand when the user clicks "Check Again" or when the app returns to foreground
- The verification endpoint is idempotent - calling it multiple times is safe
- Successful payments update the user's subscription tier or contract payment status automatically
