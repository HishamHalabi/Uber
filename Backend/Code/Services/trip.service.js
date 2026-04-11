import { json, Op, Transaction } from "sequelize";
import { tripR } from "../Models/Trip/trip.repository.js";
import { logoutAll } from "./Auth.service.js";
import { calc } from "./CoreLogic/ETA.js";
import { add, Delete, get } from "./CoreLogic/inMemory.service.js";
import { registPayment } from "./payment.srvice.js";
import { PaymentR } from "../Models/Payment/payment.repository.js";
import { makePayment, refundPayment } from "./paymob.service.js";
import { userR } from "../Models/User/user.reopsitory.js";
import { User } from "../Models/User/user.model.js";
import { FeedBack } from "../Models/FeedBack/FeedBack.model.js";
import { driverR } from "../Models/Driver/driver.repository.js";
import { latLngToCell } from "h3-js";
import { recordLocation } from "./location.service.js";
import { LocationR } from "../Models/Location/location.repository.js";
import { sequelize } from "../Config/db.connection.js";
import { BadRequest } from "../Utils/error.utils.js";


const EPS = Math.floor(process.env.EPS), MX = Math.floor(process.env.MX), cancelCostperUnit = Math.floor(process.env.CANCEL_COST_PER_UNIT);
function difTime(start, end) {
    return Math.floor((end - start) / 1000);
}



export async function getAllTrips() {
    return await tripR.FindWithPop({}, FeedBack);
}

export async function getUserTrips(id) {
    return await tripR.FindWithPop({
        [Op.or]: [
            { user_id: id },
            { driver_id: id }
        ]
    }, FeedBack);
}


export async function registTrip(data, t) {
    const { user_id, driver_id, lat, lng, t_lat, t_lng } = data;
    console.log(t)
    const ETA = await calc(driver_id, lat, lng, t_lat, t_lng);
    const trip = await tripR.Create({
        user_id, driver_id, lat, lng, t_lat, t_lng,
        s_time: Date.now(), status: "matched", ETA
    }, { transaction: t });

    await add(`trip:${trip.ID}`, JSON.stringify(trip));
    const user = await userR.FindOne({ ID: user_id });
    const { payment, paymentKey } = await registPayment(trip.ID, ETA, user, t)
    return { trip, payment, paymentKey };
}


export async function getTrip(trip_id, lookUp = 0) {
    let data;
    if (!lookUp) data = await tripR.FindOne({ ID: trip_id });
    else data = await tripR.FindOneWithPop({ ID: trip_id }, User);
    return data;
}

export async function getTripById(id, lookUp = 0) {
    return await tripR.FindOne({
        [Op.or]: [
            { ID: id },
            { user_id: id },
            { driver_id: id }
        ]
    });
}

export async function finishTrip(data) {
    await Delete(`trip:${data.ID}`);
    await Delete(`available:${data.user_id}`);
    await Delete(`available:${data.driver_id}`);
}

//["stated"  ,"arrived"   , "inProgress" , "finished" ,  "failed" ,  "cancelled"]
export async function updateTrip(trip_id) {
    console.log("updating      ", trip_id);
    let data = await getTrip(trip_id);
    const location = await get(`location:${data.driver_id}`);
    if (!location) {
        return data;
    }

    await recordLocation({ lat: location.lat, lng: location.lng, geoHash: latLngToCell(location.lat, location.lng), time: Date.now(), driver_id: data.driver_id });

    if (data.status == "matched") {
        const time_to_getUser = await calc(location.lat, location.lng, data.t_lat, data.t_lng);
        if (time_to_getUser <= EPS) {
            data.status = "arrived";
        } else {
            data.time_to_getUser = time_to_getUser;
            data.rem_ETA = time_to_getUser;
            if (difTime(data.s_time, Date.now()) > time_to_getUser * MX) {
                const ret = await cancelAtrip(trip_id, 0, 1, 1);
                return ret;
            }
        }



    } else if (data.status == "arrived") {
        data.status = "inProgress";
    } else if (data.status == "inProgress") {
        const ETA = await calc(location.lat, location.lng, data.t_lat, data.t_lng);
        data.rem_ETA = ETA;
        if (ETA <= EPS) {
            data.status = "finished";
        }
    }


    data = JSON.parse(JSON.stringify(data));
    location.driver_id = data.driver_id;
    await LocationR.Create(location);
    await tripR.Update({ ID: trip_id }, JSON.parse(JSON.stringify(data)));
    await add(`trip:${trip_id}`, JSON.stringify(data));
    await finishTrip(data);
    return data;
}

// export async function reFund(payment)   { 

// }

export async function cancelAtrip(id, isDriver = 0, failure = 0, NeedRefund = 0) {
    const data = await get(`trip:${id}`);
    const payment = await PaymentR.FindOne({ trip_id: id });

    if (!data || !payment || (payment.status != "success" && NeedRefund))
        throw new BadRequest("invalid data");;


    const start = data.s_time;

    let dis;
    if (failure)
        dis = 0;
    else if (data.status == "matched") {
        data.status = failure ? "failed" : "cancelled";
        dis = Math.min(cancelCostperUnit * difTime(start, Date.now()), payment.amt);
    }
    else {
        throw new BadRequest("can't cancel trip");
    }




    if (NeedRefund) await refundPayment(payment.transiction_id, payment.amt - dis);

    const t = await sequelize.transaction();
    try {
        await tripR.Update({ ID: id }, data, { transaction: t });
        await PaymentR.Update({ trip_id: id }, { amt: dis, status: "success" }, { transaction: t });
        await t.commit();
    } catch (err) {
        await t.rollback();
        throw new Error("failed to update trip")
    }
    await finishTrip(data);


    return data;
}

//handling empty payment
//alte rpayment