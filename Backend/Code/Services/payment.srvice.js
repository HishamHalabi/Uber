import { PaymentR } from "../Models/Payment/payment.repository";
import { BadRequest } from "../Utils/error.utils";
import { makePayment } from "./paymob.service";

const uberFees  =  12 , cst  = 2;
export async function  registPayment(trip_id , ETA ,   user) {
    const data  = await  findPayment({trip_id})  ; 
    id (data && data.status!="failed")  { 
            throw new BadRequest("already have payment")  
    }
    const amt = ETA  * cst +   uberFees ; 
    const {paymentKey , order_id} =await  makePayment(amt  , user) ;  
    const payment =   await PaymentR.Create({trip_id , amt , order_id}) ;
    return {payment ,  paymentKey} ; 
}

export async function findPayment (condition)  { 
     return await PaymentR.FindOne(condition) ; 
}

export async function updatePayment (condition ,   data)  { 
     return await PaymentR.Update(condition , data) ; 
}