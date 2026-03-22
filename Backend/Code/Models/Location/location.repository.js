import { DBrepository } from "../../Config/db.repository.js"
import { Location } from "./location.model.js";


class LocationReb extends DBrepository  {
    constructor (model)  { 
        super(model) ; 
    }
}  ;

export const LocationR = new LocationReb(Location) ; 