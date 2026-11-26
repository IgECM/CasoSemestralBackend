require('dotenv').config();
const app = require('./src/app');
const { iniciarDB } = require('./src/config/db');

const PORT = process.env.PORT || 3000;

iniciarDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Express lista en puerto ${PORT}`);
  });
});