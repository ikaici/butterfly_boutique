const fs = require('fs');
const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port= process.env.PORT || 10000;
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = { db: "CMSC335_DB", collection: "clothesOrders" };

app.set('view engine', 'ejs');
app.use(express.static('views'));
app.use(express.urlencoded({ extended: true }));

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db;

// Initialize and connect to the database
async function connectToDatabase() {
    await client.connect();
    db = client.db(databaseAndCollection.db);
}

(async () => {
    await connectToDatabase();
    app.listen(port, () => {
        console.log(`Server started and running at http://localhost:${port}`);
    });
})();

const apiKey = '8d060132a2642887fdc57261ed4248f7';
const city = 'College Park'; // Example city name

app.get('/', (req, res) => {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const weatherData = {
        temperature: data.main.temp,
        description: data.weather[0].description
      };
      console.log(weatherData);
      res.render('index', { weatherData });
    })
    .catch(error => {
      console.error('Error fetching weather data:', error);
      res.render('index', { error: 'Failed to fetch weather data' });
    });
});

class ClothesItem {
    #cost;

    constructor(name, cost) {
      this.name = name;
      this.#cost = cost;
    }

    getCost() {
      return this.#cost;
    }

    getName() {
      return this.name;
    }
}

let itemsMap;

// Validates command line arguments before proceeding
if (process.argv.length !== 3) {
    console.error('Usage: node boutique.js <itemsList.json>');
    process.exit(1);
}

const jsonFilePath = process.argv[2];
try {
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const itemsList = JSON.parse(jsonData).itemsList;
    itemsMap = itemsList.map(item => new ClothesItem(item.name, item.cost));
} catch (error) {
    console.error(`Error reading the JSON file: ${error}`);
    process.exit(1);
}

app.get('/catalog', (req, res) => {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${apiKey}`)
    .then(response => response.json())
    .then(data => {
      const weatherData = {
        temperature: data.main.temp,
        description: data.weather[0].description
      };
      console.log(weatherData);
      let itemsTable = '<tr><th style="border: 2px double white;">Item</th><th style="border: 2px double white;">Price (USD $)</th></tr>';
        itemsTable += itemsMap.map(item => 
        `<tr><td style="border: 2px double white;">${item.getName()}</td>` +
        `<td style="border: 2px double white;">${item.getCost()}</td></tr>`
        ).join('');
        res.render('displayItems.ejs', { itemsTable: `<table>${itemsTable}</table>`, weatherData });
    })
    .catch(error => {
      console.error('Error fetching weather data:', error);
      res.render('index', { error: 'Failed to fetch weather data' });
    });
    
});

app.get('/order', (req, res) => {
    let options = itemsMap.map(item => `<option value="${item.getName()}">${item.getName()}</option>`).join('');
    res.render('placeOrder', { items: options });
});

// Order Confirmation Page
app.post('/order', async (req, res) => {
    let { name, email, delivery, itemsSelected, orderInformation } = req.body;
    if (!Array.isArray(itemsSelected)) {
        itemsSelected = [itemsSelected];
    }
    let totalCost = 0;
    let orderTable = '<table><tr><th style="border: 2px double white;">Item</th><th style="border: 2px double white;">Cost</th></tr>';
    const itemsDetails = [];

    itemsSelected.forEach(itemName => {
        let item = itemsMap.find(it => it.name === itemName);
        if (item) {
            totalCost += item.getCost();
            orderTable += `<tr><td style="border: 2px double white;">${itemName}</td><td style="border: 2px double white;">$${item.getCost().toFixed(2)}</td></tr>`;
            itemsDetails.push({itemName, cost: item.getCost()});
        }
    });

    orderTable += `<tr><td style="border: 2px double white;"><strong>Total Cost:</strong></td><td style="border: 2px double white;">$${totalCost.toFixed(2)}</td></tr></table>`;

    const orderData = {
        name,
        email,
        deliveryMethod: delivery,
        items: itemsDetails,
        totalCost,
        orderInformation,
        orderDate: new Date()
    };

    try {
        const orderResult = await db.collection('clothesOrders').insertOne(orderData);
        res.render('orderConfirmation', {
            name,
            email,
            delivery: delivery === 'pickup' ? 'Will pick up' : 'Deliver',
            orderTable
        });
    } catch (error) {
        console.error('Failed to insert order:', error);
        res.status(500).send("Failed to place order");
    }
});

process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    const input = data.trim().toLowerCase();
    if (input === 'stop' || input === 'Stop' || input === 'STOP') {
        client.close().then(() => {
            console.log('Shutting down the server!!!');
            process.exit();
        });
    }
});
