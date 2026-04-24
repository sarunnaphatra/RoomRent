const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'db-config.json');

let pool = null;

const getPool = () => pool;

const initSchema = async (poolInstance) => {
    try {
        const sqlPath = path.join(__dirname, 'database.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by 'GO' to execute batches
        const statements = sqlContent.split(/^GO\s*$/m);

        for (const statement of statements) {
            if (statement.trim()) {
                await poolInstance.request().query(statement);
            }
        }

        console.log('Database schema initialized successfully.');
        return true;
    } catch (error) {
        console.error('Failed to initialize schema:', error);
        return false;
    }
};

const saveConfig = async (config) => {
    try {
        const sqlConfig = {
            user: config.user,
            password: config.password,
            database: config.database,
            server: config.host, // Map 'host' to 'server'
            requestTimeout: 60000, // Increase request timeout to 60s
            pool: {
                max: 10,
                min: 2, // Keep at least 2 connections
                idleTimeoutMillis: 300000 // 5 minutes idle timeout (increased)
            },
            options: {
                encrypt: false, // for local dev
                trustServerCertificate: true, // change to true for local dev / self-signed certs
                enableArithAbort: true
            }
        };

        // Test connection
        const tempPool = await new sql.ConnectionPool(sqlConfig).connect();
        await tempPool.close();

        // Save config if successful
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        
        // Create global pool
        pool = await new sql.ConnectionPool(sqlConfig).connect();

        // Initialize Schema
        await initSchema(pool);

        return { success: true, message: 'Database connected, saved, and schema initialized.' };
    } catch (error) {
        console.error('DB Connection Error:', error);
        return { success: false, message: 'Failed to connect to database: ' + error.message };
    }
};

const initDB = async () => {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            const sqlConfig = {
                user: config.user,
                password: config.password,
                database: config.database,
                server: config.host,
                requestTimeout: 60000, // Increase request timeout to 60s
                pool: {
                    max: 10,
                    min: 2, // Keep at least 2 connections
                    idleTimeoutMillis: 300000 // 5 minutes idle timeout (increased)
                },
                options: {
                    encrypt: false,
                    trustServerCertificate: true,
                    enableArithAbort: true
                }
            };
            
            pool = await new sql.ConnectionPool(sqlConfig).connect();
            console.log('Database initialized from config file.');
            
            // Initialize Schema to ensure updates are applied
            await initSchema(pool);
            
            return true;
        } catch (error) {
            console.error('Failed to init DB from config:', error);
            return false;
        }
    }
    return false;
};

module.exports = {
    getPool,
    saveConfig,
    initDB,
    sql // Export sql for type usage in server.js
};
