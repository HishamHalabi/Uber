import { sequelize  ,DataTypes } from "../../Config/db.connection.js";

export const Trip =  sequelize.define('Trip' , {
    ID :  { 
        type :DataTypes.INTEGER  , 
        primaryKey: true,
         autoIncrement: true
    }, 
    user_id  :  { 
        type : DataTypes.INTEGER  , 
        allowNull : false 
    } , 
    driver_id : { 
         type : DataTypes.INTEGER  , 
         allowNull : false    
    }, 
    start_lat  : {
        type : DataTypes.FLOAT ,
        allowNull : false    
    } , 
    start_long  : { 
        type : DataTypes.FLOAT ,
        allowNull : false     
    },
    startTime   :  { 
        type : DataTypes.DATE ,
        allowNull : false     
    } ,  
    end_lat : {
        type : DataTypes.FLOAT ,
        allowNull : false  
     } , 
     end_lng : {
        type : DataTypes.FLOAT ,
        allowNull : false  
     } , 
     end_time  : { 
        type : DataTypes.DATE , 
        allowNull  : false 
     } ,estimated_fare :  { 
        type : DataTypes.FLOAT   , 
        allowNull  :false
      }  , actual_fare :  { 
         type  :DataTypes.FLOAT , 
         allowNull  : false 
      },status :  { 
          type :  DataTypes.ENUM(...["matched", "arrived" , "in progress" , "completed" , "cancelled"] ), 
          defaultValue  : "matched"
      }

}) ; 
