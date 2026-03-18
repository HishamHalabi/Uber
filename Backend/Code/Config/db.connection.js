import  {Sequelize , DataTypes} from "sequelize"

const sequelize = new Sequelize("Uber" ,"root"   , "" , {
    dialect  : "mysql"  , 
    host : "localhost"  
}
) ; 




 async function ConnectTODB(){ 
    sequelize.authenticate().then(()=>{
         console.log("Successfuly Connected To DB") ; 
    }).catch((err)=>{
        throw new Error("error connecting to DB") ; 
    })
}


export   {ConnectTODB ,  sequelize  , DataTypes} ; 
