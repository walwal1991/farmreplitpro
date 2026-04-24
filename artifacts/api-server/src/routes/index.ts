import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import ordersRouter from "./orders";
import consultationsRouter from "./consultations";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import deliveryRouter from "./delivery";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(consultationsRouter);
router.use(adminRouter);
router.use(uploadRouter);
router.use(deliveryRouter);

export default router;
