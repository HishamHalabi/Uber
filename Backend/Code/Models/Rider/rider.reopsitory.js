import { DBrepository } from "../../Config/db.repository.js";
import { Rider } from "./rider.model.js";

class RiderRepo extends DBrepository {
    constructor(model)  { 
         super(model) ; 
    }
}
export const RiderR = new RiderRepo(Rider)  ; 