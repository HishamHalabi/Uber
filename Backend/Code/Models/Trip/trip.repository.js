import { DBrepository } from "../../Config/db.repository.js"
import { Trip } from "./trip.model.js";

class TripRepo  extends DBrepository  {
    constructor (model)  { 
        super(model) ; 
    }
}  ;

export const DriverR = new TripRepo(Trip) ; 