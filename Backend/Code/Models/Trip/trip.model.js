
import { sequelize, DataTypes } from "../../Config/db.connection.js";
import { Driver } from "../Driver/driver.model.js";
import { User } from "../User/user.model.js";

export const Trip = sequelize.define('Trip', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  driver_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  s_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  t_lat: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  t_lng: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  e_time: {
    type: DataTypes.DATE
  }, ETA: {
    type: DataTypes.FLOAT,
    allowNull: false
  }, actualETA: {
    type: DataTypes.FLOAT
  }, status: {
    type: DataTypes.ENUM(...["matched", "arrived", "in progress", "finished", "cancelled"]),
    defaultValue: "matched"
  }, rem_ETA: {
    type: DataTypes.FLOAT
  }

});

Driver.hasMany(Trip, {
  foreignKey: 'driver_id',
});
Trip.belongsTo(Driver);


User.hasMany(Trip, {
  foreignKey: 'user_id',
});

Trip.belongsTo(User, {
  foreignKey: 'user_id',  // explicitly match the column name
});