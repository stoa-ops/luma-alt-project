import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const magicLinks = pgTable("magic_links", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    coverUrl: text("cover_url"),
    venue: text("venue").notNull().default(""),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: bigint("capacity", { mode: "number" }).notNull().default(0),
    visibility: text("visibility").$type<"public" | "unlisted">().notNull().default("public"),
    status: text("status").$type<"draft" | "published" | "cancelled">().notNull().default("draft"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugUnique: uniqueIndex("events_slug_unique").on(t.slug),
    statusIdx: index("events_status_idx").on(t.status),
    capacityCheck: check("events_capacity_check", sql`${t.capacity} >= 0`),
    dateRangeCheck: check("events_date_range_check", sql`${t.endsAt} > ${t.startsAt}`),
    visibilityCheck: check(
      "events_visibility_check",
      sql`${t.visibility} in ('public', 'unlisted')`
    ),
    statusCheck: check(
      "events_status_check",
      sql`${t.status} in ('draft', 'published', 'cancelled')`
    ),
  })
);

export const ticketTypes = pgTable(
  "ticket_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceCents: bigint("price_cents", { mode: "number" }).notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    quantity: bigint("quantity", { mode: "number" }).notNull().default(0),
    salesStart: timestamp("sales_start", { withTimezone: true }),
    salesEnd: timestamp("sales_end", { withTimezone: true }),
    position: bigint("position", { mode: "number" }).notNull().default(0),
  },
  (t) => ({
    eventIdx: index("ticket_types_event_idx").on(t.eventId),
    priceCheck: check("ticket_types_price_check", sql`${t.priceCents} >= 0`),
    quantityCheck: check("ticket_types_quantity_check", sql`${t.quantity} >= 0`),
    salesRangeCheck: check(
      "ticket_types_sales_range_check",
      sql`${t.salesEnd} is null or ${t.salesStart} is null or ${t.salesEnd} > ${t.salesStart}`
    ),
  })
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    status: text("status")
      .$type<"pending" | "paid" | "refunded" | "failed" | "cancelled">()
      .notNull()
      .default("pending"),
    provider: text("provider"),
    providerChargeId: text("provider_charge_id"),
    subtotalCents: bigint("subtotal_cents", { mode: "number" }).notNull().default(0),
    feeCents: bigint("fee_cents", { mode: "number" }).notNull().default(0),
    totalCents: bigint("total_cents", { mode: "number" }).notNull().default(0),
    buyerEmail: text("buyer_email").notNull(),
    buyerName: text("buyer_name").notNull().default(""),
    promoCodeId: uuid("promo_code_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    eventIdx: index("orders_event_idx").on(t.eventId),
    chargeIdx: index("orders_charge_idx").on(t.providerChargeId),
    buyerIdx: index("orders_buyer_idx").on(t.buyerEmail),
    statusCheck: check(
      "orders_status_check",
      sql`${t.status} in ('pending', 'paid', 'refunded', 'failed', 'cancelled')`
    ),
    subtotalCheck: check("orders_subtotal_check", sql`${t.subtotalCents} >= 0`),
    feeCheck: check("orders_fee_check", sql`${t.feeCents} >= 0`),
    totalCheck: check("orders_total_check", sql`${t.totalCents} >= 0`),
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    ticketTypeId: uuid("ticket_type_id")
      .notNull()
      .references(() => ticketTypes.id),
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    unitPriceCents: bigint("unit_price_cents", { mode: "number" }).notNull(),
  },
  (t) => ({
    quantityCheck: check("order_items_quantity_check", sql`${t.quantity} > 0`),
    unitPriceCheck: check(
      "order_items_unit_price_check",
      sql`${t.unitPriceCents} >= 0`
    ),
  })
);

export const attendees = pgTable(
  "attendees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    ticketTypeId: uuid("ticket_type_id").references(() => ticketTypes.id),
    name: text("name").notNull().default(""),
    email: text("email").notNull(),
    qrToken: text("qr_token").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  },
  (t) => ({
    qrUnique: uniqueIndex("attendees_qr_unique").on(t.qrToken),
    emailIdx: index("attendees_email_idx").on(t.email),
  })
);

export const promoCodes = pgTable(
  "promo_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    discountPct: bigint("discount_pct", { mode: "number" }).notNull(),
    maxUses: bigint("max_uses", { mode: "number" }).notNull().default(0),
    usedCount: bigint("used_count", { mode: "number" }).notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => ({
    eventCodeUnique: uniqueIndex("promo_codes_event_code_unique").on(
      t.eventId,
      t.code
    ),
    discountCheck: check(
      "promo_codes_discount_check",
      sql`${t.discountPct} between 0 and 100`
    ),
    maxUsesCheck: check("promo_codes_max_uses_check", sql`${t.maxUses} >= 0`),
    usedCountCheck: check("promo_codes_used_count_check", sql`${t.usedCount} >= 0`),
  })
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attendeeId: uuid("attendee_id")
      .notNull()
      .references(() => attendees.id, { onDelete: "cascade" }),
    scannedBy: uuid("scanned_by").references(() => users.id),
    scannedAt: timestamp("scanned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    location: text("location"),
  },
  (t) => ({
    attendeeUnique: uniqueIndex("check_ins_attendee_unique").on(t.attendeeId),
  })
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    payload: text("payload").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("webhook_events_uniq").on(t.provider, t.externalId),
  })
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type TicketType = typeof ticketTypes.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Attendee = typeof attendees.$inferSelect;
export type User = typeof users.$inferSelect;
