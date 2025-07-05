import dotenv from "dotenv";
dotenv.config();
// import "/types/express"
import cookieParse from "cookie-parser"
import express, { Request, Response } from "express"
import authRouter from "./routes/auth.route";
import { connectDB } from "./lib/db";
import cors from 'cors'
import privateRouter from "./routes/private.route";

const PORT = process.env.PORT;
const app = express();


app.use(cors({
    origin: "http://localhost:4000",
    credentials: true
}));

app.use(express.json());
app.use(cookieParse());


app.get('/', (req: Request, res: Response) => {
    res.send("Hello world");
})
app.use('/auth', authRouter)
app.use('/api/v1',privateRouter)

app.listen(PORT, () => {
    console.log("Listening to port :", PORT);
    connectDB();
})