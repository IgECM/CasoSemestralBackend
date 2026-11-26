const oracledb = require('oracledb');
require('dotenv').config();

// Devuelve las filas de Oracle como objetos JSON { COLUMNA: valor }
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function iniciarDB() {
  try {
    await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING,
      configDir: process.env.WALLET_DIR,
      walletLocation: process.env.WALLET_DIR,
      walletPassword: process.env.WALLET_PASSWORD,
      poolMin: 1,
      poolMax: 5,
      poolIncrement: 1
    });
    console.log('Conectado exitosamente a Oracle Autonomous Database');
  } catch (error) {
    console.error('Error al conectar a Oracle:', error);
    process.exit(1);
  }
}

async function ejecutarConsulta(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const resultado = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    return resultado;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = { iniciarDB, ejecutarConsulta};