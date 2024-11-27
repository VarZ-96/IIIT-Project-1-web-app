const express = require("express"), bodyParser = require("body-parser"), cors = require("cors");
const db = require("./db")

const app = express();
const port = 3000;


app.use(express.json());
app.use(cors())


app.post('/submit', (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    console.log(req.body)

    if (!name || !email || !phone || !subject || !message) {
        return res.status(400).send('All fields are required.');
    }

    const sql = `INSERT INTO contact (uname, email, phone, subject, messages) VALUES ('${name}', '${email}', '${phone}', '${subject}', '${message}')`;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('An error occurred.');
        }
        res.send('We will contact you soon.');
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
