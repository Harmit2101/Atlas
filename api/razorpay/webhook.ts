import crypto from 'crypto';

// Serverless Endpoint: POST /api/razorpay/webhook
// Handles Razorpay automated webhook events (payment.captured, order.paid, subscription.charged)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.writeHead?.(405, { 'Content-Type': 'application/json' }) || res.status?.(405);
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }));
    return;
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    const signature = req.headers['x-razorpay-signature'];
    let rawBody = req.body;

    if (typeof rawBody === 'object') {
      rawBody = JSON.stringify(rawBody);
    }

    // Verify webhook signature if secret is present
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        res.writeHead?.(400, { 'Content-Type': 'application/json' }) || res.status?.(400);
        res.end(JSON.stringify({ error: 'INVALID_WEBHOOK_SIGNATURE' }));
        return;
      }
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const event = payload.event;

    console.log(`[ATLAS Razorpay Webhook] Received event: ${event}`);

    // Handle relevant payment events
    switch (event) {
      case 'payment.captured':
      case 'order.paid':
        // The notes on the payment contain plan_id and agency_name
        const notes = payload.payload?.payment?.entity?.notes || {};
        console.log('[ATLAS Razorpay Webhook] Provisioning plan:', notes.plan_id, 'for', notes.agency_name);
        break;

      case 'subscription.charged':
        console.log('[ATLAS Razorpay Webhook] Subscription renewal charged.');
        break;

      default:
        console.log(`[ATLAS Razorpay Webhook] Unhandled event type: ${event}`);
    }

    res.writeHead?.(200, { 'Content-Type': 'application/json' }) || res.status?.(200);
    res.end(JSON.stringify({ status: 'ok', received: true }));
  } catch (err: any) {
    console.error('[ATLAS Razorpay Webhook] Error:', err);
    res.writeHead?.(500, { 'Content-Type': 'application/json' }) || res.status?.(500);
    res.end(JSON.stringify({ error: 'WEBHOOK_PROCESSING_FAILED', message: err.message }));
  }
}
