const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database('simulator.db');

// Endpoint to retrieve information related to a service account ID
app.get('/service-account/:id', (req, res) => {
    const serviceAccountId = req.params.id;

    db.serialize(() => {
        db.all(`SELECT * FROM service_account WHERE name = ?`, serviceAccountId, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Service account not found' });
            }
            res.json(rows);
        });
    });
});

// Start the server
const port = 3000; // Or any other port you prefer
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
