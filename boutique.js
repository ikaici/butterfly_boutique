const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const app = express();
const port = 5000;
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = { db: "CMSC335_DB", collection: "campApplicants" };

app.set('view engine', 'ejs');
app.use(express.static('public'));  