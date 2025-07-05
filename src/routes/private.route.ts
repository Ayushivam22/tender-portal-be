import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { dashboard } from "../controllers/dashboard.controller";
import { registerCompany } from "../controllers/registerCompany.controller";
import { getAllTenders, applyForTender, cancelTenderApplication, createTender, updateTender, deleteTender, getTender, getMyTenders } from "../controllers/tenders.controller";

const privateRouter = Router();

privateRouter.get('/dashboard', auth, dashboard)
// privateRouter.post('/register-company',auth,registerCompany)
privateRouter.post('/register', auth, registerCompany)
privateRouter.get('/tenders', auth, getAllTenders)
privateRouter.post('/tenders/:tenderId/apply', auth, applyForTender)
privateRouter.delete('/tenders/:tenderId/cancel', auth, cancelTenderApplication)
privateRouter.post('/tenders', auth, createTender)
privateRouter.put('/tenders/:tenderId', auth, updateTender)
privateRouter.delete('/tenders/:tenderId', auth, deleteTender)
privateRouter.get('/tenders/:tenderId', auth, getTender)
privateRouter.get('/tenders/my', auth, getMyTenders)

export default privateRouter;