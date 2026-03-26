import { sequelize, DataTypes } from "../../Config/db.connection.js";
import { Driver } from "../Driver/driver.model.js";
import { Trip } from "../Trip/trip.model.js";

export const FeedBack = sequelize.define('FeedBack', {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true

  },
  trip_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uContent: {
    type: DataTypes.TEXT,
    // allowNull: false
  }, dContent: {
    type: DataTypes.TEXT,
    // allowNull: false
  },
  uRating: {
    type: DataTypes.FLOAT

  }, dRating: {
    type: DataTypes.FLOAT

  }
});


Trip.hasOne(FeedBack, {
  foreignKey: 'trip_id',
});
FeedBack.belongsTo(Trip, {
  foreignKey: 'trip_id',  // explicitly match the column name

});