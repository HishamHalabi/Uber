import { Op } from "sequelize";
import { LocationR } from "../Models/Location/location.repository.js";

export async function getAllLocations() {
    return await LocationR.FindWithPop({}, Driver);
}

export async function getUserLocations(id) {
    return await LocationR.FindWithPop({
        [Op.or]: [
            { user_id: id },
            { driver_id: id }
        ]
    }, Driver);
}

export async function recordLocation(data) {
    return await LocationR.Create(data);
}