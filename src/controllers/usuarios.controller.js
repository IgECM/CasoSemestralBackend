const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ejecutarConsulta } = require('../config/db');
const { filaAObjeto, filasAObjetos, REGEX_CORREO } = require('../utils/formato');


//Valida los campos comunes de registro.
function validarDatosUsuario({ nombre, correo, password }) {
  if (!nombre || !correo || !password) {
    return 'Todos los campos son obligatorios';
  }
  if (!REGEX_CORREO.test(correo)) {
    return 'El correo no tiene un formato válido';
  }
  if (password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres';
  }
  return null;
}

//1. Registrar un Usuario: El servidor por defecto asigna siempre el rol de cliente.
async function registrarUsuario(req, res) {
  try {
    const { nombre, correo, password } = req.body;

    const errorValidacion = validarDatosUsuario({ nombre, correo, password });
    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // El servidor asigna el rol por defecto en cliente.
    const rolAsignado = 'CLIENTE';

    const sql = `
      INSERT INTO usuarios (nombre, correo, password, rol)
      VALUES (:nombre, :correo, :password, :rol)
    `;

    await ejecutarConsulta(sql, {
      nombre: nombre.trim(),
      correo: correo.toLowerCase().trim(),
      password: passwordHash,
      rol: rolAsignado
    });

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: {
        nombre,
        correo: correo.toLowerCase().trim(),
        rol: rolAsignado
      }
    });
  } catch (error) {
    if (error.errorNum === 1) { // ORA-00001: correo duplicado
      return res.status(409).json({ mensaje: 'El correo ya se encuentra registrado' });
    }
    res.status(500).json({ mensaje: 'Error al registrar usuario', detalle: error.message });
  }
}

// 2. Iniciar Sesion: Comprueba el hash, crea y devuelve un JWT y da error genérico si falla.
async function loginUsuario(req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ mensaje: 'Credenciales inválidas' });
    }

    const sql = `
      SELECT id, nombre, correo, password, rol, activo
      FROM usuarios
      WHERE correo = :correo
    `;
    const resultado = await ejecutarConsulta(sql, { correo: correo.toLowerCase().trim() });
    const usuario = resultado.rows[0];


    if (!usuario || usuario.ACTIVO === 0) {
      return res.status(401).json({ mensaje: 'Credenciales Invalidas' });
    }

    // Comparar contraseña enviada con el hash guardado en la columna password de la base de datos.
    const passwordValida = await bcrypt.compare(password, usuario.PASSWORD);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    // Generar el JWT
    const token = jwt.sign(
      { id: usuario.ID, correo: usuario.CORREO, rol: usuario.ROL },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.ID,
        nombre: usuario.NOMBRE,
        correo: usuario.CORREO,
        rol: usuario.ROL
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', detalle: error.message });
  }
}

// 3. Perfil: devuelve al usuario dueño del token. El frontend lo usa para revalidar la sesión cuando se recarga la página.
async function obtenerPerfil(req, res) {
  try {
    const sql = `
      SELECT id, nombre, correo, rol, activo
      FROM usuarios
      WHERE id = :id
    `;
    const resultado = await ejecutarConsulta(sql, { id: req.usuario.id });
    const usuario = filaAObjeto(resultado.rows[0]);

    if (!usuario || usuario.activo === 0) {
      return res.status(401).json({ mensaje: 'La sesión ya no es válida' });
    }

    res.status(200).json({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el perfil', detalle: error.message });
  }
}

// 4. Listar usuarios (Solo el Admin tiene permiso)
async function listarUsuarios(req, res) {
  try {
    const sql = `
      SELECT id, nombre, correo, rol, activo, fecha_registro
      FROM usuarios
      ORDER BY id
    `;
    const resultado = await ejecutarConsulta(sql);
    res.status(200).json(filasAObjetos(resultado.rows));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar usuarios', detalle: error.message });
  }
}

// 4. Modificar Usuario (Solo el Admin tiene permiso)
async function modificarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { nombre, rol } = req.body;

    // Validar que el rol cumpla con chk_usuario_rol si viene en el body
    const rolNormalizado = rol ? rol.toUpperCase().trim() : null;
    if (rolNormalizado && !['CLIENTE', 'ADMIN', 'RECEPCIONISTA'].includes(rolNormalizado)) {
      return res.status(400).json({ mensaje: 'Rol no permitido. Use CLIENTE, ADMIN o RECEPCIONISTA' });
    }

    const sql = `
      UPDATE usuarios
      SET nombre = COALESCE(:nombre, nombre),
          rol = COALESCE(:rol, rol)
      WHERE id = :id
    `;
    const resultado = await ejecutarConsulta(sql, {
      nombre: nombre || null,
      rol: rolNormalizado,
      id
    });

    if (resultado.rowsAffected === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.status(200).json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al modificar usuario', detalle: error.message });
  }
}

// 5. Eliminar Usuario (Solo el Admin tiene permiso)
async function eliminarUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: 'El id del usuario no es válido' });
    }

    if (id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta' });
    }

    const sql = `DELETE FROM usuarios WHERE id = :id`;
    const resultado = await ejecutarConsulta(sql, { id });

    if (resultado.rowsAffected === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.status(200).json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    // Código ORA-02292: ocurre si el usuario tiene registros asociados en otra tabla (tiene una cita agendada)
    if (error.errorNum === 2292) {
      return res.status(409).json({
        mensaje: 'No se puede eliminar el usuario porque tiene una cita asociada'
      });
    }

    res.status(500).json({ mensaje: 'Error al eliminar usuario', detalle: error.message });
  }
}

// 8. Desactivar Usuario (Solo el Admin tiene permiso).
async function desactivarUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: 'El id del usuario no es válido' });
    }

    if (id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'No puedes desactivar tu propia cuenta' });
    }

    // Verificar si el usuario existe y su estado actual
    const sqlVerificar = `SELECT activo FROM usuarios WHERE id = :id`;
    const resultadoVerificar = await ejecutarConsulta(sqlVerificar, { id });

    if (resultadoVerificar.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Si ya está desactivado devolver un error
    if (resultadoVerificar.rows[0].ACTIVO === 0) {
      return res.status(400).json({ mensaje: 'El usuario ya se encuentra desactivado' });
    }

    //Si no estaba desactivado, desactivarlo
    const sql = `UPDATE usuarios SET activo = 0 WHERE id = :id`;
    await ejecutarConsulta(sql, { id });

    res.status(200).json({ mensaje: 'Usuario desactivado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al desactivar usuario', detalle: error.message });
  }
}

// 9. Activar Usuario (Solo el Admin tiene permiso)
async function activarUsuario(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ mensaje: 'El id del usuario no es válido' });
    }

    // Verificar si el usuario existe y su estado actual
    const sqlVerificar = `SELECT activo FROM usuarios WHERE id = :id`;
    const resultadoVerificar = await ejecutarConsulta(sqlVerificar, { id });

    if (resultadoVerificar.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Si ya está activo devolver un error
    if (resultadoVerificar.rows[0].ACTIVO === 1) {
      return res.status(400).json({ mensaje: 'El usuario ya se encuentra activo' });
    }

    // Si no estaba activo, activarlo
    const sql = `UPDATE usuarios SET activo = 1 WHERE id = :id`;
    await ejecutarConsulta(sql, { id });

    res.status(200).json({ mensaje: 'Usuario activado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al activar usuario', detalle: error.message });
  }
}
module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  listarUsuarios,
  modificarUsuario,
  eliminarUsuario,
  desactivarUsuario,
  activarUsuario
};