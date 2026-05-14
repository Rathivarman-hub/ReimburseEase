import mongoose from "mongoose";
import dns from 'dns'

const db = async () => {
    try {
        dns.setServers(["1.1.1.1"])
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log('MongoDB error:', error);
        process.exit(1);
    }
}
export default db
