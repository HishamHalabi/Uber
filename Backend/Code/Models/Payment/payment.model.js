import { sequelize  ,DataTypes } from "../../Config/db.connection.js";
import { Trip } from "../Trip/trip.model.js";
import { User } from "../User/user.model.js";

export const Payment =  sequelize.define('Payment' , {
    ID :  { 
         type :DataTypes.INTEGER  , 
        primaryKey: true,
         autoIncrement: true
    }, 
    trip_id  :  { 
        type : DataTypes.INTEGER  , 
        allowNull : false 
    },
    payment_method :  { 
        type : DataTypes.ENUM("vodafoneCache" , "fawry")  , 
        allowNull : false 
    },
    status :  { 
         type : DataTypes.ENUM("pending"  , "completed"   , "failed")  , 
         allowNull : false  , 
         defaultValue :"pending" 
    } , 
    amt :  { 
        type : DataTypes.FLOAT   , 
        allowNull : false   
    }  ,  
    uberFees :  { 
        type : DataTypes.FLOAT   , 
        allowNull : false   
    }
}) ; 




Trip.hasOne(Payment, {
  foreignKey: 'trip_id',
});
Payment.belongsTo(Trip ,  {
  foreignKey: 'trip_id',  // explicitly match the column name

});

