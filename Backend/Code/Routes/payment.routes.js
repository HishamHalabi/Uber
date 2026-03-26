import { Router } from "express"
import { getAllPaymentsC, getUserPaymentsC } from "../Controllers/payment.controller.js";

const PaymentRouter = Router();
PaymentRouter.get('/', getAllPaymentsC);
PaymentRouter.get('/userPayments', getUserPaymentsC);

export { PaymentRouter }; 