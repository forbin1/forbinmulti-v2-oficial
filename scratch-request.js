async function run() {
  try {
    const res = await fetch("http://localhost:8080/cursos/0766a075-f846-456b-8129-2560b0e9baeb");
    console.log("Status:", res.status);
    const html = await res.text();
    console.log("HTML length:", html.length);
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
run();
