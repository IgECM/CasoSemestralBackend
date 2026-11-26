const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      mensaje: 'Acceso denegado: no se proporcionó un token de autenticación'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).json({
        mensaje: 'Token inválido o expirado'
      });
    }

    req.usuario = decoded;
    next();
  });
}

function autorizarRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        mensaje: 'Acceso prohibido: no tienes permisos para realizar esta acción'
      });
    }
    next();
  };
}

module.exports = {
  verificarToken,
  autorizarRoles
};