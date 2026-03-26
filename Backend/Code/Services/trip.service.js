import { json, Op, Transaction } from "sequelize";
import { tripR } from "../Models/Trip/trip.repository.js";
import { logoutAll } from "./Auth.service.js";
import { calc } from "./CoreLogic/ETA.js";
import { add, Delete, get } from "./CoreLogic/inMemory.service.js";
import { registPayment } from "./payment.srvice.js";
import { PaymentR } from "../Models/Payment/payment.repository.js";
import { makePayment } from "./paymob.service.js";
import { userR } from "../Models/User/user.reopsitory.js";
import { User } from "../Models/User/user.model.js";
import { FeedBack } from "../Models/FeedBack/FeedBack.model.js";
import { driverR } from "../Models/Driver/driver.repository.js";
import { latLngToCell } from "h3-js";
import { recordLocation } from "./location.service.js";
import { LocationR } from "../Models/Location/location.repository.js";



const EPS = 60, mxCancelD = 10, mxCancelU = 10, cst = 1, uberFees = 1, cancelCost = 1;

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
    const user = await userR.FindOne({ ID: user_id });
    await add(`trip:${trip.ID}`, JSON.stringify(trip));
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
            { user_id: id },
            { driver_id: id }
        ]
    });
}

export async function finishTrip(data) {
    await add(`trip:${data.trip_id}`, "");
    await add(`available:${data.user_id}`, "0");
    await add(`available:${data.driver_id}`, "0");
}

//["stated"  ,"arrived"   , "inProgress" , "finished"]
export async function updateTrip(trip_id) {
    const data = await getTrip(trip_id);
    const location = await get(`location:${data.driver_id}`);

    if (!location) {

        return data;
    }

    console.log(trip_id)
    await recordLocation({ lat: location.lat, lng: location.lng, geoHash: latLngToCell(location.lat, location.lng), time: Date.now(), driver_id: data.driver_id });

    if (data.status == "matched" || data.status == "started") {
        const time_to_getUser = await calc(location.lat, location.lng, data.t_lat, data.t_lng);
        if (time_to_getUser <= EPS) {
            data.status = "arrived";
        } else {
            data.status = "started";
            data.time_to_getUser = time_to_getUser;
            data.rem_ETA = time_to_getUser;
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

    location.driver_id = data.driver_id;
    await LocationR.Create(location);
    await tripR.Update({ ID: trip_id }, data);
    await add(`trip:${trip_id}`, JSON.stringify(data));
    return data;
}

export async function cancelAtrip(id, isDriver = 0) {
    const data = await get(`trip:${id}`);
    const start = data.s_time;

    if ((Date.now() - start) <= (isDriver ? mxCancelD : mxCancelU)) {
        await tripR.Update({ status: "cancelled" });
        await PaymentR.Update({ trip_id: id }, { amt: cancelCost, status: "cancelled" });
        await finishTrip(data);
    }
    return data;
}

