import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import connectDB from "./db/db.js";

const app = express();

//Database connction function
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`server is running : ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB Conncection Failed !", err);
    })

app.get("/", (req, res) => {
    res.send("Server is running!");
});

