import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { vaultedProducts } from "./vaultedProducts";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "verified",
  "delivered",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => vaultedProducts.id, { onDelete: "cascade" }),
  customerEmail: text("customer_email").notNull(),
  transactionCode: text("transaction_code").notNull().unique(),
  status: orderStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
});
