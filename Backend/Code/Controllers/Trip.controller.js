
import { getAllTrips, getUserTrips } from "../Services/trip.service.js";
import { UnAuthorized } from "../Utils/error.utils.js";

export async function getALLTripsC(req, res, next) {
    if (req.user.role != "admin") {
        throw new UnAuthorized("not authorized to see all Trips");
    }
    const Trips = await getAllTrips();
    return res.status(200).json({ Message: "success", data: Trips });
}

export async function getUserFeedbacksC(req, res, next) {
    const Trips = await getUserTrips(req.user.id);
    return res.status(200).json({ Message: "success", data: Trips });
}

//other things happens with io real time 