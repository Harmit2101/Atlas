// Serverless Endpoint: POST /api/razorpay/create-order
// Creates a Razorpay Order server-side to protect RAZORPAY_KEY_SECRET

const PLAN_RATES: Record<string, { monthlyUsd: number; monthlyInr: number; annualUsd: number; annualInr: number }> = {
  broker_pro: { monthlyUsd: 299, monthlyInr: 24999, annualUsd: 2870, annualInr: 239990 },
  agency_growth: { monthlyUsd: 1499, monthlyInr: 124999, annualUsd: 14390, annualInr: 1199990 },
  enterprise_whitelabel: { monthlyUsd: 4997, monthlyInr: 415000, annualUsd: 47970, annualInr: 3990000 }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.writeHead?.(405, { 'Content-Type': 'application/json' }) || res.status?.(405);
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }));
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }

    const { planId = 'agency_growth', billingCycle = 'monthly', currency = 'USD', agencyId, agencyName } = body || {};

    const plan = PLAN_RATES[planId] || PLAN_RATES.agency_growth;
    const isAnnual = billingCycle === 'annual';
    const amountNumber = currency === 'INR'
      ? (isAnnual ? plan.annualInr : plan.monthlyInr)
      : (isAnnual ? plan.annualUsd : plan.monthlyUsd);

    const amountSmallestUnit = amountNumber * 100; // paise or cents

    // If Razorpay secret is present, create order with Razorpay API
    if (keyId && keySecret) {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountSmallestUnit,
          currency: currency,
          receipt: `rcpt_${(agencyId || 'deal').slice(0, 10)}_${Date.now()}`,
          notes: {
            plan_id: planId,
            billing_cycle: billingCycle,
            agency_name: agencyName || 'Atlas Partner'
          }
        })
      });

      if (response.ok) {
        const orderData = await response.json();
        res.writeHead?.(200, { 'Content-Type': 'application/json' }) || res.status?.(200);
        res.end(JSON.stringify({
          orderId: orderData.id,
          amount: orderData.amount,
          currency: orderData.currency,
          keyId
        }));
        return;
      }
    }

    // Fallback order generation for dev/preview
    res.writeHead?.(200, { 'Content-Type': 'application/json' }) || res.status?.(200);
    res.end(JSON.stringify({
      orderId: `order_dev_${Math.random().toString(36).slice(2, 12)}`,
      amount: amountSmallestUnit,
      currency: currency,
      keyId: keyId || 'rzp_test_placeholder',
      isSimulated: true
    }));
  } catch (err: any) {
    res.writeHead?.(500, { 'Content-Type': 'application/json' }) || res.status?.(500);
    res.end(JSON.stringify({ error: 'ORDER_CREATION_FAILED', message: err.message }));
  }
}
