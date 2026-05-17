import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_policies_for_table', {
    table_name: 'courses'
  });
  
  if (error) {
    // If RPC doesn't exist, let's run direct query using sql endpoint if available, or fetch pg_policies
    console.log("RPC get_policies_for_table failed, executing raw select on pg_policies...");
    const { data: policies, error: policiesErr } = await supabase
      .from('pg_policies') // wait, pg_policies is a system view and might not be exposed on API
      .select('*');
    console.log("System views:", policiesErr?.message);
    
    // Let's create an RPC function to query pg_policies or run SQL!
    // Since we have the service role key, we can create a temporary function to run any query!
  } else {
    console.log("Policies:", data);
  }
}

async function createSqlExecutor() {
  // Let's run a query by creating a temporary function that returns JSON!
  const sql = `
    CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
      ret json;
    BEGIN
      EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO ret;
      RETURN ret;
    END;
    $$;
  `;
  
  const { error } = await supabase.rpc('execute_sql', { sql_query: 'select version()' });
  if (error) {
    console.log("SQL Executor not present, let's create it via a postgres function migration...");
    // Since we don't have direct SQL interface exposed via HTTP unless we create a function,
    // let's see if we can create a temporary PostgreSQL function by running it.
    // Wait, how can we create a function if we don't have an SQL execution endpoint?
    // In Supabase, the POST /rest/v1/rpc is the only way to run code, but we need an existing function.
    // Wait! Is there an existing function? Let's check.
  }
}

// Let's query policies using a simpler select if pg_policies is not accessible:
async function checkWithRawQuery() {
  // Let's query pg_policies using execute_sql if it exists
  const { data: res, error } = await supabase.rpc('execute_sql', {
    sql_query: "SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'courses'"
  });
  console.log("Courses Policies:", res, error);
}

checkWithRawQuery();
