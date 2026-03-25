import  {Router} from  "express" ; 
import { logoutAllDevices, logoutDevice, retakeAccessToken, sendOtpC, SignIn, SignUpUser, SignUpDriver, verifyEmailC } 
from "../Controllers/Auth.controller.js";
import { authenticate } from "../Mildewares/authenticate.mildeware.js";
import { fileUpload } from "../Utils/multer.utils.js";

const AuthRouter  =  Router (); 

AuthRouter.post('/signUpUser'  ,fileUpload().none(),  SignUpUser) ; 
AuthRouter.post('/signUpDriver'  ,fileUpload().none(),  SignUpDriver) ; 
AuthRouter.get('/signIn' ,   SignIn)  ; 
AuthRouter.patch('/verifyEmail' ,verifyEmailC  ) ; 
AuthRouter.post('/sendEmailVerification' ,  sendOtpC) ; 

AuthRouter.patch('/logoutAllDevices'  ,authenticate()  , logoutAllDevices); 
AuthRouter.post('/logout'  , authenticate() ,  logoutDevice); 
AuthRouter.post('/retakeAccessToken'  , authenticate() , retakeAccessToken) ; 

export { AuthRouter}