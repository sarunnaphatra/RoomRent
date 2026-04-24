const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'db-config.json');

const run = async () => {
    try {
        if (!fs.existsSync(CONFIG_FILE)) {
            console.log("No config file found.");
            return;
        }
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        const sqlConfig = {
            user: config.user,
            password: config.password,
            database: config.database,
            server: config.host,
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };

        const pool = await new sql.ConnectionPool(sqlConfig).connect();
        console.log("Connected to DB");

        const result = await pool.request().query("SELECT * FROM bookings");
        console.log("Bookings count:", result.recordset.length);
        console.log("Bookings:", JSON.stringify(result.recordset, null, 2));
        
        // Also check server date settings
        const dateRes = await pool.request().query("SELECT @@DATEFIRST as DateFirst, GETDATE() as ServerDate");
        console.log("Server Settings:", dateRes.recordset[0]);

        await pool.close();
    } catch (err) {
        console.error("Error:", err);
    }
};

run();