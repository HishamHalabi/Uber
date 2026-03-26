import { sequelize, DataTypes } from "../../Config/db.connection.js";
import { Trip } from "../Trip/trip.model.js";
import { User } from "../User/user.model.js";

export const Payment = sequelize.define('Payment', {
    ID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    trip_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    payment_method: {
        type: DataTypes.ENUM("Online Card"),
        defaultValue: "Online Card"
    },
    status: {
        type: DataTypes.ENUM("pending", "success", "failed"),
        allowNull: false,
        defaultValue: "pending"
    },
    amt: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    order_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
});




Trip.hasOne(Payment, {
    foreignKey: 'trip_id',
});
Payment.belongsTo(Trip, {
    foreignKey: 'trip_id',  // explicitly match the column name

});

