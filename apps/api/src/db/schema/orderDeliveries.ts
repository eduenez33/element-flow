import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const orderDeliveries = pgTable("order_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  emailSentTo: text("email_sent_to").notNull(),
  canvaLinkSent: text("canva_link_sent").notNull(),
  deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
});
