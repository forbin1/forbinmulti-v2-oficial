import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wuarslrenynwiflzgrjp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE"
);

async function run() {
  const { data, error } = await supabase.from("enrollments").select("*").limit(1);
  console.log("Select result:", data, error);

  // let's try to query some active users
  const { data: users } = await supabase.from("profiles").select("*").limit(5);
  console.log("Profiles:", users);
}
run();
