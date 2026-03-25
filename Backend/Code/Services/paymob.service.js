import axios from "axios"

//credentials
const auth = await axios.post(
  "https://accept.paymob.com/api/auth/tokens",
  { api_key: process.env.PAYMOB_API_KEY }
);
const token = auth.data.token;

export async function  makePayment(amt   , user){
        const order = await axios.post(
        "https://accept.paymob.com/api/ecommerce/orders",
        {
            auth_token: token,
            delivery_needed: false,
            amount_cents: amt,
            currency: cur,
            items: []
        }
        );
        const orderId = order.data.id;


        //payment key to send for FrontEnd
        const paymentKey = await axios.post(
        "https://accept.paymob.com/api/acceptance/payment_keys",
        {
                first_name: user.name,
                last_name: "NA",
                email: user.email,
                phone_number: user.phoneNumber,
                apartment: "NA",
                floor: "NA",
                street: "NA",
                building: "NA",
                shipping_method: "NA",
                postal_code: "NA",
                city: "NA",
                country: user.country || "NA",
                state: "NA"
        }
        );
        return {paymentKey , orderId} ; 
}