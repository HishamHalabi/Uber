import { json } from "sequelize";
import { redisClient } from "../../Config/redis.connection.js";
import { getCell } from "./H3.js";
import { LocationR } from "../../Models/Location/location.repository.js";
import { tripR } from "../../Models/Trip/trip.repository.js";

export async function add(key, value, ex) {
    return await redisClient.set(key, value, { EX: ex || 3600 });
}

export async function get(key) {
    const [prefix, id] = key.split(":");
    const data = await redisClient.get(key);

    if (data) {
        data = JSON.parse(data);
        return data;
    }
    else if (prefix == "loaction") {
        data = await LocationR.FindOne({ driver_id: id });
    } else if (prefix == "available") {
        data = await tripR.FindOne({ driver_id: id });
        return data.trip_id;
    }
    return data;

}
export async function Delete(key) {
    return await redisClient.del(key);
}


//HashSet 
export async function addToSet(index, value) {
    return await redisClient.sAdd(`group:${index}`, value);
}

export async function deleteFromSet(index, value) {
    return await redisClient.sRem(`group:${index}`, value);
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
    const trip = await trip(id);
    if (trip === null) {
        return false;
    }
    return !trip;
}

export async function pickDriver(id, trip_id) {
    return await set(`available:${id}`, trip_id);
}

export async function releaseDriver(id) {
    return await set(`available:${id}`);
}


export async function offline(id) {
    await Delete(`available:${id}`);
    const location = await get(`location:${id}`);
    const h3 = getCell(location, 6);
    await deleteFromSet(h3, id);
    await Delete(`location:${id}`);

}



