
const express = require("express");
const cors = require("cors");
const db = require("./db"); // Your db.js file

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// --- SECURE Endpoint for Contact Form Submission ---
app.post('/submit', (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    console.log("Contact form submission:", req.body);

    if (!name || !email || !phone || !subject || !message) {
        return res.status(400).send('All fields are required.');
    }

    // Use a parameterized query to prevent SQL injection
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


// --- NEW Endpoint for Creating an Order ---
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
    
    // Note: You need to create an 'orders' table in your database first!
    // SQL for table: CREATE TABLE orders (id SERIAL PRIMARY KEY, package_name VARCHAR(255), price NUMERIC, customer_name VARCHAR(255), email VARCHAR(255), address TEXT, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);
    const sql = 'INSERT INTO orders (package_name, price, customer_name, email, address, city, zip) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id';
    const values = [packageName, parseFloat(packagePrice), customerName, customerEmail, customerAddress, customerCity, customerZip];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error executing query:', err.stack);
            return res.status(500).send('An error occurred while creating your order.');
        }
        const orderId = result.rows[0].id;
        console.log(`Order created with ID: ${orderId}`);
        
        // In a real application, you would now create a payment session with Stripe/Razorpay
        // and return the payment link/ID to the frontend.
        res.status(201).json({
            message: 'Order received. Please proceed to payment.',
            orderId: orderId,
        });
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


