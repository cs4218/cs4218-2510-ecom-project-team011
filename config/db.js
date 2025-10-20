import mongoose from "mongoose";
import colors from "colors";
const connectDB = async () => {
    try {
        if (process.env.NODE_ENV === 'test') {
            const conn = await mongoose.connect(process.env.MONGO_URL, { dbName: 'test_0' });
            console.log(`Connected To Test Database: test_0 on ${conn.connection.host}`.bgMagenta.white);
        } else {
            const conn = await mongoose.connect(process.env.MONGO_URL);
            console.log(`Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white);
        }
    } catch (error) {
        console.log(`Error in Mongodb ${error}`.bgRed.white);
    }
};

export default connectDB;