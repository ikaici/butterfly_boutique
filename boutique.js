const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = process.argv[2] || 3000;
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = { db: "CMSC335_DB", collection: "campApplicants" };

app.set('view engine', 'ejs');
app.use(express.static('views'));  
app.use(express.urlencoded({ extended: true }));

// Initialize
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

async function connectToDatabase() {
        await client.connect();
        return client.db(databaseAndCollection.db);
}

const apiKey = '8d060132a2642887fdc57261ed4248f7';
const city = 'College Park'; // Example city name

app.set('view engine', 'ejs');

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

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// Catalog Page 
app.get('/catalog', async (req, res) => {
    const items = await db.collection('items').find().toArray();
    res.render('catalog', { itemsTable: generateTable(items) }); 
});

// Order Form Page
app.get('/order', (req, res) => {
    let options = itemsMap.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
    res.render('placeOrder', { items: options });
  });

// Order Submission Handling
app.post('/order', async (req, res) => {
    const orderData = {
        name: req.body.name,
        email: req.body.email,
        delivery: req.body.delivery,
        itemsSelected: req.body.itemsSelected,
        orderInformation: req.body.orderInformation
    };
    await db.collection('orders').insertOne(orderData);
    res.redirect('/order-confirmation');
});

// Order Confirmation Page
app.post('/order', (req, res) => {
    // Extract data
    let { name, email, delivery, itemsSelected, orderInformation } = req.body;

    if (!Array.isArray(itemsSelected)) {
        itemsSelected = [itemsSelected];
    }
    // generate the order table
    let totalCost = 0;
    let orderTable = '<table><tr><th style="border: 2px double black;" >Item</th><th style="border: 2px double black;">Cost</th></tr>';

    itemsSelected.forEach(itemName => {
        let item = itemsMap.find(it => it.name === itemName);
        if (item) {
            totalCost += item.getCost();
            orderTable += `<tr><td style= "border: 2px double black;">${itemName}</td><td style="border: 2px double black;">${item.getCost()}</td></tr>`;
        }
    });

    orderTable += `<tr><td style="border: 2px double black;"><strong>Total Cost:</strong></td><td style="border: 2px double black;">${totalCost.toFixed(2)}</td></tr></table>`;
    res.render('orderConfirmation', {
        name: name,
        email: email,
        delivery: delivery === 'pickup' ? 'Will pick up' : 'Deliver',
        orderTable: orderTable
    });
});

app.listen(port, () => {
    console.log(`Server started and running at http://localhost:${port}`);
    console.log(`Stop to shutdown the server:`);
});

process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
    const input = data.trim().toLowerCase();
    if (input === 'stop' || input === 'Stop' || input === 'STOP') {
        client.close().then(() => {
            console.log('Shutting down the server.');
            process.exit();
        });
    }
});
