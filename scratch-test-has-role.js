import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Check has_role result
  const { data: roleCheck, error: roleCheckErr } = await supabase.rpc('has_role', {
    _user_id: 'cd5e7a36-898d-477d-8e95-a2a38103c87c',
    _role: 'admin'
  });
  console.log("has_role('admin') check:", roleCheck, roleCheckErr);

  // Check what roles exist for this user in user_roles
  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', 'cd5e7a36-898d-477d-8e95-a2a38103c87c');
  console.log("User roles in DB:", roles, rolesErr);
}
run();
