const fs = require('fs');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();

// Path to your text file
const serviceFilePath = 'service_account.txt';
const tarrifFilePath = 'service_account.txt';

// Create SQLite database connection
const db = new sqlite3.Database('simulator.db');

// Define table name
const serviceTableName = 'service_account';
const tarrifTableName = 'tarrif_plan';

// Create table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS ${serviceTableName} (
        name TEXT,
        partition_key INTEGER,
        service_status INTEGER,
        service_type INTEGER,
        service_list TEXT,
        service_policy TEXT,
        primary_service TEXT,
        sub_services TEXT,
        status_flags TEXT,
        active_policy TEXT,
        primary_balance TEXT,
        secondary_balance TEXT,
        additional_balances TEXT,
        liability_rules TEXT,
        meta TEXT,
        history TEXT,
        financial_account_id TEXT,
        account_type_id TEXT,
        user_id TEXT,
        sales_order_line_id TEXT,
        created_by TEXT,
        owned_by TEXT,
        subscriber TEXT,
        policy TEXT,
        account_status INTEGER,
        account_policy TEXT,
        "SIM Name" TEXT,
        msisdn TEXT,
        iccid TEXT,
        imei_rule TEXT,
        imsi TEXT
    )`);
});



// Read text file line by line and insert data into SQLite database
const rl = readline.createInterface({
    input: fs.createReadStream(serviceFilePath),
    crlfDelay: Infinity
});

rl.on('line', (line) => {
    const data = line.split(','); // Assuming CSV format, modify delimiter as needed
    // Insert data into SQLite table
    db.run(`INSERT INTO ${serviceTableName} (name, partition_key, service_status, service_type, service_list, service_policy, 
        primary_service, sub_services, status_flags, active_policy, primary_balance, secondary_balance, additional_balances,
         liability_rules, meta, history, financial_account_id, account_type_id, user_id, sales_order_line_id, created_by, 
         owned_by, subscriber, policy, account_status, account_policy, "SIM Name", msisdn, iccid, imei_rule, imsi) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
         [
            data[0],  // name
            data[1],  // partition_key
            data[2],  // service_status
            data[3],  // service_type
            data[4],  // service_list
            data[5],  // service_policy
            data[6],  // primary_service
            data[7],  // sub_services
            data[8],  // status_flags
            data[9],  // active_policy
            data[10], // primary_balance
            data[11], // secondary_balance
            data[12], // additional_balances
            data[13], // liability_rules
            data[14], // meta
            data[15], // history
            data[16], // financial_account_id
            data[17], // account_type_id
            data[18], // user_id
            data[19], // sales_order_line_id
            data[20], // created_by
            data[21], // owned_by
            data[22], // subscriber
            data[23], // policy
            data[24], // account_status
            data[25], // account_policy
            data[26], // "SIM Name"
            data[27], // msisdn
            data[28], // iccid
            data[29], // imei_rule
            data[30]  // imsi
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







