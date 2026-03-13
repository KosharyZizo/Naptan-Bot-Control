import { Router, type IRouter } from "express";
import healthRouter from "./health";
import robotRouter from "./robot";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/robot", robotRouter);

export default router;
