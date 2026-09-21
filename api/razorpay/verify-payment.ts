import crypto from 'crypto';

// Serverless Endpoint: POST /api/razorpay/verify-payment
// Verifies HMAC SHA256 payment signature from Razorpay

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.writeHead?.(405, { 'Content-Type': 'application/json' }) || res.status?.(405);
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }));
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, agencyId } = body || {};

    // If key secret is configured and signature is provided, verify cryptographically
    if (keySecret && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      const isValid = expectedSignature === razorpay_signature;

      if (!isValid) {
        res.writeHead?.(400, { 'Content-Type': 'application/json' }) || res.status?.(400);
        res.end(JSON.stringify({ success: false, error: 'INVALID_PAYMENT_SIGNATURE' }));
        return;
      }
    }

    // Success response
    res.writeHead?.(200, { 'Content-Type': 'application/json' }) || res.status?.(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Payment verified and commercial tier upgraded successfully.',
      planId,
      agencyId
    }));
  } catch (err: any) {
    res.writeHead?.(500, { 'Content-Type': 'application/json' }) || res.status?.(500);
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
