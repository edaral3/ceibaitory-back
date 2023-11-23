import { mongoConnection } from "./mongodb/mongoConnection";
import { redisConnection } from "./redisdb/redisConnection";
import http from "http";
import express from "express";
import cors from "cors";

import client from "./routes/client";
import store from "./routes/store";
import branch from "./routes/branch";
import user from "./routes/user";
import supplier from "./routes/supplier";
import product from "./routes/product";
import root from "./routes/root";

const app = express();

const getCors = (allow) => {
  const restrictedCors = {
    origin: [
      "https://www.agropecuaria-aldana.com",
      "https://agropecuaria-aldana.com",
    ],
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT"],
    headers: ["authorization", "Content-Type"],
  };

  return allow === "true" ? null : restrictedCors;
};

app.use(cors(getCors(process.env.COSR)));

app.use(express.json());
//app.use(express.urlencoded({ extended: false }))
//app.use(cookieParser())
//app.use(express.static(path.join(__dirname, 'public')))

//Mongodb
mongoConnection();

//Redis
redisConnection();

// Endpoints
app.use("/", root);
app.use("/client", client);
app.use("/user", user);
app.use("/supplier", supplier);
app.use("/product", product);
app.use("/purchase", product);
app.use("/branch", branch);
app.use("/store", store);
app.use("/sale", product);
app.use("/credit", product);

const PORT = process.env.PORT || "3000";
app.set("port", PORT);

const server = http.createServer(app);
server.listen(PORT);
server.on("listening", onListening);

function onListening() {
  server.address();
  console.log("Listening on " + PORT);
}

module.exports = app;
