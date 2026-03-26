import { Router } from "express"
import { getALLLocationsC, getUserLocationsC } from "../Controllers/Location.controller.js";


const LocationRouter = Router();
LocationRouter.get('/', getALLLocationsC);
LocationRouter.get('/userLocations', getUserLocationsC);

export { LocationRouter }; 