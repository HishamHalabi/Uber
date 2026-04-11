import mongoose from "mongoose";

export const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/uber_clone_ml");
        console.log("MongoDB connected for Edge ML traffic data!");
    } catch (err) {
        console.error("MongoDB Connection Error: ", err);
    }
};

const edgeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, index: true },
    data: { type: Object, required: true }
});

export const EdgeModel = mongoose.model("Edge", edgeSchema);
