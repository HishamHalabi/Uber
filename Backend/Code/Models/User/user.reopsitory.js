import { DBrepository } from "../../Config/db.repository.js";
import { User } from "./user.model.js";

class RiderRepo extends DBrepository {
    constructor(model)  { 
         super(model) ; 
    }
}
export const userR = new RiderRepo(User)  ; 
