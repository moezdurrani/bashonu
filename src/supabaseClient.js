import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eneqhbulikympveiebqu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZXFoYnVsaWt5bXB2ZWllYnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTExMzEsImV4cCI6MjA4MTA2NzEzMX0.RkNNcDCw6tk8spq0nW_I8t9X0kCdfDm36CnfjQNpcnM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);