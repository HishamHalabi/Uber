
import { userR } from "../Models/User/user.reopsitory.js";
import { BadRequest, NotFound, UnAuthorized } from "../Utils/error.utils.js";
import { add, get } from "./CoreLogic/inMemory.service.js";
import { comp, encrypt, hash } from "../Utils/crypto.utils.js";
import { decodeToken, generateAccessToken, generateTokens } from "../Utils/token.utils.js";
import { Op } from "sequelize";
import { SendEMail } from "../Utils/nodemailer.utils.js";
import { driverR } from "../Models/Driver/driver.repository.js";
export async function sendOtp(email) {  
    
    const exist = await get(`otp_${email}}`) ;
    if (exist)  { 
           throw new BadRequest("already have otp") ; 
    }

    //create otp
    const  mn =  1E8   ,  mx =   1E9 - 1  ;
    const otp = mn  +  Math.floor((mx -  mn)   *  Math.random()); 
    const exp =   3   *  60   ; 
    await  add(`otp_${email}` ,`${otp}`,   exp) ; 
    await SendEMail(email  , "Email verification" ,  `<p>your code is ${otp} </p>`)
    return true ; 
}

export async function registUser(body)  { 
      let  {role	 , name , 	email	   , password , phoneNumber}  =  body ; 
      let  user =  await userR.FindOne({
                              [Op.or]: [
                                    { email: email },
                                    { phoneNumber: phoneNumber }
                              ]
      }) ; 

      if (user)  { 
              throw new BadRequest("user is found") ; 
      }

      password =  await hash(password) ; 
     

      phoneNumber = encrypt(phoneNumber) ;  
      user  =   await userR.Create({name, email , password , phoneNumber , role}) ; 
      console.log(phoneNumber  , user, password)
      await sendOtp(user.ID , user.email) ; 
      return user ; 
}

export async function registDriver(body)  { 
      let  {NationalId,	carNo , role	}  =  body ; 
      const user  =  await  registUser(body)  ; 
      if (role != "driver")  { 
            throw new BadRequest("not allowed to be adriver") ; 
      }
      const driver = await driverR.Create({user_id : user.ID  , NationalId , carNo}) ; 
      return driver ; 
}

export async function  verifyEmail(email , otp) { 
    const exist = await get(`otp_${email}`) ;
    if (!exist )  { 
           throw new BadRequest("have no otp or otp expired") ; 
    }

    console.log(otp ,  exist) ;
    if (otp != exist)  { 
        throw new BadRequest("incorrect Otp"); 
    }
    const user =  await userR.FindOne({email}) ; 
    if (!user)  { 
           throw new NotFound("user not found ") ; 
    }
    return await userR.Update({email} , {verified  : true}) ; 
}


export async function  login(body) { 
    let {email , password}    = body ; 
    
    const user =  await userR.FindOne({email , verified : true}) ;
    if (!user)  { 
           throw new NotFound("user not found ") ; 
    }

    const ok  = await comp(password , user.password) ; 
    if (!ok)  { 
          throw UnAuthorized("invalid credntials") ; 
    }
    return   generateTokens(user)  ; 
}

export  async function logoutAll(id)  { 
   return await userR.Update({ID : id} ,  {credentialsUpdatedAt : Date.now()}) ; 
}

export  async function logout(payload)  { 
   const ex = payload.exp - Math.floor(Date.now() / 1000);
   return await add(`token_${accessToken.jti}`  , "1"  ,ex) ;  
}

export async function getAccessToken(refreshToken)  { 
      const decoded =  decodeToken(refreshToken) ; 
      return await generateAccessToken(decoded) ; 
}