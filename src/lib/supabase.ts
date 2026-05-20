import { createClient } from "@supabase/supabase-js";
import { config } from "../config";
import ws from "ws";

export const supabase = createClient(
  config.supabase.url || "https://placeholder.supabase.co",
  config.supabase.serviceRoleKey || "placeholder",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws as any,
    },
  }
);
