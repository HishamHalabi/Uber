import { Op } from "sequelize";
import { Payment } from "../Models/Payment/payment.model.js";
import { PaymentR } from "../Models/Payment/payment.repository.js";
import { Trip } from "../Models/Trip/trip.model.js";
import { tripR } from "../Models/Trip/trip.repository.js";
import { BadRequest } from "../Utils/error.utils.js";
import { makePayment } from "./paymob.service.js";

const uberFees = 12, cst = 2;
export async function registPayment(trip_id, ETA, user, t) {
     const data = await findPayment({ trip_id });
     if (data && data.status != "failed") {
          throw new BadRequest("already have payment")
     }
     const amt = ETA * cst + uberFees;
     const { paymentKey, order_id } = await makePayment(amt, user);
     const payment = await PaymentR.Create({ trip_id, amt, order_id }, { transaction: t });
     return { payment, paymentKey };
}

export async function findPayment(condition) {
     return await PaymentR.FindOne(condition);
}

export async function updatePayment(condition, data) {
     return await PaymentR.Update(condition, data);
}


export async function getPayment(trip_id) {
     return await PaymentR.FindOneWithPop({ trip_id }, Trip);
}


export async function getAllPayments() {
     return await PaymentR.FindWithPop({}, Trip);
}

export async function getUserPayments(id) {
     const trips = await tripR.FindWithPop({
          [Op.or]: [
               { user_id: id },
               { driver_id: id }
          ]
     }, Payment);

     const payments = [];
     for (let trip of trips) {
          payments.push(trip.Payment);
     }
     return payments;
}
