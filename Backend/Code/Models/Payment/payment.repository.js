import { DBrepository } from "../../Config/db.repository.js"
import { Payment } from "./payment.model.js";

class PaymentRepo  extends DBrepository  {
    constructor (model)  { 
        super(model) ; 
    }
}  ;



export const PaymentR = new PaymentRepo(Payment) ; 