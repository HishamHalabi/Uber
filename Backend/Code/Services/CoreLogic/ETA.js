import { ETA } from "../ETA";

export async function calc(driver_id, lat1, lng1, lat2, lng2 , info = {}) {
    let  u =  {lat1 , lng1}  ,v = {lat2 ,lng2} ; 
    return await ETA(u  , v , {driver_id  :  driver_id , ...info} );

}
