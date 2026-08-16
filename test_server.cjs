try {
  console.log("Starting server...");
  require('./server.cjs');
} catch (err) {
  console.error("SERVER LOAD ERROR:", err);
}
