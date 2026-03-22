import { createClient } from "redis";

export const redisClient = createClient({
    url: process.env.redis_url
});

export async function InMemoryConnect() { 
       try {  
         await redisClient.connect();
         console.log('connected to redis')
       }catch(err)  {
           console.log("Error connecting to Redis" , err) ; 
       }
}