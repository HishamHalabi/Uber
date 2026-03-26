import { Router } from "express";
import { logoutAllDevices, logoutDevice, retakeAccessToken, sendOtpC, SignIn, SignUpUser, SignUpDriver, verifyEmailC }
    from "../Controllers/Auth.controller.js";
import { authenticate } from "../Mildewares/authenticate.mildeware.js";
import { fileUpload } from "../Utils/multer.utils.js";
import { validate, schemas } from "../Mildewares/validate.mildeware.js";

const AuthRouter = Router();

AuthRouter.post('/signUpUser', validate(schemas.SignUpUser), SignUpUser);
AuthRouter.post('/signUpDriver', validate(schemas.SignUpDriver), SignUpDriver);
AuthRouter.post('/signIn', validate(schemas.SignIn), SignIn);
AuthRouter.patch('/verifyEmail', validate(schemas.VerifyEmail), verifyEmailC);
AuthRouter.post('/sendEmailVerification', validate(schemas.SendOtp), sendOtpC);

AuthRouter.patch('/logoutAllDevices', authenticate(), logoutAllDevices);
AuthRouter.post('/logout', authenticate(), logoutDevice);
AuthRouter.post('/retakeAccessToken', authenticate(), retakeAccessToken);

export { AuthRouter }