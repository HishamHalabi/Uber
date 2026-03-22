import { sequelize  ,DataTypes } from "../../Config/db.connection.js";
import { Driver } from "../Driver/driver.model.js";

export const Location =  sequelize.define('Location' , {
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

Driver.hasMany(Location, {
  foreignKey: 'driver_id',
});
Location.belongsTo(Driver);
