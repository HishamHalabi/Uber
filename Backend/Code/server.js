import express from "express" ; 
import { ConnectTODB, sequelize } from "./Config/db.connection.js";
import { Driver } from "./Models/Driver/driver.model.js";
import { Location } from "./Models/Location/location.model.js";
import { Payment } from "./Models/Payment/payment.model.js";
import { Rider } from "./Models/Rider/rider.model.js";
import { Trip } from "./Models/Trip/trip.model.js";

const app =  express() ; 
ConnectTODB() ; 

//parsing Data
app.use(express.json()) ;


Trip
sequelize.sync({alter : true})



//err handlr 
app.use((err,req,res,next)=>{
      return res.status(err.cause || 500).json({success : false  ,  Message : err.message , err : err}) ; 
}) ; 

app.listen(process.env.PORT ,  ()=>{
      console.log("Server is listening at port 3000") ; 
});
