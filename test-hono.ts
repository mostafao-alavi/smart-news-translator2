import { serve } from "@hono/node-server";
import { Hono } from "hono";
import Database from "better-sqlite3";

const db = new Database("local.db");

const app = new Hono();
app.get("/", (c) => c.text("Hello"));

console.log("Serving hono");
// serve(app, (info) => console.log(info));
