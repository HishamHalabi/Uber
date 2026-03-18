import { sequelize  ,DataTypes } from "../../Config/db.connection.js";

export const Rider =  sequelize.define('Rider' , {
     ID  :  { 
       type :DataTypes.INTEGER  , 
        primaryKey: true,
         autoIncrement: true 
    } , 
    name : {
        type : DataTypes.STRING  , 
        allowNull : false   
    } , 
    email :  { 
        type : DataTypes.STRING ,  
        allowNull : false  , 
        unique  : true    
        //validation done using joi
    }, 
    password : { 
          type : DataTypes.STRING ,  
          allowNull : false  
    },  
   cntTrips :  { 
          type : DataTypes.INTEGER , 
          defaultValue  :  0  
    },rating  : { 
          type :DataTypes.FLOAT   , 
          defaultValue  : 5 
    }

}) ; 
