import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { user } from "@/db/schema";
import { getSettings, isSignupsAllowed } from "@/lib/settings";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      isAdmin: {
        type: "boolean",
        defaultValue: false,
        required: false,
      },
      showDocker: {
        type: "boolean",
        defaultValue: false,
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const allowed = await isSignupsAllowed();
          if (!allowed) {
            throw new APIError("FORBIDDEN", {
              message: "Signups are disabled",
            });
          }
        },
        after: async (createdUser) => {
          const [userCount] = await db.select({ count: count() }).from(user);
          if (userCount.count === 1) {
            await db
              .update(user)
              .set({ isAdmin: true, showDocker: true })
              .where(eq(user.id, createdUser.id));
          }
          await getSettings();
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
