const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarios.controller');
const { verificarToken, autorizarRoles } = require('../middlewares/auth.middleware');

//POST
router.post('/register', usuarioController.registrarUsuario);
router.post('/login', usuarioController.loginUsuario);

router.get('/perfil', verificarToken, usuarioController.obtenerPerfil);

//CRUD de usuarios con rutas protegidas (solo el admin puede relizar estas acciones)
router.get('/usuarios', verificarToken, autorizarRoles('ADMIN'), usuarioController.listarUsuarios);
router.put('/usuarios/:id', verificarToken, autorizarRoles('ADMIN'), usuarioController.modificarUsuario);
router.delete('/usuarios/:id', verificarToken, autorizarRoles('ADMIN'), usuarioController.eliminarUsuario);
router.patch('/usuarios/desactivar/:id', verificarToken, autorizarRoles('ADMIN'), usuarioController.desactivarUsuario);
router.patch('/usuarios/activar/:id', verificarToken, autorizarRoles('ADMIN'), usuarioController.activarUsuario);

module.exports = router;