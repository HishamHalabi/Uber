import { Router } from "express"
import { getALLTripsC } from "../Controllers/Trip.controller.js";
import { getUserTrips } from "../Services/trip.service.js";

const TripRouter = Router();
TripRouter.get('/', getALLTripsC);
TripRouter.get('/userFeedbacks', getUserTrips);

export { TripRouter }; 