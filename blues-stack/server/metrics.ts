import express from "express";
import prom from "@isaacs/express-prometheus-middleware";

export const metricsApp = express();

const metricsPort = process.env.METRICS_PORT || 3010;

metricsApp.listen(metricsPort, () => {
  console.log(`✅ metrics ready: http://localhost:${metricsPort}/metrics`);
});