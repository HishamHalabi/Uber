import express from "express";
import { ConnectTODB, sequelize } from "./Config/db.connection.js";
import { InMemoryConnect } from "./Config/redis.connection.js";
import { AuthRouter } from "./Routes/Auth.routes.js";
import { userRouter } from "./Routes/user.routes.js";
import { Server, Socket } from "socket.io"
import { findCandidates } from "./Services/CoreLogic/H3.js";
import { cancelAtrip, finishTrip, getTrip, getTripById, registTrip, updateTrip } from "./Services/trip.service.js";
import { findPayment, registPayment, updatePayment } from "./Services/payment.srvice.js";
import { findDrivers, updateDriverLocation } from "./Services/user.service.js";
import { add, Delete, get, isAvalaible, offline } from "./Services/CoreLogic/inMemory.service.js";
import { calc } from "./Services/CoreLogic/ETA.js";
import { func } from "joi";

const mxRepeats = 3;
const app = express();

const io = new Server();
io.use((socket, next) => {
      socket.user = 1;
      next();
});



io.on("connection", async (socket) => {
      socket.join(`user:${socket.user.ID}`);
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

      socket.on("findADriver", async (lat, lng, tr_lat, tr_lng, repeat = mxRepeats, callback) => {
            const drivers = await findDrivers(lat, lng, repeat);
            function find(idx) {
                  if (idx == drivers.length) {
                        callback("no available drivers");
                        return;
                  }

                  let success = 0;
                  const [driver_id, ETA] = drivers[idx];
                  setTimeout(async () => {
                        if (await isAvalaible(driver_id)) {
                              return;
                        } else {
                              io.to(`user:${driver_id}`).emit("deleteRide", socket.user.ID);
                              find(idx + 1);
                        }
                  }, 10000);

                  io.to(`user:${driver_id}`).emit("requestForRide", socket.user.ID, lat, lng, tr_lat, tr_lng, ETA, (s) => {
                        success = s;
                  });
            }

            find(0);
      });

      socket.on("acceptRide", async (user_id, lat, lng, tr_lat, tr_lng, ETA, req_id, callback) => {   //adriver emits this with user id 
            if (socket.user.role != "driver" || await get(`req:${req_id}`) || !await isAvalaible(`available:${user_id}`)) {
                  callback({ success: false });
                  return;
            }

            await add(`req:${req_id}`, "1");
            let paymentKey, trip, payment;
            try {
                  await add(`available:${user_id}`, "1");
                  await add(`available:${socket.user.ID}`, "1");
                  ({ payment, trip, paymentKey } = await sequelize.transaction(async (t) => {
                        return await registTrip({
                              user_id, driver_id: socket.user.ID,
                              lat, lng, tr_lat, tr_lng, ETA, rem_ETA: ETA
                        }, t);
                  }))
            } catch (err) {
                  await add(`available:${user_id}`, "");
                  await add(`available:${socket.user.ID}`, "");
                  callback({ success: false });
                  return;
            }

            const trip_id = trip.ID;
            //availabilty of users
            await add(`available:${user_id}`, trip_id);
            await add(`available:${socket.user.ID}`, trip_id);
            //user_trip :   , driver_trip 
            socket.join(`trip:${trip_id}`);

            callback({ success: true });
            io.to(`user:${user_id}`).emit("assign", `trip:${trip_id}`, paymentKey, Date.now());
            io.to(`trip:${trip_id}`).emit("startRide", trip, paymentKey, Date.now());  //FrontEnd      
      });


      socket.on("update-location", async (locations = [], trip_id, callback) => {
            if (socket.user.role != "driver" || locations.length == 0) return;
            for (const { lat, lng } of locations) {
                  await updateDriverLocation(socket.user.ID, lat, lng);
            }
            let idx = locations.length - 1;
            callback({ success: true });
            io.to(`trip:${trip_id}`).emit("updateLocationDisplay", locations[idx].lat, locations[idx].lng, Date.now());
      });


      socket.on("cancel", async (trip_id, req_id, callback) => {
            if (await get(`req:${req_id}`)) {
                  return;
            }
            await add(`req:${req_id}`, "{ok:1}");
            await cancelAtrip(trip_id, (socket.user.role == "user"));
            callback({ success: true });
            io.to(`trip:${trip_id}`).emit("cancel_trip", Date.now());
      });

      socket.on("update-trip-status", async (trip_id, callback) => {
            const trip = await updateTrip(trip_id);
            if (trip.status == "finished") {
                  io.to(`trip:${trip_id}`).emit("finishTrip", trip, Date.now());
                  await finishTrip(trip);

                  //leave room   
            }
            callback({ success: true, trip, Date: Date.now() });
      });

      //handeling  network fails
      socket.on("get-payment", async (trip_id, callback) => {
            const payment = await findPayment({ trip_id });
            callback({ success: true, payment, time: Date.now() });
      });

      socket.on("get-trip", async (callback) => {
            const trip = await getTripById(socket.user.ID);
            callback({ success: true, trip, Date: Date.now() });
      });
      socket.on("retry_payment", async (trip_id, req_id, callback) => {
            if (await get(`req:${req_id}`)) {
                  return;
            }
            await add(`req:${req_id}`, "1");
            const trip = await getTrip(trip_id, 1);
            const payment = await registPayment(trip_id, trip.ETA, trip.user, Date.now());
            callback({ success: true, payment, Date: Date.now() });
      });

      socket.on("disconnect", async () => {
            await offline(socket.user.ID);
      })
});

app.post("/paymob/webhook", async (req, res) => {
      const payment = req.body;
      if (payment.obj.success) {
            await updatePayment({ order_id: payment.obj.order_id }, { status: "success" });
            const updated_payment = await findPayment({ order_id: payment.obj.order_id });
            io.to(`trip:${updated_payment.trip_id}`).emit('update-payment-display', payment);
      }
      res.sendStatus(200);
});

await ConnectTODB();
await InMemoryConnect();


app.use(express.json());
app.use("/auth", AuthRouter)
app.use("/user", userRouter)


//err handlr 
app.use((err, req, res, next) => {
      return res.status(err.cause || 500).json({ success: false, Message: err.message, err: err.stack });
});


app.listen(3000, () => {
      console.log("Server is listening at port 3000");
});
