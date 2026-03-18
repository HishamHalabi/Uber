import { sequelize  ,DataTypes } from "../../Config/db.connection.js";

export const Location =  sequelize.define('FeedBack' , {
    ID:{ 
         type :DataTypes.INTEGER  , 
        primaryKey: true,
         autoIncrement: true
    }, 
    driver_id  :  { 
        type : DataTypes.INTEGER  , 
        allowNull : false 
    },
    latiude :  { 
          type:DataTypes.FLOAT  , 
          allowNull :false 
    } ,  longtiude :   { 
         type:DataTypes.FLOAT  , 
         allowNull :false 
    },geoHash  : {
         type:DataTypes.STRING  , 
         allowNull :false 
    } ,time :  { 
        type : DataTypes.DATE  , 
    }
}) ; 