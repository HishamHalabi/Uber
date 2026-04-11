import { getAllPayments, getUserPayments } from "../Services/payment.srvice.js";

export async function getUserPaymentsC(req, res, next) {
    const Payments = await getUserPayments(req.user.id);
    return res.status(200).json({ Message: "success", data: Payments });
}

export async function getAllPaymentsC(req, res, next) {
    const Payments = await getAllPayments();
    return res.status(200).json({ Message: "success", data: Payments });
}