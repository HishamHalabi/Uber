import { Op } from "sequelize";
import { Driver } from "../Models/Driver/driver.model.js";
import { driverR } from "../Models/Driver/driver.repository.js";
import { FeedBackR } from "../Models/FeedBack/FeedBack.repo.js";
import { LocationR } from "../Models/Location/location.repository.js";
import { tripR } from "../Models/Trip/trip.repository.js";
import { userR } from "../Models/User/user.reopsitory.js";
import { UnAuthorized } from "../Utils/error.utils.js";

//for get profile  >> req.user ,  req.driver already added inside authentication


export async function  getAllusers(user){
        if (user.admin!="admin"  || (1))  {
                throw new UnAuthorized("unAuthorized Access") ; 
        } 
        const users = await  userR.FindWithPop(Driver) ;
        return users;
}


export  async function updateProfilePic(id) {
       const path = req.file.path ; 
       return await userR.Update({ID : id} ,  {profilePic : path});  
}

//must verify not updated uniquness or credtials fields
export  async function updateData(id  , body) {
       return await userR.Update({ID : id} ,  {body});  
}

//very costive
export async function deleteUser(id)  { 
       
         //deleteDriver
         await driverR.Delete({user_id : id}) ; 
         //delete locations 
         await LocationR.Delete({driver_id  :  id});
         //delete feedbacks

         const trips = await tripR.Find({[Op.or]  :  [{user_id :  id} ,  {driver_id : id}]}) ; 
         for (let trip  of  trips)  { 
                    await FeedBackR.Delete({trip_id :  trip.ID}) ; 
         }
         await tripR.Delete({[Op.or]  :  [{user_id :  id} ,  {driver_id : id}]}) ; 

         await userR.Delete({ID :  id})
         return true ; 
}


