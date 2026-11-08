/**
 * El Pistón — validación de asignación de mecánicos.
 * PocketBase v0.41.x. Ejecutar DESPUÉS de la migración inicial.
 * No borra datos ni modifica órdenes existentes.
 * Si ya existen órdenes sin mecánico, asígnales uno desde el panel
 * de PocketBase para que puedan seguir editándose normalmente.
 */
migrate((app) => {
  const ordenes = app.findCollectionByNameOrId("ordenes");
  const mecanico = ordenes.fields.getByName("mecanico");
  if (!mecanico) {
    throw new Error("No existe el campo ordenes.mecanico");
  }
  mecanico.required = true;

  // Los mecánicos pueden avanzar estados operativos, pero no marcar
  // una orden como entregada o cancelada. Esas acciones son de recepción.
  const controlEstado = '(@request.auth.rol != "mecanico" || (@request.body.estado:changed = false || (@request.body.estado != "entregada" && @request.body.estado != "cancelada")))';
  if (ordenes.updateRule && !ordenes.updateRule.includes('(@request.auth.rol != "mecanico" || (@request.body.estado:changed')) {
    // Se conserva la regla de permisos existente.
    ordenes.updateRule = `(${ordenes.updateRule}) && ${controlEstado}`;
  }
  app.save(ordenes);
});
