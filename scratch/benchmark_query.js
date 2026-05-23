import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.time("query_total");
  
  console.time("query_with_count");
  const { data: d1, error: e1 } = await supabase
    .from("jobs")
    .select("id, title, city, state, contract_type, modality, salary_min, salary_max, requirements, banner_url, created_at, companies(company_name, logo_url, username), applications(count)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  console.timeEnd("query_with_count");

  console.time("query_without_count");
  const { data: d2, error: e2 } = await supabase
    .from("jobs")
    .select("id, title, city, state, contract_type, modality, salary_min, salary_max, requirements, banner_url, created_at, companies(company_name, logo_url, username)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  console.timeEnd("query_without_count");

  console.log(`With count: ${d1?.length || 0} items. Error: ${e1 ? e1.message : 'none'}`);
  console.log(`Without count: ${d2?.length || 0} items. Error: ${e2 ? e2.message : 'none'}`);
  
  console.timeEnd("query_total");
}

test();
