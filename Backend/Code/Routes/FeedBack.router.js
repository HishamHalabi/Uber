import { Router } from "express"
import { authenticate } from "../Mildewares/authenticate.mildeware.js";
import { addFeedbackC, getALLFeedbacksC, getUserFeedbacksC } from "../Controllers/FeedBack.controller.js";
import { FeedBack } from "../Models/FeedBack/FeedBack.model.js";
import { validate, schemas } from "../Mildewares/validate.mildeware.js";
const FeedBackRouter = Router();

FeedBackRouter.get('/', getALLFeedbacksC);
FeedBackRouter.get('/userFeedbacks', getUserFeedbacksC);
FeedBackRouter.patch('/addFeedBack', validate(schemas.AddFeedback), addFeedbackC);

export { FeedBackRouter }; 