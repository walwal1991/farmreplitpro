import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import ordersRouter from "./orders";
import consultationsRouter from "./consultations";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import deliveryRouter from "./delivery";
import customerRouter from "./customer";
import reviewsRouter from "./reviews";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(consultationsRouter);
router.use(adminRouter);
router.use(uploadRouter);
router.use(deliveryRouter);
router.use(customerRouter);
router.use(reviewsRouter);
router.use(contactRouter);

export default router;
