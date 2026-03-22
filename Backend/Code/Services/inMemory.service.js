import { redisClient } from "../Config/redis.connection.js";

export async function add(key ,value  , ex) {
    return  await redisClient.set(key,value, { EX: ex || 3600 } );
}

export async function get(key ) {
    return  await redisClient.get(key) ; 
}

export async function Delete(key) {
    return  await redisClient.del(key); 
}