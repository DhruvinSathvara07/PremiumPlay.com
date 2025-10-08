import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const mongoURI = `${process.env.MONGODB_URI}${DB_NAME}`;
        const connectionInstance = await mongoose.connect(mongoURI);

        console.log(`MongoDB Connected Successfully: ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

export default connectDB;
