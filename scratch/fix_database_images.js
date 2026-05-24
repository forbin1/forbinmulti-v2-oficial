import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== CLEANING UP DATABASE BASE64 IMAGE FIELDS ===");
  
  // 1. Update jobs table banner_url to a beautiful lightweight Unsplash URL
  const { data: jobData, error: jobError } = await supabase
    .from("jobs")
    .update({ 
      banner_url: "https://images.unsplash.com/photo-1541888086925-0c13d80b623b?q=80&w=600&auto=format&fit=crop" 
    })
    .eq("id", "b8213c99-6277-4e44-9b45-b0a72265a7f9");
    
  if (jobError) {
    console.error("Error updating job banner_url:", jobError);
  } else {
    console.log("Successfully updated job banner_url!");
  }

  // 2. Update companies table logo_url to null (will use the beautiful initials placeholder instead of a 12.6MB base64 logo)
  const { data: companyData, error: companyError } = await supabase
    .from("companies")
    .update({ 
      logo_url: null 
    })
    .eq("id", "bc0c0217-3d0d-4e3a-9c16-62ac70a242ba");

  if (companyError) {
    console.error("Error updating company logo_url:", companyError);
  } else {
    console.log("Successfully updated company logo_url!");
  }
}
run();
