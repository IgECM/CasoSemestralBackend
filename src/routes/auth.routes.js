const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/registro', authController.registrar);
router.post('/login', authController.login);

// En proceso
router.get('/usuarios', verificarToken, usuarioController.listarUsuarios);
router.put('/:id', verificarToken, usuarioController.modificarUsuario);
router.delete('/:id', verificarToken, usuarioController.eliminarUsuario);

module.exports = router;