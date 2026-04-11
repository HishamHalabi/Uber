import { sequelize } from "../Config/db.connection.js";
import { User } from "../Models/User/user.model.js";
import { Driver } from "../Models/Driver/driver.model.js";
import { Trip } from "../Models/Trip/trip.model.js";
import { hash, encrypt } from "./crypto.utils.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

async function populate() {
    console.log("🚀 Initializing UberOps Demo Population...");
    
    const t = await sequelize.transaction();
    
    try {
        // 1. Clean up existing demo data (Optional: remove if you want to keep everything)
        // await User.destroy({ where: { email: ["rider@demo.com", "driver@demo.com"] }, transaction: t });

        const demoPassword = await hash("Demo1234");
        
        // 2. Create Demo Rider
        console.log("👤 Creating Demo Rider...");
        const rider = await User.create({
            name: "Hisham (Demo Rider)",
            email: "rider@demo.com",
            password: demoPassword,
            phoneNumber: encrypt("01000000001"),
            role: "rider",
            verified: true,
            rating: 4.8,
            cntTrips: 12
        }, { transaction: t });

        // 3. Create Demo Driver User
        console.log("🏎️ Creating Demo Driver User...");
        const driverUser = await User.create({
            name: "Captain Ahmed (Demo)",
            email: "driver@demo.com",
            password: demoPassword,
            phoneNumber: encrypt("01000000002"),
            role: "driver",
            verified: true,
            rating: 4.9,
            cntTrips: 450
        }, { transaction: t });

        // 4. Create Driver Profile
        console.log("🪪 Creating Driver Profile...");
        await Driver.create({
            user_id: driverUser.ID,
            NationalId: "29001011234567",
            carNo: "UBER-777-GOLD"
        }, { transaction: t });

        // 5. Create a "Featured" Finished Trip
        console.log("🎌 Creating Historical Demo Trip...");
        const startTime = new Date(Date.now() - 3600000); // 1 hour ago
        const endTime = new Date(Date.now() - 1800000);   // 30 mins ago
        
        await Trip.create({
            user_id: rider.ID,
            driver_id: driverUser.ID,
            lat: 30.0444, // Cairo Downtown
            lng: 31.2357,
            t_lat: 30.0131, // Maadi
            t_lng: 31.2089,
            s_time: startTime,
            e_time: endTime,
            ETA: 15.5,
            actualETA: 14.2,
            status: "finished",
            rem_ETA: 0
        }, { transaction: t });

        await t.commit();
        console.log("\n✅ Demo Population Successful!");
        console.log("-----------------------------------");
        console.log("Rider Email:  rider@demo.com");
        console.log("Driver Email: driver@demo.com");
        console.log("Password:     Demo1234");
        console.log("-----------------------------------");
        
    } catch (error) {
        await t.rollback();
        console.error("❌ Population Failed:", error.message);
    } finally {
        await sequelize.close();
    }
}

populate();
