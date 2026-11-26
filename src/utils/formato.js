// Oracle devuelve las columnas en MAYÚSCULAS (ID, NOMBRE, etc).
// Esta función las convierte a minúsculas para que el frontend reciba objetos JSON limpios (id, nombre, correo, etc)
function filaAObjeto(fila) {
  if (!fila) return null;
  const objeto = {};
  for (const clave of Object.keys(fila)) {
    objeto[clave.toLowerCase()] = fila[clave];
  }
  return objeto;
}

function filasAObjetos(filas = []) {
  return filas.map(filaAObjeto);
}

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = { filaAObjeto, filasAObjetos, REGEX_CORREO };