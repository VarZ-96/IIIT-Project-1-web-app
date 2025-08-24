const express = require("express");
const cors = require("cors");
const db = require("../db");
const Razorpay = require("razorpay");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const port = 3000;

// --- Middleware Setup ---
app.use(cors({
    origin: 'https://iiit-project-1-web-app-varz-96s-projects.vercel.app', // Allow your frontend origin
    credentials: true                // Allow cookies to be sent
}));
app.use(express.json());

// Session Middleware (must be before Passport)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// --- Passport Google Strategy ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback" // Add /api prefix
  },
  (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const googleId = profile.id;
    const name = profile.displayName; // Get the user's name

    db.query('SELECT * FROM users WHERE google_id = $1', [googleId], (err, result) => {
        if (err) { return done(err); }
        if (result.rows.length > 0) {
            return done(null, result.rows[0]);
        } else {
            // Save the name when creating a new user
            const sql = 'INSERT INTO users (email, google_id, name) VALUES ($1, $2, $3) RETURNING *';
            db.query(sql, [email, googleId, name], (err, insertResult) => {
                if (err) { return done(err); }
                return done(null, insertResult.rows[0]);
            });
        }
    });
  }
));

// Stores user ID in the session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Retrieves user data from the session
passport.deserializeUser((user, done) => {
    // You can skip the database call here if the full user object is in the session
    done(null, user);
});
// Middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'You must be logged in to do that.' });
}
// --- Auth Routes ---
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect to the frontend.
    // NOTE: Make sure your frontend runs on this address or change it.
    res.redirect('https://iiit-project-1-web-app-varz-96s-projects.vercel.app/');
  }
);
// --- New Endpoint to Check Auth Status ---
app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        // If user is logged in, send back their info
        res.json({
            loggedIn: true,
            user: {
                name: req.user.name || req.user.email, // Use name if available, otherwise email
                // You can add more user details here if needed
            }
        });
    } else {
        // If user is not logged in
        res.json({ loggedIn: false });
    }
});
app.get('/api/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('https://iiit-project-1-web-app-varz-96s-projects.vercel.app/');
  });
});
// --- Cart API Routes ---

// GET current user's cart
app.get('/api/cart', ensureAuthenticated, (req, res) => {
    const userId = req.user.id;
    db.query('SELECT * FROM cart_items WHERE user_id = $1 ORDER BY added_at', [userId], (err, result) => {
        if (err) {
            console.error('Error fetching cart:', err.stack);
            return res.status(500).json({ error: 'Server error' });
        }
        res.json(result.rows);
    });
});

// ADD an item to the cart
// ADD an item to the cart (with quantity handling)
app.post('/api/cart/add', ensureAuthenticated, (req, res) => {
    const userId = req.user.id;
    const { name, price } = req.body;

    // This SQL statement will insert a new item, but if it already exists
    // (based on the unique_user_package constraint), it will update the quantity instead.
    const sql = `
        INSERT INTO cart_items (user_id, package_name, price, quantity)
        VALUES ($1, $2, $3, 1)
        ON CONFLICT (user_id, package_name)
        DO UPDATE SET quantity = cart_items.quantity + 1
        RETURNING *;
    `;

    db.query(sql, [userId, name, price], (err, result) => {
        if (err) {
            console.error('Error adding/updating cart:', err.stack);
            return res.status(500).json({ error: 'Server error' });
        }
        res.status(201).json(result.rows[0]);
    });
});
// REMOVE an item from the cart
app.delete('/api/cart/item/:id', ensureAuthenticated, (req, res) => {
    const itemId = req.params.id;
    const userId = req.user.id;

    // The query ensures a user can only delete their own cart items
    const sql = 'DELETE FROM cart_items WHERE id = $1 AND user_id = $2';
    
    db.query(sql, [itemId, userId], (err, result) => {
        if (err) {
            console.error('Error removing item from cart:', err.stack);
            return res.status(500).json({ error: 'Server error' });
        }
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Item not found or you do not have permission to remove it.' });
        }
        res.status(200).json({ message: 'Item removed successfully.' });
    });
});
// CLEAR the user's cart (e.g., after payment)
app.delete('/api/cart/clear', ensureAuthenticated, (req, res) => {
    const userId = req.user.id;
    db.query('DELETE FROM cart_items WHERE user_id = $1', [userId], (err, result) => {
        if (err) {
            console.error('Error clearing cart:', err.stack);
            return res.status(500).json({ error: 'Server error' });
        }
        res.status(200).json({ message: 'Cart cleared successfully.' });
    });
});
// --- Initialize Razorpay ---
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // Your Key ID from .env
    key_secret: process.env.RAZORPAY_KEY_SECRET, // Your Key Secret from .env
});


// --- NEW Endpoint for Razorpay Order Creation ---
app.post('/api/razorpay-order', async (req, res) => {
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
app.post('/api/submit', (req, res) => {
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

app.post('/api/create-order', ensureAuthenticated, (req, res) => {
    const { cart, customerDetails, paymentId } = req.body;
    const userId = req.user.id;

    // Create a summary of the package names
    const packageNames = cart.map(item => `${item.package_name} (x${item.quantity})`).join(', ');
    const totalPrice = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    const sql = `
        INSERT INTO orders 
        (package_name, price, customer_name, email, user_id, razorpay_payment_id) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `;
    const values = [packageNames, totalPrice, customerDetails.name, customerDetails.email, userId, paymentId];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error saving order:', err.stack);
            return res.status(500).send('An error occurred while saving your order.');
        }
        res.status(201).json({ message: 'Order saved successfully.', orderId: result.rows[0].id });
    });
});
// GET the current user's order history
app.get('/api/orders', ensureAuthenticated, (req, res) => {
    const userId = req.user.id;
    const sql = `
        SELECT package_name, price, razorpay_payment_id, created_at 
        FROM orders 
        WHERE user_id = $1 
        ORDER BY created_at DESC
    `;
    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Error fetching order history:', err.stack);
            return res.status(500).json({ error: 'Server error' });
        }
        res.json(result.rows);
    });
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});