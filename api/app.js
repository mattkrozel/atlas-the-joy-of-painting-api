import express from "express";
import routes from "./index.js";
import connectDB from "../utils/db.js";

const app = express();
const port = 5000;
app.use(express.json())

routes(app);
app.listen(port);

connectDB();
export default app;
