require('dotenv').config();
const oracledb = require('oracledb');

async function conectar() {
    const conexion = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING,
        configDir: process.env.WALLET_DIR,
        walletLocation: process.env.WALLET_DIR,
        walletPassword: process.env.WALLET_PASSWORD
    });

    return conexion;
}

module.exports = { conectar };