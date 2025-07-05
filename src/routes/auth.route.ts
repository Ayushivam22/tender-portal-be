import { Router } from "express";
import { signin, signout, signup } from "../controllers/auth.controller";
import { auth } from "../middlewares/auth.middleware";
import { dashboard } from "../controllers/dashboard.controller";
const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/signin', signin);
authRouter.post('/signout', signout);

// protected routes
authRouter.get('/api/v1/dashboard', auth, dashboard)

export default authRouter