const express = require('express');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', usuariosRoutes);

app.get('/api/v1', (req, res) => {
  res.status(200).json({
    estado: 'OK',
    mensaje: 'API Veterinaria San Marcos operativa',
    endpoints: {
      register: 'POST /api/v1/register',
      login: 'POST /api/v1/login',
      usuarios: 'GET /api/v1/usuarios , PUT|DELETE /api/v1/usuarios/:id',
      cambiarEstadoUsuario: ' PATCH /usuarios/desactivar/:id, /usuarios/activar/:id'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

module.exports = app;