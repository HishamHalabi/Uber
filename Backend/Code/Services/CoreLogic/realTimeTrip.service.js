import { sequelize } from "../../Config/db.connection.js";
import { registPayment } from "../payment.srvice.js";
import { cancelAtrip, finishTrip, getTrip, getTripById, registTrip, updateTrip } from "../trip.service.js";
import { findDrivers, updateDriverLocation } from "../user.service.js";
import { add, Delete, get, isAvalaible, offline } from "./inMemory.service.js";
import { validateSocket, socketSchemas } from "../../Mildewares/validate.mildeware.js";
import { auth } from "../../Mildewares/authenticate.mildeware.js";

/*
  available:id >> trip_id
  active:id        >> we didnt make one key beacuase of network failures
  location:id >> location
  group:index >> dirver_id1 ,driver_id2 ,driver_id3

  //all these things are frequently updated so no need to fetch from DB if not exist
  //for disconnect  , connect >>
          //       update activity so no invalid assignments
          //for trip assigned we keep it and hence both frequnetly send updates of trip
          // so  when user problem solved and connect  he could cancel it or i as system cancel it as lng time go
*/



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
        await add(`active:${socket.user.ID}`, "1");
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
            try {
                const acquire = await add(`req:${req_id}`, "1", { NX: true });
                if (!acquire) {
                    
                    callback({ success: false  });
                    return;
                }
                
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
                            if (!await isAvalaible(socket.user.ID)) {
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
                console.log("here we back")
            } catch (err) {
                console.log(err.stack , "ssssssssssssssssssssssssssssssssss")
                callback({ success: false, err: err.stack });
            }
        }));



        socket.on("acceptRide", validateSocket(socketSchemas.acceptRide, async (user_id, lat, lng, t_lat, t_lng, ETA, req_id, callback) => {   //adriver emits this with user id 
            if (socket.user.role != "driver") {
                callback({ success: false });
                return;
            }


            let paymentKey, trip, trip_id, payment;
            try {
                const acquire = await add(`req:${req_id}`, "1", { NX: true });
                if (!acquire) {
                    callback({ success: false });
                    return;
                }

                //mutex lock >> escape of race conditions
                let acquired1, acquired2;
                acquired1 = await add(`available:${user_id}`, "1", { NX: true });
                if (!acquired1) {
                    callback({ success: false });
                    return;
                }
                acquired2 = await add(`available:${socket.user.ID}`, "1", { NX: true });
                if (!acquired2) {
                    callback({ success: false });
                    return;
                }

                ({ payment, trip, paymentKey } = await sequelize.transaction(async (t) => {
                    return await registTrip({
                        user_id, driver_id: socket.user.ID,
                        lat, lng, t_lat, t_lng, ETA, rem_ETA: ETA,
                        s_time: Date.now()
                    }, t);
                }));

                trip_id = trip.ID;
                await add(`available:${user_id}`, trip_id);
                await add(`available:${socket.user.ID}`, trip_id);
                socket.join(`trip:${trip_id}`);
            } catch (err) {
                await Delete(`available:${user_id}`);
                await Delete(`available:${socket.user.ID}`);
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

            try {
                const acquire = await add(`req:${req_id}`, "1", { NX: true });
                if (!acquire) {
                    callback({ success: false });
                    return;
                }
                const trip = await updateTrip(trip_id);
                if (trip.status == "finished") {
                    io.to(`trip:${trip_id}`).emit("finishTrip", trip, Date.now());
                    await finishTrip(trip);

                    //leave room   
                }
                callback({ success: true, trip, Date: Date.now() });
            } catch (err) {
                callback({ success: false, err: err.stack });
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
                const acquire = await add(`req:${req_id}`, "1", { NX: true });
                if (!acquire) {
                    callback({ success: false });
                    return;
                }

                const trip = await getTrip(trip_id, 1);
                const payment = await registPayment(trip_id, trip.ETA, trip.user);
                callback({ success: true, payment, Date: Date.now() });
            } catch (err) {
                callback({ success: false, err: err.stack });
            }
        }));


        socket.on("cancel", validateSocket(socketSchemas.cancel, async (trip_id, req_id, NeedRefund = 0, callback) => {
            try {
                const acquire = await add(`available:${req_id}`, "1", { NX: true });
                if (!acquire) {
                    callback({ success: false });
                    return;
                }
                await cancelAtrip(trip_id, (socket.user.role == "user"), 0, NeedRefund);
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