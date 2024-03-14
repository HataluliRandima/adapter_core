const fs = require('fs');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();

// Path to your text file
const tarrifFilePath = 'tarrif_plan.txt';

// Create SQLite database connection
const db = new sqlite3.Database('simulator.db');

// Define table name
const tarrifTableName = 'tarrif_plan';

// Create table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS ${tarrifTableName} (
        id INTEGER PRIMARY KEY,
        binary_id TEXT,
        name TEXT,
        "order" INTEGER,
        "type" TEXT,
        currency_id TEXT,
        unit_id TEXT,
        applies_to TEXT,
        managed_by TEXT,
        plan TEXT,
        service TEXT,
        routing TEXT,
        destination_group TEXT,
        short_description TEXT,
        description TEXT,
        taxes TEXT,
        target_groups TEXT,
        history TEXT,
        meta TEXT,
        owned_by TEXT,
        updated_by TEXT,
        rating_group_id TEXT,
        insert_at TEXT,
        updated_at TEXT
    )`);
});

// Read text file line by line and insert data into SQLite database
const rl = readline.createInterface({
    input: fs.createReadStream(tarrifFilePath),
    crlfDelay: Infinity
});

rl.on('line', (line) => {
    const data = line.split(','); // Assuming CSV format, modify delimiter as needed
    
    // Insert data into SQLite table
    db.run(`INSERT INTO ${tarrifTableName} (
        binary_id,
        name,
        "order",
        "type",
        currency_id,
        unit_id,
        applies_to,
        managed_by,
        plan,
        service,
        routing,
        destination_group,
        short_description,
        description,
        taxes,
        target_groups,
        history,
        meta,
        owned_by,
        updated_by,
        rating_group_id,
        insert_at,
        updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [
        data[0], data[1], parseInt(data[2]), data[3], data[4], data[5], data[6], data[7], data[8], data[9], 
        data[10], data[11], data[12], data[13], data[14], data[15], data[16], data[17], data[18], 
        data[19], data[20], data[21], data[22]
    ], 
    function(err) {
        if (err) {
            console.error(err.message);
        }
    });
});

rl.on('close', () => {
    console.log('Text file successfully processed');
    // Close the database connection
    db.close();
});
