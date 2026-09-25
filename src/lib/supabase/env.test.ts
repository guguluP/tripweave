import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SUPABASE_ANON_KEY, SUPABASE_PROJECT_URL } from "./project.ts";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseServiceRoleKey,
  supabaseUrl,
} from "./env.ts";

describe("supabase env", () => {
  it("defaults to the TripWeave project URL and public anon key", () => {
    const prevUrl = process.env.SUPABASE_URL;
    const prevVite = process.env.VITE_SUPABASE_URL;
    const prevDisabled = process.env.SUPABASE_DISABLED;
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_DISABLED;
    try {
      assert.equal(supabaseUrl(), SUPABASE_PROJECT_URL);
      assert.equal(supabaseAnonKey(), SUPABASE_ANON_KEY);
      assert.equal(isSupabaseConfigured(), true);
    } finally {
      if (prevUrl !== undefined) process.env.SUPABASE_URL = prevUrl;
      if (prevVite !== undefined) process.env.VITE_SUPABASE_URL = prevVite;
      if (prevDisabled !== undefined) process.env.SUPABASE_DISABLED = prevDisabled;
    }
  });

  it("has no service role unless env provides one", () => {
    const keys = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SECRET_KEYS"] as const;
    const prev: Record<string, string | undefined> = {};
    for (const k of keys) {
      prev[k] = process.env[k];
      delete process.env[k];
    }
    try {
      assert.equal(supabaseServiceRoleKey(), "");
      assert.equal(isSupabaseAdminConfigured(), false);
    } finally {
      for (const k of keys) {
        if (prev[k] !== undefined) process.env[k] = prev[k];
      }
    }
  });

  it("rejects sb_secret_ keys as admin (legacy JWT only)", () => {
    const prev = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
    try {
      assert.equal(isSupabaseConfigured(), true);
      assert.equal(supabaseServiceRoleKey(), "");
      assert.equal(isSupabaseAdminConfigured(), false);
    } finally {
      if (prev === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prev;
    }
  });

  it("treats a legacy service_role JWT as admin-ready", () => {
    const prev = process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.test";
    try {
      assert.equal(isSupabaseConfigured(), true);
      assert.ok(supabaseServiceRoleKey().startsWith("eyJ"));
      assert.equal(isSupabaseAdminConfigured(), true);
    } finally {
      if (prev === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = prev;
    }
  });
});
