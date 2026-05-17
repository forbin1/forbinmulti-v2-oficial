async function run() {
  try {
    const res = await fetch("http://localhost:8080/admin/cursos");
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
    console.log("HTML Sample:", html.substring(0, 1000));
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
run();
