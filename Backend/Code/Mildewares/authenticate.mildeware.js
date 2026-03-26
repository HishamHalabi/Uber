import { driverR } from "../Models/Driver/driver.repository.js";
import { User } from "../Models/User/user.model.js";
import { userR } from "../Models/User/user.reopsitory.js";
import { get } from "../Services/CoreLogic/inMemory.service.js";
import { UnAuthorized } from "../Utils/error.utils.js";
import { decodeToken } from "../Utils/token.utils.js";

export async function auth(data, isDriver = 0) {
   let token, tp = 1;
   if (data.accesstoken) {
      token = data.accesstoken;
   }
   else if (data.refreshtoken) {
      token = data.refreshtoken;
      tp = 0;
   }


   const payload = decodeToken(token, tp);

   const gt = await get(`token_${payload.jti}`);
   console.log()
   if (gt) {
      throw new UnAuthorized("not authorized access");
   }


   if (isDriver && !payload.user_id) {
      throw new UnAuthorized("not authorized access");
   }



   const user = await userR.FindOne({ ID: payload.ID, verified: true });
   if (!user) {
      throw new UnAuthorized("not authorized access");
   }
   if (Math.floor(user.credentialsUpdatedAt / 1000) > payload.iat) {
      throw new UnAuthorized("expired tokens");
   }
   return { user, payload };

}

export function authenticate(isDriver = 0) {
   return async (req, res, next) => {
      const { user, payload } = await auth(req.headers, isDriver);
      if (user.role == "driver") {
         const driver = await driverR.FindOneWithPop({ user_id: user.ID }, User);
         req.driver = driver;
      }

      req.user = user;
      req.payload = payload;
      next();
   }
}