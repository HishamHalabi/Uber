import { sequelize  ,DataTypes } from "../../Config/db.connection.js";

export const FeedBack =  sequelize.define('FeedBack' , {
    ID :  { 
        type : DataTypes.STRING  , 
        allowNull : false 
    }, 
    trip_id  :  { 
        type : DataTypes.STRING  , 
        allowNull : false 
    },
   content :  { 
        type : DataTypes.TEXT , 
        allowNull :  false 
   }
}) ; 