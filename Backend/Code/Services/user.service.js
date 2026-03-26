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
    //deleteDriver
    await driverR.Delete({ user_id: id });
    //delete locations 
    await LocationR.Delete({ driver_id: id });
    //delete feedbacks

    const trips = await tripR.Find({ [Op.or]: [{ user_id: id }, { driver_id: id }] });
    for (let trip of trips) {
        await FeedBackR.Delete({ trip_id: trip.ID });
    }
    await tripR.Delete({ [Op.or]: [{ user_id: id }, { driver_id: id }] });

    await userR.Delete({ ID: id })
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


//2 drivers only   [Update location]
async function updateGroups(lat, lng, id, stp) {
    for (let res = 9; res <= 9; res++) {
        let index = getCell(lat, lng, res);
        if (stp == 1) {
            await addToSet(index, id);
        } else await deleteFromSet(index, id);
    }
}

export async function updateDriverLocation(id, lat, lng) {
    const old = await get(`location:${id}`);
    if (old) {
        await updateGroups(old.lat, old.lng, id, -1);
    }
    await add(`location:${id}`, JSON.stringify({ lat, lng }));
    await updateGroups(lat, lng, id, 1);
    //console.log(await get(`location:${id}`));
    return { lat, lng };
}
