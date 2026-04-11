import { DBrepository } from "../../Config/db.repository.js"
import { Trip } from "./trip.model.js";

class TripRepo  extends DBrepository  {
    constructor (model)  { 
        super(model) ; 
    }
}  ;

export const tripR = new TripRepo(Trip) ; 