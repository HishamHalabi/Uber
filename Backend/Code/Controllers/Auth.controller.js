import { getAccessToken, login, logout, logoutAll, registDriver, registUser, sendOtp, verifyEmail } from "../Services/Auth.service.js";

export async function SignUpUser(req, res, next) {
     // console.log(req.body)
     const user = await registUser(req.body);
     return res.status(201).json({ Message: "User created success", Success: "true", user });
}

export async function SignUpDriver(req, res, next) {
     // console.log(req.body)
     const driver = await registDriver(req.body);
     return res.status(201).json({ Message: "User created success", Success: "true", driver });
}


export async function verifyEmailC(req, res, next) {
     await verifyEmail(req.body.email, req.body.otp);
     return res.status(200).json({ Message: "verified successfuly", Success: "true" });
}

export async function SignIn(req, res, next) {
     const Tokens = await login(req.body);
     return res.status(200).json({ Message: "success", Success: "true", Tokens });
}



//thus need authenticate so we have req.user || driver
export async function logoutAllDevices(req, res, next) {
     await logoutAll(req.user.ID);
     return res.status(200).json({ Message: "logout successfuly", Success: "true" });
}


export async function logoutDevice(req, res, next) {
     await logout(req.payload);
     return res.status(200).json({ Message: "logout successfuly from this device", Success: "true" });
}


export async function retakeAccessToken(req, res, next) {
     const accessToken = await getAccessToken(req.headers.refreshtoken);
     return res.status(200).json({ Message: "success", Success: "true", accessToken });
}


export async function sendOtpC(req, res, next) {
     await sendOtp(req.body.email);
     return res.status(200).json({ Message: "send otp  success", Success: "true" });
}