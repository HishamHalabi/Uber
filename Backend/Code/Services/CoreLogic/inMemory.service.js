import { json } from "sequelize";
import { redisClient } from "../../Config/redis.connection.js";
import { getCell } from "./H3.js";
import { LocationR } from "../../Models/Location/location.repository.js";
import { tripR } from "../../Models/Trip/trip.repository.js";

export async function add(key, value, ex) {
    return await redisClient.set(key, String(value), { EX: ex || 10000 });
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
    } else if (prefix == "available") {
        return data;
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
    const trip = await get(`available:${id}`);
    if (trip === null) {
        return false;
    }
    if (trip == "0") return true;
    return false;
}

export async function pickDriver(id, trip_id) {
    return await add(`available:${id}`, trip_id);
}

export async function releaseDriver(id) {
    return await add(`available:${id}`, "0");
}


export async function offline(id) {
    //TTL will handle all these staff 
    //User can cancel the trip ,  front can be aware that no updates hence some time window

    await Delete(`available:${id}`);
    const location = await get(`location:${id}`);
    console.log("location", location)
    if (!location) return; // FIX: Prevent crash if driver has no location
    const h3 = getCell(location.lat, location.lng, 9, 6);
    await deleteFromSet(h3, id);
    await Delete(`location:${id}`);

}



