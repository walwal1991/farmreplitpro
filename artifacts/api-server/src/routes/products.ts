import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  ListProductsResponse,
  GetProductParams,
  GetProductResponse,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/admin-auth";

const router: IRouter = Router();

router.get("/products", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.active, true))
    .orderBy(desc(productsTable.createdAt));
  res.json(ListProductsResponse.parse(rows));
});

// Must be before /products/:id to avoid param capture
router.get("/products/ratings", async (_req, res): Promise<void> => {
  const result = await db.execute(
    sql`SELECT product_id, COUNT(*)::int as count, ROUND(AVG(rating)::numeric, 1)::float as avg
        FROM product_reviews GROUP BY product_id`
  );
  res.json(result.rows);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(row));
});

router.post("/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(productsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      unit: parsed.data.unit,
      weightKg: parsed.data.weightKg,
      imageUrl: parsed.data.imageUrl,
      stock: parsed.data.stock,
      active: parsed.data.active ?? true,
      category: parsed.data.category ?? "solid",
    })
    .returning();
  res.status(201).json(GetProductResponse.parse(row));
});

router.patch(
  "/products/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = UpdateProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .update(productsTable)
      .set({
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        unit: parsed.data.unit,
        weightKg: parsed.data.weightKg,
        imageUrl: parsed.data.imageUrl,
        stock: parsed.data.stock,
        active: parsed.data.active ?? true,
        category: parsed.data.category ?? "solid",
      })
      .where(eq(productsTable.id, params.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(UpdateProductResponse.parse(row));
  },
);

router.delete(
  "/products/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const params = DeleteProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [row] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, params.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
