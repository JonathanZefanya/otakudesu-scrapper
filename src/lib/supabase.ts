import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseKey
	? createClient(supabaseUrl, supabaseKey)
	: null;

/** Cek apakah Supabase terkonfigurasi */
export function isSupabaseReady(): boolean {
	return supabase !== null;
}
