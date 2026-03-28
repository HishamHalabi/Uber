import { json, Op } from "sequelize";
import { redisClient } from "../../Config/redis.connection.js";
import { getCell } from "./H3.js";
import { LocationR } from "../../Models/Location/location.repository.js";
import { tripR } from "../../Models/Trip/trip.repository.js";


export async function add(key, value, options = {}) {  //ex is in seconds
    const NX = options.NX;
    let ex = options.ex;
    const [prefix, id] = key.split(":");
    if (prefix == "active" || prefix == "group") {
        ex = 24 * 60 * 60;
    } else if (prefix == "req" || prefix == "location") {
        ex = 10 * 60;
    } else if (prefix == "available") {
        ex = 7 * 60 * 60;
    } else if (prefix == "trip")  //we update each 60 s 
        ex = 3 * 60;
    return await redisClient.set(key, String(value), { EX: ex, NX });
}

export async function get(key) {
    const [prefix, id] = key.split(":");
    let data = await redisClient.get(key);
    if (data) {
        data = JSON.parse(data);
        return data;
    }
    else if (prefix == "location") {
        data = await LocationR.FindOne({ driver_id: id });
        return JSON.parse(JSON.stringify(data));
    } else if (prefix == "available") {
        data = await tripR.FindOne({
            [Op.and]: [
                { ID: id },
                { status: { [Op.ne]: "completed" } },
                { status: { [Op.ne]: "cancelled" } }
            ]
        });
        return JSON.parse(JSON.stringify(data));
    }
    return data;

}
export async function Delete(key) {
    return await redisClient.del(key);
}


//HashSet 
export async function addToSet(index, value) {
    return await redisClient.sAdd(`group:${index}`, String(value));
}

export async function deleteFromSet(index, value) {
    return await redisClient.sRem(`group:${index}`, String(value));
}

export async function getSet(index) {
    return await redisClient.sMembers(`group:${index}`);
}

export async function sizeOFSet(index) {
    return await redisClient.SCARD(`group:${index}`)
}

//Driver
export async function trip(id) {
    return await get(`available:${id}`);
}
export async function isAvalaible(id) {
    const active = await get(`active:${id}`);
    if (!active) return false;
    const trip = await get(`available:${id}`);
    if (trip) return false;
    return true;
}

export async function pickDriver(id, trip_id) {
    return await add(`available:${id}`, trip_id);
}

export async function releaseDriver(id) {
    return await Delete(`available:${id}`);
}


export async function offline(id) {
    const location = await get(`location:${id}`);
    if (!location) return;
    const h3 = getCell(location.lat, location.lng, 9, 6);
    await deleteFromSet(h3, id);
    await Delete(`location:${id}`);

}



