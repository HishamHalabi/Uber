import { json, Op } from "sequelize";
import { redisClient } from "../../Config/redis.connection.js";
import { getCell } from "./H3.js";
import { LocationR } from "../../Models/Location/location.repository.js";
import { tripR } from "../../Models/Trip/trip.repository.js";
<<<<<<< HEAD
=======
import { EdgeModel } from "../../Config/mongo.connection.js";
>>>>>>> f8d61a5 (ETA  + Graph + MapMatching)


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
<<<<<<< HEAD
=======
    else if (prefix == "edge_7" || prefix == "edge_9") {
        ex = 24 * 60 * 60;
    }

    if (prefix === "edge") {
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        // Block OSM graph startup reloads from overwriting your trained ML history
        if (parsed.cntReal === 1 && parsed.cntAvg === 1 && parsed.type !== "cross") {
            const existing = await EdgeModel.findOne({ id: id });
            if (existing) {
                await redisClient.set(key, JSON.stringify(existing.data), { EX: 24 * 60 * 60 });
                return;
            }
        }
        await EdgeModel.updateOne({ id: id }, { $set: { data: parsed } }, { upsert: true });
        value = typeof value === "string" ? value : JSON.stringify(value);
    }

>>>>>>> f8d61a5 (ETA  + Graph + MapMatching)
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
<<<<<<< HEAD
=======
    } else if (prefix == "edge") {
        const mongoEdge = await EdgeModel.findOne({ id: id });
        if (mongoEdge) {
            await redisClient.set(key, JSON.stringify(mongoEdge.data), { EX: 24 * 60 * 60 });
            return mongoEdge.data;
        }
    } else if (prefix == "edge_7" || prefix == "edge_9") { //edge:id , edge_7:index.edge_9:index
            
>>>>>>> f8d61a5 (ETA  + Graph + MapMatching)
    }
    return data;

}
export async function Delete(key) {
<<<<<<< HEAD
=======
    const [prefix, id] = key.split(":");
    if (prefix === "edge") {
        await EdgeModel.deleteOne({ id: id });
    }
>>>>>>> f8d61a5 (ETA  + Graph + MapMatching)
    return await redisClient.del(key);
}


//HashSet 
<<<<<<< HEAD
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
=======
export async function addToSet(index, value, prefix = "group") {
    return await redisClient.sAdd(`${prefix}:${index}`, String(value));
}

export async function deleteFromSet(index, value, prefix = "group") {
    return await redisClient.sRem(`${prefix}:${index}`, String(value));
}

export async function getSet(index, prefix = "group") {
    return await redisClient.sMembers(`${prefix}:${index}`);
}

export async function sizeOFSet(index, prefix = "group") {
    return await redisClient.SCARD(`${prefix}:${index}`);
>>>>>>> f8d61a5 (ETA  + Graph + MapMatching)
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



