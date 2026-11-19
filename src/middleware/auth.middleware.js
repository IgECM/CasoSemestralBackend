const jwt = require('jsonwebtoken');

// Comprobar el token JWT
function verificarToken(req, res, next) {
    const autorizacion = req.headers.authorization;

    if (!autorizacion || !autorizacion.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Token no proporcionado'
        });
    }

    const token = autorizacion.split(' ')[1];

    try {
        const datos = jwt.verify(token, process.env.JWT_SECRET);

        // Guardar los datos del usuario autenticado
        req.usuario = datos;

        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Token invalido o vencido'
        });
    }
}

// Solo permitir al administrador
function soloAdmin(req, res, next) {
    if (req.usuario.rol !== 'ADMIN') {
        return res.status(403).json({
            error: 'No tienes permisos'
        });
    }

    next();
}

module.exports = { verificarToken, soloAdmin };