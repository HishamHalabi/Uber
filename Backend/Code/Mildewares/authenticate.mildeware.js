import { driverR } from "../Models/Driver/driver.repository.js";
import { User } from "../Models/User/user.model.js";
import { userR } from "../Models/User/user.reopsitory.js";
import { get } from "../Services/inMemory.service.js";
import {  UnAuthorized } from "../Utils/error.utils.js";
import { decodeToken } from "../Utils/token.utils.js";

export  function authenticate(isDriver = 0)  {
    return async  (req,res,next)=>{ 
           let token  ,tp = 1;
           if ( req.headers.accesstoken ){
              token  = req.headers.accesstoken ; 
           } 
           else if( req.headers.refreshtoken ) { 
              token  = req.headers.refreshtoken ;
              tp =   0 ; 
           } 
            

           const payload = decodeToken(token ,tp) ; 

           const gt = await get(`token_${payload.jti}`) ; 
           console.log()
           if (gt){
                 throw new UnAuthorized("not authorized access") ; 
           }
       
 
           if (isDriver  && !payload.user_id)  { 
                  throw new UnAuthorized("not authorized access") ; 
           }      

         
         
        const user    =await userR.FindOne({ID : payload.ID , verified:true})  ;  
         if (!user)  { 
                throw new UnAuthorized("not authorized access") ; 
        } 
        if (Math.floor(user.credentialsUpdatedAt /  1000)    >payload.iat) {  
                    throw new UnAuthorized("expired tokens") ; 
        } 
        
        if (user.role== "driver")  { 
                const driver=  await driverR.FindOneWithPop({user_id : user.ID}  , User) ;
                req.driver = driver;
        }

        req.user = user; 
        req.payload  = payload; 
        next() ; 
    } 
}