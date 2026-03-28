
import { sequelize  ,DataTypes } from "../../Config/db.connection.js";
import { Driver } from "../Driver/driver.model.js";

export const User =  sequelize.define('User' , {
     ID  :  { 
       type :DataTypes.INTEGER  , 
        primaryKey: true,
         autoIncrement: true 
    } ,
    role :  { 
         type : DataTypes.ENUM("rider"  , "driver") ,  
         defaultValue :  "rider"  
    }  , 
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
    phoneNumber : {
          type : DataTypes.STRING ,  
          allowNull : false  
    }  , 
   cntTrips :  { 
          type : DataTypes.INTEGER , 
          defaultValue  :  0  
    },rating  : { 
          type :DataTypes.FLOAT   , 
          defaultValue  : 5 
    },credentialsUpdatedAt : { 
          type : DataTypes.DATE  , 
          defaultValue :DataTypes.NOW 
    },verified :  { 
        type : DataTypes.BOOLEAN , 
        defaultValue : false 
    },profilePic:{
         type:DataTypes.STRING , 
        }
}) ; 
// User.hasOne(Driver, {
//   foreignKey: {
//     name: 'user_id',
//   },
// });
// Driver.belongsTo(User  ,  {foreignKey :  {
//     name : "user_id"
// }});

