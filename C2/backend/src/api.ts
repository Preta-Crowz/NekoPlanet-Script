import express from "express";
import cors from "cors";
import { workingFarm, storageFarm } from "./workarea.js";

export const startApi = (port: number = 3000) => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/farms", (_req, res) => {
    res.json({ workingFarm, storageFarm });
  });

  const server = app.listen(port, () => {
    console.log("HTTP API listening on port", port);
  });

  return server;
};

export default startApi;
