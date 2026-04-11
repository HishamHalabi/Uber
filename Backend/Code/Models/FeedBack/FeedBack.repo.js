import { DBrepository } from "../../Config/db.repository.js"
import { FeedBack } from "./FeedBack.model.js";


class FeedBackRebp extends DBrepository  {
    constructor (model)  { 
        super(model) ; 
    }
}  ;

export const FeedBackR = new FeedBackRebp(FeedBack) ; 