import { addFeedback, getAllFeedbacks, getUserFeedbacks } from "../Services/feedback.service.js";
import { UnAuthorized } from "../Utils/error.utils.js";

export async function getALLFeedbacksC(req, res, next) {
    if (req.user.role != "admin") {
        throw new UnAuthorized("not authorized to see all feedbacks");
    }
    const feedBacks = await getAllFeedbacks();
    return res.status(200).json({ Message: "success", data: feedBacks });
}

export async function getUserFeedbacksC(req, res, next) {
    const feedBacks = await getUserFeedbacks(req.user.id);
    return res.status(200).json({ Message: "success", data: feedBacks });
}

export async function addFeedbackC(req, res, next) {
    console.log(req.body);
    const feedBack = await addFeedback(req.body);
    return res.status(200).json({ Message: "success", data: feedBack });
}