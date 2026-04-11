import { FeedBackR } from "../Models/FeedBack/FeedBack.repo.js";
import { Trip } from "../Models/Trip/trip.model.js";
import { getTripById } from "./trip.service.js";
import { updateData } from "./user.service.js";
import { tripR } from "../Models/Trip/trip.repository.js";
import { FeedBack } from "../Models/FeedBack/FeedBack.model.js";



//admin only as it's very costive
export async function getAllFeedbacks() {
    return await FeedBackR.Find({});
}

export async function getFeedback(trip_id) {
    return await FeedBackR.FindOneWithPop({ trip_id }, Trip);
}

export async function getUserFeedbacks(id) {
    const trips = await tripR.FindWithPop({
        [Op.or]: [
            { user_id: id },
            { driver_id: id }
        ]
    }, FeedBack);

    const feedBacks = [];
    for (let trip of trips) {
        feedBacks.push(trip.FeedBack);
    }
    return feedBacks;
}

//user rating for driver  , d ...
export async function createFeedBack(trip_id, uContent, dContent, uRating, dRating) {
    try {
        let gt = await getFeedback(trip_id);
        console.log("gt   ", trip_id);
        if (!gt)
            gt = await FeedBackR.Create({ trip_id, uContent, dContent, uRating, dRating });
        else {
            const data = {};
            if (dRating) data.dRating = dRating
            if (uRating) data.uRating = uRating
            await FeedBackR.Update({ trip_id }, data);
        }
        return gt;
    } catch (err) {
        console.log(err.stack)
    }
}

export async function addFeedback(body) {
    const { trip_id, uContent, uRating, dContent, dRating } = body;
    await createFeedBack(trip_id, uContent, dContent, uRating, dRating);

    let Nrating = uRating || dRating;
    const trip = await getTripById(trip_id, 1);


    let { rating, cntTrips } = trip;
    rating = (rating * cntTrips + Nrating) / (cntTrips + 1);
    cntTrips++;
    await updateData({ ID: trip.user_id }, { rating, cntTrips });
}
// Nrating