async function run() {
  const res = await fetch("http://localhost:3000/api/accounting/stats", {
    method: "PATCH",
    headers: {"Content-Type": "application/json", "Cookie": ""}, // No cookie, will fail 401
    body: JSON.stringify({orderId: "123", status: "returned"})
  });
  console.log(await res.text());
}
run();
