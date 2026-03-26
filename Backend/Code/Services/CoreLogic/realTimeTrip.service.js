import { sequelize } from "../../Config/db.connection.js";
import { registPayment } from "../payment.srvice.js";
import { cancelAtrip, finishTrip, getTrip, getTripById, registTrip, updateTrip } from "../trip.service.js";
import { findDrivers, updateDriverLocation } from "../user.service.js";
import { add, get, isAvalaible, offline } from "./inMemory.service.js";
import { validateSocket, socketSchemas } from "../../Mildewares/validate.mildeware.js";
import { auth } from "../../Mildewares/authenticate.mildeware.js";

export async function addlogic(io) {
    io.use(async (socket, next) => {
        try {
            const { user, payload } = await auth(socket.handshake.auth);
            socket.user = user;
            console.log("sss");
            next();
        } catch (err) {
            console.log("ss");
            next(new Error("Authentication error"));
        }
    });
    io.on("connection", async (socket) => {
        socket.join(`user:${socket.user.ID}`);
        await add(`available:${socket.user.ID}`, "0");
        const trip = await getTripById(socket.user.ID);
        if (trip) {
            socket.join(`trip:${trip.ID}`);
        }

        io.on("notfication", async (msg) => {
            io.emit("display-notifications", msg);
        });

        socket.on("assign", (roomId) => {
            socket.join(roomId);
        });

        socket.on("findADriver", validateSocket(socketSchemas.findADriver, async (lat, lng, tr_lat, tr_lng,
            repeat, req_id, callback) => {
            if (await get(`req:${req_id}`)) {
                return;
            }
            await add(`req:${req_id}`, "{}");
            try {
                const drivers = await findDrivers(lat, lng, repeat);
                function find(idx) {
                    if (idx == drivers.length) {
                        callback("no available drivers");
                        return;
                    }

                    let success = 0;
                    const [driver_id, ETA] = drivers[idx];

                    try {
                        setTimeout(async () => {
                            if (await isAvalaible(driver_id)) {
                                return;
                            } else {
                                io.to(`user:${driver_id}`).emit("deleteRide", socket.user.ID);
                                find(idx + 1);
                            }
                        }, 10000);
                    } catch (err) {
                        find(idx + 1);
                    }

                    io.to(`user:${driver_id}`).emit("rideAlert", {
                        user_id: socket.user.ID,
                        lat, lng,
                        t_lat: tr_lat,
                        t_lng: tr_lng,
                        ETA
                    }, (s) => {
                        success = s;
                    });
                }

                find(0);
            } catch (err) {
                callback({ success: false, err: err.stack });
            }
        }));

        socket.on("acceptRide", validateSocket(socketSchemas.acceptRide, async (user_id, lat, lng, t_lat, t_lng, ETA, req_id, callback) => {   //adriver emits this with user id 
            if (socket.user.role != "driver" || await get(`req:${req_id}`) || !await isAvalaible(user_id)) {

                console.log(user_id, socket.user.role, await get(`req:${req_id}`), await get(`available:${user_id}`));
                callback({ success: false, err: err.stack });
                return;
            }

            await add(`req:${req_id}`, "{}");
            let paymentKey, trip, trip_id, payment;
            try {
                await add(`available:${user_id}`, "1");
                await add(`available:${socket.user.ID}`, "1");
                const t = await sequelize.transaction();
                ({ payment, trip, paymentKey } = await sequelize.transaction(async (t) => {
                    return await registTrip({
                        user_id, driver_id: socket.user.ID,
                        lat, lng, t_lat, t_lng, ETA, rem_ETA: ETA,
                        s_time: Date.now()
                    }, t);
                }))
                console.log(trip, trip.ID);
                trip_id = trip.ID;
                //availabilty of users
                await add(`available:${user_id}`, trip_id);
                await add(`available:${socket.user.ID}`, trip_id);
                //user_trip :   , driver_trip 
                socket.join(`trip:${trip_id}`);
            } catch (err) {
                await add(`available:${user_id}`, "0");
                await add(`available:${socket.user.ID}`, "0");
                callback({ success: false, err: err.stack });
                return;
            }
            callback({ success: true });
            console.log(trip_id)
            io.to(`user:${user_id}`).emit("assign", `trip:${trip_id}`, paymentKey, Date.now());
            io.to(`trip:${trip_id}`).emit("startRide", trip, paymentKey, Date.now());  //FrontEnd      
        }));

        socket.on("update-location", validateSocket(socketSchemas.updateLocation, async (locations = [], trip_id, callback) => {
            try {

                if (socket.user.role != "driver" || locations.length == 0) return;
                for (const { lat, lng } of locations) {

                    console.log(lat, lng);
                    await updateDriverLocation(socket.user.ID, lat, lng);
                }
                let idx = locations.length - 1;
                callback({ success: true });
                if (trip_id) {
                    io.to(`trip:${trip_id}`).emit("updateLocationDisplay", locations[idx].lat, locations[idx].lng, Date.now());
                }
            } catch (err) {
                console.log(err)
                callback({ success: false, err: err.stack });
            }
        }));

        //each 60s
        socket.on("update-trip-status", validateSocket(socketSchemas.updateTripStatus, async (trip_id, req_id, callback) => {
            if (await get(`req:${req_id}`)) {
                return;
            }
            await add(`req:${req_id}`, "{}");
            try {
                const trip = await updateTrip(trip_id);
                if (trip.status == "finished") {
                    io.to(`trip:${trip_id}`).emit("finishTrip", trip, Date.now());
                    await finishTrip(trip);

                    //leave room   
                }
                callback({ success: true, trip, Date: Date.now() });
            } catch (err) {
                callback({ success: false, err: err.stack || "An unknown error occurred" });
            }
        }));

        //handeling  network fails
        socket.on("get-payment", validateSocket(socketSchemas.getPayment, async (trip_id, callback) => {
            try {
                const payment = await findPayment({ trip_id });
                callback({ success: true, payment, time: Date.now() });
            }
            catch (err) {
                callback({ success: false, err });
            }
        }));

        socket.on("get-trip", async (callback) => {
            try {
                const trip = await getTripById(socket.user.ID);
                callback({ success: true, trip, Date: Date.now() });
            }
            catch (err) {
                callback({ success: false, err: err.stack });
            }
        });
        socket.on("retry_payment", validateSocket(socketSchemas.retryPayment, async (trip_id, req_id, callback) => {
            try {
                if (await get(`req:${req_id}`)) {
                    return;
                }
                await add(`req:${req_id}`, "{}");
                const trip = await getTrip(trip_id, 1);
                const payment = await registPayment(trip_id, trip.ETA, trip.user, Date.now());
                callback({ success: true, payment, Date: Date.now() });
            } catch (err) {
                callback({ success: false, err: err.stack });
            }
        }));


        socket.on("cancel", validateSocket(socketSchemas.cancel, async (trip_id, req_id, callback) => {
            try {
                if (await get(`req:${req_id}`)) {
                    return;
                }
                await add(`req:${req_id}`, "{ok:1}");
                await cancelAtrip(trip_id, (socket.user.role == "user"));
                callback({ success: true });
                io.to(`trip:${trip_id}`).emit("cancel_trip", Date.now());
            } catch (err) {
                callback({ success: false, err: err.stack })
            }
        }));

        socket.on("disconnect", async () => {
            await offline(socket.user.ID);
        });
    });
}