import jwt from "jsonwebtoken"

const signatureAcess ="123"  , signatureRefresh =  "123"; 

export function generateAccessToken(payload) {
       delete  payload.exp  ; 
    delete payload.iat ; 
    delete payload.expiresIn;
      return jwt.sign(payload , signatureAcess ,  {expiresIn  : "1h"}) ; 
}
export function generateRefreshToken(payload) {
        delete  payload.exp  ; 
    delete payload.iat ; 
    delete payload.expiresIn;
      return jwt.sign(payload , signatureRefresh ,  {expiresIn  : "1h"}) ; 
}

export function  generateTokens(payload) { 
    payload=  JSON.parse(JSON.stringify(payload)) ; 
    //u may add them by mistake and they 'll be added again
 
   
    return  {
        accessToken :  generateAccessToken(payload)  , 
        refreshToken : generateRefreshToken(payload) 
    }
}

export function decodeToken(token , isAccess = 1) {  
     const sign = isAccess ?  signatureAcess    : signatureRefresh ; 
     const decoded =  jwt.verify(token , sign) ; 
     return decoded; 
}