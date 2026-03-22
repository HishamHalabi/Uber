import express from "express" ; 
import { ConnectTODB, sequelize } from "./Config/db.connection.js";
import { InMemoryConnect } from "./Config/redis.connection.js";
import { AuthRouter } from "./Routes/Auth.routes.js";
import { userRouter } from "./Routes/user.routes.js";


const app =  express() ; 
await ConnectTODB() ; 
await InMemoryConnect() ; 


app.use(express.json()) ;
app.use("/auth" ,    AuthRouter)
app.use("/user" ,    userRouter)


//err handlr 
app.use((err,req,res,next)=>{
      return res.status(err.cause || 500).json({success : false  ,  Message : err.message , err : err.stack}) ; 
}) ; 

// sequelize.sync({alter : true})
// User.sync({alter    : true})
app.listen(3000 ,  ()=>{
      console.log("Server is listening at port 3000") ; 
});
