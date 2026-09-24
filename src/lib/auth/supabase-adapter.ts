/**
 * Better Auth tables on the TripWeave Supabase project.
 * Used on Vercel so password-reset tokens survive the next request.
 * Does not use DATABASE_URL.
 */
import { createAdapterFactory, type CleanedWhere, type JoinConfig } from "better-auth/adapters";
import { memoryAdapter } from "better-auth/adapters/memory";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../supabase/server";

const TABLES: Record<string, string> = {
  user: "ba_user",
  session: "ba_session",
  account: "ba_account",
  verification: "ba_verification",
};

function tableFor(model: string): string {
  const name = TABLES[model];
  if (!name) throw new Error(`Unknown auth model: ${model}`);
  return name;
}

function client(): SupabaseClient {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase service role is not configured.");
  return sb;
}

function compare(row: Record<string, unknown>, clause: CleanedWhere): boolean {
  const left = row[clause.field];
  const right = clause.value;
  const text = (value: unknown) => (value == null ? "" : String(value));
  const fold = clause.mode === "insensitive";
  const a = fold ? text(left).toLowerCase() : left;
  const b = fold ? text(right).toLowerCase() : right;
  switch (clause.operator) {
    case "eq":
      return a === b;
    case "ne":
      return a !== b;
    case "lt":
      return text(left) < text(right);
    case "lte":
      return text(left) <= text(right);
    case "gt":
      return text(left) > text(right);
    case "gte":
      return text(left) >= text(right);
    case "in":
      return Array.isArray(right) && right.map((item) => (fold ? text(item).toLowerCase() : item)).includes(a as never);
    case "not_in":
      return Array.isArray(right) && !right.map((item) => (fold ? text(item).toLowerCase() : item)).includes(a as never);
    case "contains":
      return text(a).includes(text(b));
    case "starts_with":
      return text(a).startsWith(text(b));
    case "ends_with":
      return text(a).endsWith(text(b));
    default:
      return false;
  }
}

export function matchesWhere(row: Record<string, unknown>, where?: CleanedWhere[]): boolean {
  if (!where?.length) return true;
  let ok = true;
  let orOk = false;
  let sawOr = false;
  for (const clause of where) {
    const hit = compare(row, clause);
    if (clause.connector === "OR") {
      sawOr = true;
      orOk = orOk || hit;
    } else if (!hit) {
      ok = false;
    }
  }
  return ok && (!sawOr || orOk);
}

async function load(model: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await client().from(tableFor(model)).select("*");
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

async function attachJoins(
  model: string,
  rows: Record<string, unknown>[],
  join?: JoinConfig,
): Promise<Record<string, unknown>[]> {
  if (!join) return rows;
  const attached = rows.map((row) => ({ ...row }));
  for (const [related, config] of Object.entries(join)) {
    const others = await load(related);
    for (const row of attached) {
      const hits = others.filter((other) => other[config.on.to] === row[config.on.from]);
      const limited = hits.slice(0, config.limit ?? 100);
      const one = config.relation === "one-to-one" || related === "user";
      row[related] = one ? (limited[0] ?? null) : limited;
    }
  }
  return attached;
}

function missingTable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /ba_|schema cache|Could not find the table|relation .* does not exist/i.test(msg);
}

