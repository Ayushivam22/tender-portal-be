import { Client } from 'pg'
const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized:false
    }
});
const connectDB = async () => {
    try {
        await pgClient.connect();
        console.log("Database connection successful");
    } catch (error) {
        console.error("Database connection failed:", error);
    }
};

export { pgClient, connectDB };