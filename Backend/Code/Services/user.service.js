import { Op } from "sequelize";
import { Driver } from "../Models/Driver/driver.model.js";
import { driverR } from "../Models/Driver/driver.repository.js";
import { FeedBackR } from "../Models/FeedBack/FeedBack.repo.js";
import { LocationR } from "../Models/Location/location.repository.js";
import { tripR } from "../Models/Trip/trip.repository.js";
import { userR } from "../Models/User/user.reopsitory.js";
import { UnAuthorized } from "../Utils/error.utils.js";
import { findCandidates, getCell } from "./CoreLogic/H3.js";
import { add, addToSet, deleteFromSet, get } from "./CoreLogic/inMemory.service.js";
import { calc } from "./CoreLogic/ETA.js";
import { redisClient } from "../Config/redis.connection.js";


const LIMIT = 20;
/*
  1.all users 
  2.only drivers
  3.admin view of system
*/

//1 >>all users 
//for get profile  >> req.user ,  req.driver already added inside authentication

export async function getAllUsers() {
    return await userR.FindWithPop({}, Driver);
}

export async function updateProfilePic(id, path) {
    return await userR.Update({ ID: id }, { profilePic: path });
}

//must verify not updated uniquness or credtials fields
export async function updateData(id, body) {
    return await userR.Update({ ID: id }, body);
}

//very costive
export async function deleteUser(id) {
    const t = await sequelize.transaction();
    try {
        //deleteDriver
        await driverR.Delete({ user_id: id }, { transaction: t });
        //delete locations 
        await LocationR.Delete({ driver_id: id }, { transaction: t });
        //delete feedbacks

        const trips = await tripR.Find({ [Op.or]: [{ user_id: id }, { driver_id: id }] });
        for (let trip of trips) {
            await FeedBackR.Delete({ trip_id: trip.ID }, { transaction: t });
        }
        await tripR.Delete({ [Op.or]: [{ user_id: id }, { driver_id: id }] }, { transaction: t });

        await userR.Delete({ ID: id }, { transaction: t });
        await t.commit();
    } catch (err) {
        await t.rollback();
        throw new Error("failed to delete user");
    }
    return true;
}

export async function findDrivers(lat, lng, trials = 3) {
    trials = Math.min(trials, 5);
    while (trials--) {
        const candidates = await findCandidates(lat, lng, LIMIT);
        const ret = await Promise.all(
            candidates.map(async driver_id => {
                const location = await get(`location:${driver_id}`);
                if (!location) return null;
                const ETA = await calc(driver_id, lat, lng, location.lat, location.lng);
                return [driver_id, ETA];
            }).filter(r => r != null)
        );

        ret.sort((a, b) => {
            return a[1] - b[1];
        })
        if (ret.length) return ret;

    }
    return [];
}

//Lua script 
export async function updateDriverLocation(id, lat, lng) {
    console.log(lat, lng);
    const res = 9;
    const newCell = getCell(lat, lng, res);
    const locationKey = `location:${id}`;
    const newCellKey = `group:${newCell}`;
    await redisClient.eval(`
        local locationKey = KEYS[1]
        local newCellKey = KEYS[2]

        local lat = ARGV[1]
        local lng = ARGV[2]
        local driverId = ARGV[3]
        local newCellStr = ARGV[4]

        local oldLocation = redis.call("GET", locationKey)

        if oldLocation then
            local oldData = cjson.decode(oldLocation)
            if oldData.cell then
                
                redis.call("SREM", "group:" .. oldData.cell, driverId)
            end
        end

       
        redis.call("SET", locationKey, cjson.encode({ lat=lat, lng=lng, cell=newCellStr }))
        redis.call("SADD", newCellKey, driverId)

        return 1
    `,
        {
            keys: [locationKey, newCellKey],
            arguments: [String(lat),
            String(lng),
            String(id),
            String(newCell)]
        });

    return { lat, lng };
}