export const supabaseAuthAdapter = () =>
  createAdapterFactory({
    config: {
      adapterId: "tripweave-supabase",
      adapterName: "TripWeave Supabase",
      supportsJSON: false,
      supportsDates: false,
      supportsBooleans: true,
      supportsArrays: false,
    },
    adapter: (ctx) => {
      const memory = memoryAdapter()(ctx.options);
      let memoryOnly = false;
      const run = async <T>(op: keyof typeof memory, args: unknown): Promise<T> => {
        if (memoryOnly) return (memory[op] as (value: unknown) => Promise<T>)(args);
        try {
          return await (supabaseOps[op] as (value: unknown) => Promise<T>)(args);
        } catch (err) {
          if (!missingTable(err)) throw err;
          memoryOnly = true;
          console.error("[auth] Supabase ba_* tables are missing. Apply supabase/auth_identity.sql. Password reset cannot be stored until then.");
          return (memory[op] as (value: unknown) => Promise<T>)(args);
        }
      };
      const supabaseOps = {
      async create({ model, data }) {
        const { data: created, error } = await client()
          .from(tableFor(model))
          .insert(data)
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        return created as Record<string, unknown>;
      },
      async findOne({ model, where, join }) {
        const rows = (await attachJoins(model, await load(model), join)).filter((row) =>
          matchesWhere(row, where),
        );
        return (rows[0] as Record<string, unknown> | undefined) ?? null;
      },
      async findMany({ model, where, limit, sortBy, offset, join }) {
        let rows = (await attachJoins(model, await load(model), join)).filter((row) =>
          matchesWhere(row, where),
        );
        if (sortBy) {
          const dir = sortBy.direction === "desc" ? -1 : 1;
          rows.sort((a, b) => {
            const av = a[sortBy.field];
            const bv = b[sortBy.field];
            if (av === bv) return 0;
            return av! > bv! ? dir : -dir;
          });
        }
        const start = offset ?? 0;
        return rows.slice(start, start + limit);
      },
      async count({ model, where }) {
        const rows = (await load(model)).filter((row) => matchesWhere(row, where));
        return rows.length;
      },
      async update({ model, where, update }) {
        const rows = (await load(model)).filter((row) => matchesWhere(row, where));
        const current = rows[0];
        if (!current?.id) return null;
        const { data, error } = await client()
          .from(tableFor(model))
          .update(update)
          .eq("id", current.id as string)
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        return data as Record<string, unknown>;
      },
      async updateMany({ model, where, update }) {
        const rows = (await load(model)).filter((row) => matchesWhere(row, where));
        let changed = 0;
        for (const row of rows) {
          if (!row.id) continue;
          const { error } = await client()
            .from(tableFor(model))
            .update(update)
            .eq("id", row.id as string);
          if (error) throw new Error(error.message);
          changed += 1;
        }
        return changed;
      },
      async delete({ model, where }) {
        const rows = (await load(model)).filter((row) => matchesWhere(row, where));
        const id = rows.find((row) => typeof row.id === "string")?.id;
        if (typeof id !== "string") return;
        const { error } = await client().from(tableFor(model)).delete().eq("id", id);
        if (error) throw new Error(error.message);
      },
      async deleteMany({ model, where }) {
        const rows = (await load(model)).filter((row) => matchesWhere(row, where));
        const ids = rows.map((row) => row.id).filter((id): id is string => typeof id === "string");
        if (!ids.length) return 0;
        const { error } = await client().from(tableFor(model)).delete().in("id", ids);
        if (error) throw new Error(error.message);
        return ids.length;
      },
      async consumeOne({ model, where }) {
        const rows = (await load(model)).filter((row) => matchesWhere(row, where));
        const current = rows[0];
        if (!current?.id) return null;
        const { data, error } = await client()
          .from(tableFor(model))
          .delete()
          .eq("id", current.id as string)
          .select("*");
        if (error) throw new Error(error.message);
        return (data?.[0] as Record<string, unknown> | undefined) ?? null;
      },
      } as Record<string, (value: unknown) => Promise<unknown>>;
      return {
        create: (args) => run("create", args),
        findOne: (args) => run("findOne", args),
        findMany: (args) => run("findMany", args),
        count: (args) => run("count", args),
        update: (args) => run("update", args),
        updateMany: (args) => run("updateMany", args),
        delete: (args) => run("delete", args),
        deleteMany: (args) => run("deleteMany", args),
        consumeOne: (args) => run("consumeOne", args),
      };
    },
  });
