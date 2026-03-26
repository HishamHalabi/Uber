import { Router } from "express";
import { authenticate } from "../Mildewares/authenticate.mildeware.js";
import { deleteUserC, getAllusersC, getProfile, updateDataC, updateProfilePicC } from "../Controllers/user.controller.js";
import { fileUpload } from "../Utils/multer.utils.js";
import { validate, schemas } from "../Mildewares/validate.mildeware.js";
const userRouter = Router();




userRouter.get('/', authenticate(), getAllusersC);
userRouter.get('/profile', authenticate(), getProfile);

userRouter.patch('/', authenticate(), validate(schemas.UpdateData), updateDataC);
userRouter.patch('/update-profilePic', authenticate(), fileUpload().single("img"), updateProfilePicC);
userRouter.delete('/', authenticate(), deleteUserC);

export { userRouter }

