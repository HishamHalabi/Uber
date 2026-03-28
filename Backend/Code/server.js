import express from "express";
import { ConnectTODB, sequelize } from "./Config/db.connection.js";
import { InMemoryConnect } from "./Config/redis.connection.js";
import { AuthRouter } from "./Routes/Auth.routes.js";
import { userRouter } from "./Routes/user.routes.js";
import { Server } from "socket.io"
import { findPayment, updatePayment } from "./Services/payment.srvice.js";
import { FeedBackRouter } from "./Routes/FeedBack.router.js";
import { authenticate } from "./Mildewares/authenticate.mildeware.js";
import { TripRouter } from "./Routes/Trip.routes.js";
import { LocationRouter } from "./Routes/location.routes.js";
import { PaymentRouter } from "./Routes/payment.routes.js";
import rateLimit from "express-rate-limit";
import http from "http";
import cors from "cors"
import helmet from "helmet"
import { addlogic } from "./Services/CoreLogic/realTimeTrip.service.js";
import { get } from "./Services/CoreLogic/inMemory.service.js";
import { Trip } from "./Models/Trip/trip.model.js";
import { Payment } from "./Models/Payment/payment.model.js";
import { Location } from "./Models/Location/location.model.js";
const mxRepeats = 3;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
      cors: {
            origin: "*",
            methods: ["GET", "POST", "PATCH"
            ]
      }
});





await ConnectTODB();
await InMemoryConnect();
await addlogic(io);

const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
            status: 429,
            error: 'Too many requests, please try again later.'
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});


// sequelize.sync({alter :true}) ; 
app.use(express.json());
app.use((req, res, next) => {
      console.log("req.body1", req.body);
      next();
})
app.use(cors());
app.use(limiter);
app.use(helmet());
app.use("/auth", AuthRouter)
app.use("/user", userRouter)
app.use("/feedbacks", authenticate(), FeedBackRouter);
app.use("/trips", authenticate(), TripRouter);
app.use("/locations", authenticate(), LocationRouter);
app.use("/payments", authenticate(), PaymentRouter)


app.post("/paymob/webhook", async (req, res) => {
      const payment = req.body;
      if (payment.obj.success) {
            await updatePayment({ order_id: payment.obj.order_id }, { status: "success" });
            const updated_payment = await findPayment({ order_id: payment.obj.order_id });
            io.to(`trip:${updated_payment.trip_id}`).emit('update-payment-display', payment);
      }
      res.sendStatus(200);
});


// sequelize.sync({ alter: true })
//err handlr 
app.use((err, req, res, next) => {
      const status = err.status || (err.cause ? (typeof err.cause == "object" ? err.cause.status : 500) : 500);
      return res.status(status).json({ success: false, Message: err.message, err: err.stack });
});



server.listen(3000, () => {
      console.log("Server is listening at port 3000");
});

