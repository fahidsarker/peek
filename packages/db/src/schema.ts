import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  showDocker: boolean("show_docker").default(false).notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const apps = pgTable("apps", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  iconUrl: text("icon_url").notNull(),
  publicUrl: text("public_url").notNull(),
  pingUrl: text("ping_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  lastPingAt: timestamp("last_ping_at"),
  lastPingStatus: text("last_ping_status").default("unknown").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedBy: text("updated_by").references(() => user.id, {
    onDelete: "set null",
  }),
});

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  allowSignups: boolean("allow_signups").default(true).notNull(),
  weatherProvider: text("weather_provider").default("open-meteo").notNull(),
  weatherLat: real("weather_lat"),
  weatherLon: real("weather_lon"),
  weatherCity: text("weather_city"),
  openWeatherApiKey: text("openweather_api_key"),
  weatherUseCurrentLocation: boolean("weather_use_current_location")
    .default(false)
    .notNull(),
  appsCompactView: boolean("apps_compact_view").default(true).notNull(),
  showSystemInfo: boolean("show_system_info").default(true).notNull(),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedBy: text("updated_by").references(() => user.id, {
    onDelete: "set null",
  }),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  appsCreated: many(apps, { relationName: "appCreatedBy" }),
  appsUpdated: many(apps, { relationName: "appUpdatedBy" }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const appsRelations = relations(apps, ({ one }) => ({
  createdByUser: one(user, {
    fields: [apps.createdBy],
    references: [user.id],
    relationName: "appCreatedBy",
  }),
  updatedByUser: one(user, {
    fields: [apps.updatedBy],
    references: [user.id],
    relationName: "appUpdatedBy",
  }),
}));
