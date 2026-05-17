import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  console.log("Profiles works?", !error);
  
  // Try to query jobs
  const { error: jobsErr } = await supabase.from('jobs').select('id').limit(1);
  console.log("Jobs table exists?", !jobsErr);
  
  const { error: coursesErr } = await supabase.from('courses').select('id, affiliate_available').limit(1);
  console.log("Courses has affiliate columns?", !coursesErr);
}

checkSchema();
