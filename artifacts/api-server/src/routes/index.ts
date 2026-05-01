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
import enrollmentsRouter from "./enrollments";
import wasteCollectionsRouter from "./waste-collections";
import donorsRouter from "./donors";
import sensorsRouter from "./sensors";
import rewardsRouter from "./rewards";

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
router.use(enrollmentsRouter);
router.use(wasteCollectionsRouter);
router.use(donorsRouter);
router.use(sensorsRouter);
router.use(rewardsRouter);

export default router;
