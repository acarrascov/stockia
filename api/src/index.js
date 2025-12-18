const app = require("./app");

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Stockia API corriendo en http://localhost:${PORT}`);
});