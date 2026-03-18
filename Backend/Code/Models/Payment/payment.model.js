import { sequelize  ,DataTypes } from "../../Config/db.connection.js";

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
