import axios from "axios";

export async function makePayment(amt, user) {
  try {
    const API_KEY = process.env.PAYMOB_API_KEY.trim(); // Remove any extra spaces
    const INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID.trim();
    const amount_cents = Math.round(parseFloat(amt) * 100); // Uniformly use cents everywhere

    // 1. Auth
    const auth = await axios.post("https://accept.paymob.com/api/auth/tokens", { api_key: API_KEY });
    const token = auth.data.token;

    // 2. Order (Use 'amount_cents')
    const order = await axios.post("https://accept.paymob.com/api/ecommerce/orders", {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amount_cents,
      currency: "EGP",
      items: []
    });
    const order_id = order.data.id;

    // 3. Payment Key
    const paymentKey = await axios.post("https://accept.paymob.com/api/acceptance/payment_keys", {
      auth_token: token,
      amount_cents: amount_cents, // Match exactly!
      expiration: 3600,
      order_id: order_id,
      currency: "EGP",
      integration_id: INTEGRATION_ID,
      billing_data: {
        first_name: user.name || "User", last_name: "NA",
        email: user.email || "test@test.com", phone_number: user.phoneNumber || "01000000000",
        apartment: "NA", floor: "NA", street: "NA", building: "NA",
        shipping_method: "NA", postal_code: "NA", city: "NA",
        country: user.country || "EG", state: "NA"
      }
    });

    return { paymentKey: paymentKey.data.token, order_id };
  } catch (err) {
    // THIS LOG IS CRITICAL - It tells us the EXACT reason from Paymob
    console.error(" Paymob Error Details:", err.response?.data || err.message);
    throw err;
  }
}

export async function refundPayment(transactionId, amt) {
  try {
    const API_KEY = process.env.PAYMOB_API_KEY.trim();
    const amount_cents = Math.round(parseFloat(amt) * 100);

    // 1️⃣ Auth
    const auth = await axios.post(
      "https://accept.paymob.com/api/auth/tokens",
      { api_key: API_KEY }
    );

    const token = auth.data.token;

    // 2️⃣ Refund request
    const refund = await axios.post(
      "https://accept.paymob.com/api/acceptance/void_refund/refund",
      {
        auth_token: token,
        transaction_id: transactionId,
        amount_cents: amount_cents
      }
    );

    return refund.data;

  } catch (err) {
    console.error(" Paymob Refund Error:", err.response?.data || err.message);
    throw err;
  }
}