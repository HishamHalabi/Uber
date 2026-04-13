import { json, Op } from "sequelize";
import { redisClient } from "../../Config/redis.connection.js";
import { getCell } from "./H3.js";
import { LocationR } from "../../Models/Location/location.repository.js";
import { tripR } from "../../Models/Trip/trip.repository.js";
import { EdgeModel } from "../../Config/mongo.connection.js";
import { reload } from "../ETA/Main/loadUpdatedGraph.js";

/*
 edge  {
   id >> index
   cell_7 :  index
   cell_9 :  index
   starEdges  :h3Index || null  >>    index
   borderEdges :    //   >> index
 }
*/
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
    } else if (prefix == "edge") {
        const mongoEdge = await EdgeModel.findOne({ id: id });
        if (mongoEdge) {
            await redisClient.set(key, JSON.stringify(mongoEdge.data), { EX: 24 * 60 * 60 });
            return mongoEdge.data;
        }
    }
    return data;

}

//for ETA >> if comp drops reload it from DB
export async function getSet(index, prefix = "group") {
    let cr = await redisClient.sMembers(`${prefix}:${index}`);
    if (cr) return cr ; 

    if (prefix == "borderNodes") {
          let edges  =  await getSet(index , "borderEdges") ; 
          edges =await Promise.all( edges.map((edgeId)=>  get("edge:edgeId")) )
          edges =  edges.map((edge)>=edge.u) 
          return edges ; 
    }

    if (prefix =="group"){
         //dont need to fetch DB , as i see locations are updated frequently
    }
    else {   
          cr = await EdgeModel.find({ prefix: index });
          cr = cr.map(edge => edge.id);
          await redisClient.set(`${prefix}:${index}`, JSON.stringify(cr), { EX: 24 * 60 * 60 });
          if (!cr) return null ; 
          return await getSet(index, prefix);
    }
    return cr;
}
export async function sizeOFSet(index, prefix = "group") {
    return await redisClient.SCARD(`${prefix}:${index}`);
}


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
  
    if (prefix === "edge") {  //adding it on some Cat will be done in add to Set
        const parsed = typeof value === "string" ? JSON.parse(value) : value;
        const cnt_updates =  Number (await get(`cnt_updates:${id}`) || 0);
        if (cnt_updates%100  < 2) {
                 await EdgeModel.updateOne({ id: id }, { $set:parsed }, { upsert: true });
        }
    }

    value = typeof value === "string" ? value : JSON.stringify(value);
    return await redisClient.set(key, String(value), { EX: ex, NX });
}

//HashSet n
export async function addToSet(index, value, prefix = "group") {
    if (prefix != "group"  && prefix != "borderNodes") { 
            await EdgeModel.updateOne({id : value}  ,  {$set  :  {prefix  : index}}) ;
    }
    return await redisClient.sAdd(`${prefix}:${index}`, String(value));
}

export async function Delete(key) {
    const [prefix, id] = key.split(":");
    if (prefix === "edge") {
        await EdgeModel.deleteOne({ id: id });
    }
    return await redisClient.del(key);
}

export async function deleteFromSet(index, value, prefix = "group") {
    if (prefix != "group"  && prefix != "borderNodes") { 
            await EdgeModel.updateOne({id : value}  ,  {$set  :  {prefix  : null}}) ;
    }
    return await redisClient.sRem(`${prefix}:${index}`, String(value));
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



