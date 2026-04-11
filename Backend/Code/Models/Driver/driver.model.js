import { sequelize  ,DataTypes } from "../../Config/db.connection.js";

export const Driver =  sequelize.define('Driver' , {
    user_id :  {
        type :DataTypes.INTEGER  , 
        primaryKey: true,
        autoIncrement: true 
    } , 
    NationalId : { 
          type : DataTypes.STRING  , 
          allowNull : false
    },  
    carNo  : { 
         type : DataTypes.STRING  , 
         allowNull   : false  
    } 
}) ; 
