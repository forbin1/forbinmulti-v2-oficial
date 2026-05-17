async function run() {
  const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE";
  const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
  const schema = await res.json();
  const paths = Object.keys(schema.paths || {});
  const rpcPaths = paths.filter(p => p.startsWith('/rpc/'));
  console.log("RPC Functions found:", rpcPaths);
}
run();
