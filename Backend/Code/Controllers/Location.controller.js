import { getAllLocations, getUserLocations } from "../Services/location.service.js";
import { UnAuthorized } from "../Utils/error.utils.js";

export async function getALLLocationsC(req, res, next) {
    if (req.user.role != "admin") {
        throw new UnAuthorized("not authorized to see all Locations");
    }
    const Locations = await getAllLocations();
    return res.status(200).JSON({ Message: "success", data: Locations });
}

export async function getUserLocationsC(req, res, next) {
    const Locations = await getUserLocations(req.user.id);
    return res.status(200).JSON({ Message: "success", data: Locations });
}

//other things happens with io real time 