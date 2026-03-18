import { DBrepository } from "../../Config/db.repository.js"
import { Driver } from "./driver.model.js";

class DriverRepo  extends DBrepository  {
    constructor (model)  { 
        super(model) ; 
    }
}  ;

export const DriverR = new DriverRepo(Driver) ; 