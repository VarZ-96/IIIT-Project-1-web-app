const express = require("express");
const cors = require("cors");
const db = require("./db"); // Your db.js file 
const Razorpay = require("razorpay"); // Import Razorpay
require('dotenv').config(); // Load variables from .env 

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// --- Initialize Razorpay ---
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Your Key ID from .env
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Your Key Secret from .env
});


// --- NEW Endpoint for Razorpay Order Creation ---
app.post('/razorpay-order', async (req, res) => {
    const { amount, currency, receipt } = req.body;

    const options = {
        amount: amount, // Amount in the smallest currency unit (e.g., paise for INR)
        currency: currency,
        receipt: receipt,
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).send("Error creating order");
    }
});


// --- Your existing endpoints ---
app.post('/submit', (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    console.log("Contact form submission:", req.body);

    if (!name || !email || !phone || !subject || !message) {
        return res.status(400).send('All fields are required.');
    }

    const sql = 'INSERT INTO contact (uname, email, phone, subject, messages) VALUES ($1, $2, $3, $4, $5)';
    const values = [name, email, phone, subject, message];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).send('An error occurred while saving your message.');
        }
        console.log("Contact form data inserted successfully.");
        res.status(200).send('Thank you for contacting us. We will get back to you soon.');
    });
});

app.post('/create-order', (req, res) => {
    const { 
        packageName, 
        packagePrice, 
        customerName, 
        customerEmail, 
        customerAddress, 
        customerCity, 
        customerZip 
    } = req.body;

    console.log("Order creation request:", req.body);

    if (!packageName || !packagePrice || !customerName || !customerEmail || !customerAddress) {
        return res.status(400).send('Missing required order information.');
    }
    
    const sql = 'INSERT INTO orders (package_name, price, customer_name, email, address, city, zip) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
    const values = [packageName, parseFloat(packagePrice), customerName, customerEmail, customerAddress, customerCity, customerZip];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).send('An error occurred while creating your order.');
        }
        const orderId = result.rows[0].id;
        console.log(`Order created with ID: ${orderId}`);
        
        res.status(201).json({
            message: 'Order received. Please proceed to payment.',
            orderId: orderId,
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});