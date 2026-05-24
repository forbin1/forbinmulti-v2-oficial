const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

let env = {};
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (let line of lines) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        env[key] = value;
      }
    }
  }
} catch (e) {
  console.error("Error reading .env", e);
}

const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL || "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("=== ISOLATING LATENCY ===");

  console.time("jobs_id_title_only");
  const { data: j1, error: je1 } = await supabase
    .from("jobs")
    .select("id, title")
    .limit(1);
  console.timeEnd("jobs_id_title_only");

  console.time("companies_id_name_only");
  const { data: c1, error: ce1 } = await supabase
    .from("companies")
    .select("id, company_name")
    .limit(1);
  console.timeEnd("companies_id_name_only");

  console.time("jobs_all_columns");
  const { data: j2, error: je2 } = await supabase
    .from("jobs")
    .select("*")
    .limit(1);
  console.timeEnd("jobs_all_columns");

  console.time("companies_all_columns");
  const { data: c2, error: ce2 } = await supabase
    .from("companies")
    .select("*")
    .limit(1);
  console.timeEnd("companies_all_columns");
}

test();
