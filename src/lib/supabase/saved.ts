import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { twApply } from "./rpc";

const toggleSchema = z.object({
  packageId: z.string().min(1),
  on: z.boolean(),
});

export const syncSavedStay = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: unknown) => toggleSchema.parse(data))
  .handler(async ({ context, data }) => {
    const result = await twApply<{ on?: boolean }>("toggle_saved", {
      user_id: context.userId,
      package_id: data.packageId,
      on: data.on,
    });
    return { on: Boolean(result?.on) };
  });

export const listSavedStays = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const ids = await twApply<string[]>("list_saved", { user_id: context.userId });
    return Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
  });
