import { sequelize  ,DataTypes } from "../../Config/db.connection.js";

export const Driver =  sequelize.define('Driver' , {
    ID  :  { 
        type :DataTypes.INTEGER  , 
        primaryKey: true,
         autoIncrement: true
    } , 
    name : {
        type : DataTypes.INTEGER  , 
        allowNull : false   
    } , 
    email :  { 
        type : DataTypes.STRING ,  
        allowNull : false  , 
        unique  : true    
        //validation done using joi
    },
    NationalId : { 
          type : DataTypes.STRING  , 
          allowNull : false
    }, 
    password : { 
          type : DataTypes.STRING ,  
          allowNull : false  
    },  
    carNo  :   { 
         type : DataTypes.STRING  , 
         allowNull   : false  
    } , cntTrips :  { 
          type : DataTypes.INTEGER , 
          defaultValue  :  0  
    } , rating  : { 
          type :DataTypes.FLOAT   , 
          defaultValue  : 5 
    }

}) ; 
