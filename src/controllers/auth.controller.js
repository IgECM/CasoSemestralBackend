
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { conectar } = require('../config/db');

// Aca se registra   un usuario nuevo
async function registrar(req, res) {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    let conexion;

    try {
        conexion = await conectar();

        // Encriptar la contraseña con bcrypt
        const passwordHash = await bcrypt.hash(password, 10);

        // Guardar el usuario en Oracle
        await conexion.execute(
            `INSERT INTO usuarios (nombre, correo, password, rol)
             VALUES (:nombre, :correo, :password, 'CLIENTE')`,
            {
                nombre: nombre,
                correo: correo,
                password: passwordHash
            },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error(error.message);

        if (error.errorNum === 1) {
            return res.status(409).json({ error: 'El correo ya está registrado' });
        }

        res.status(500).json({ error: 'Error al registrar usuario' });

    } finally {
        if (conexion) await conexion.close();
    }
}

// Iniciar sesion
async function login(req, res) {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    let conexion;

    try {
        conexion = await conectar();

        // Buscar usuario en Oracle
        const resultado = await conexion.execute(
            `SELECT id, nombre, correo, password, rol
             FROM usuarios
             WHERE correo = :correo AND activo = 1`,
            { correo: correo },
            { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const usuario = resultado.rows[0];

        // Comparar contraseña ingresada con el hash
        const passwordCorrecta = await bcrypt.compare(password, usuario.PASSWORD);

        if (!passwordCorrecta) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Crear token JWT
        const token = jwt.sign(
            {
                id: usuario.ID,
                rol: usuario.ROL
            },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(200).json({
            mensaje: 'Inicio de sesion correcto',
            token: token,
            usuario: {
                id: usuario.ID,
                nombre: usuario.NOMBRE,
                correo: usuario.CORREO,
                rol: usuario.ROL
            }
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Error al iniciar sesion' });

    } finally {
        if (conexion) await conexion.close();
    }
}

module.exports = { registrar, login };