import { sequelize  ,DataTypes } from "../../Config/db.connection.js";
import { Driver } from "../Driver/driver.model.js";
import { Trip } from "../Trip/trip.model.js";

export const FeedBack =  sequelize.define('FeedBack' , {
    ID :  { 
        type : DataTypes.INTEGER  ,
        primaryKey : true , 
        autoIncrement : true   
        
    }, 
    trip_id  :  { 
        type : DataTypes.INTEGER  , 
        allowNull : false 
    },
    content :  { 
        type : DataTypes.TEXT , 
        allowNull :  false 
   }
}) ; 


Trip.hasOne(FeedBack, {
  foreignKey: 'trip_id',
});
FeedBack.belongsTo(Trip ,  {
  foreignKey: 'trip_id',  // explicitly match the column name

});