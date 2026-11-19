# Backend - Veterinaria San Marcos

API REST desarrollada en **Node.js + Express** conectada a **Oracle Autonomous Database (Oracle Cloud)** mediante pool de conexiones con mTLS/Wallet.

## Estado de Operaciones (Módulo de Usuarios)

| Operación | Estado | Endpoint / Descripción |
| :--- | :---: | :--- |
| **Tabla de usuarios** | **Listo** | Tabla `usuarios` creada en Oracle Cloud con persistencia real, restricciones de rol/estado y contraseñas encriptadas con hash (`bcryptjs`). |
| **Inicio de sesión** | **Listo** | `POST /api/login` — Valida credenciales contra el hash almacenado, genera token JWT y responde con error genérico ante fallos. |
| **Registro (crear usuario)** | **Listo** | `POST /api/registro` — Registra nuevos usuarios en la base de datos con contraseña hasheada y rol `CLIENTE` asignado por el servidor. |
| **Modificar usuario** | **En avance** | `PUT /api/usuarios/:id` |
| **Listar usuarios** | **En avance** | `GET /api/usuarios` |
| **Eliminar o desactivar usuario** | **En avance** | `DELETE /api/usuarios/:id`  |

---

Link repositorio Frontend: https://github.com/IgECM/CasoSemestral.git
