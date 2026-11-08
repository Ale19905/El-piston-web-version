/**
 * El Pistón — esquema inicial para PocketBase v0.41.x.
 * Migración de configuración: NO contiene hooks ni endpoints propios.
 * Al hacer `pocketbase serve`, PocketBase ejecuta las migraciones pendientes.
 */
migrate((app) => {
  const autenticado = '@request.auth.id != "" && @request.auth.activo = true';
  const personal = `${autenticado} && (@request.auth.rol = "dueno" || @request.auth.rol = "recepcionista")`;
  const miOrden = `${autenticado} && (@request.auth.rol = "dueno" || @request.auth.rol = "recepcionista" || (@request.auth.rol = "mecanico" && mecanico = @request.auth.id))`;

  // El usuario del taller NO es superusuario. Solo el panel de PocketBase
  // debe crear empleados o cambiar sus roles.
  const users = app.findCollectionByNameOrId('users');
  users.fields.add(new TextField({ name: 'nombre', required: true, max: 100, presentable: true }));
  users.fields.add(new SelectField({ name: 'rol', required: true, maxSelect: 1, values: ['dueno', 'recepcionista', 'mecanico'] }));
  users.fields.add(new BoolField({ name: 'activo' }));
  users.listRule = autenticado;
  users.viewRule = autenticado;
  users.createRule = null;
  users.updateRule = null;
  users.deleteRule = null;
  users.manageRule = null;
  users.authRule = 'activo = true';
  app.save(users);

  const crear = (nombre, campos, reglas, indices = []) => {
    const coleccion = new Collection({
      type: 'base', name: nombre,
      listRule: reglas.list, viewRule: reglas.view,
      createRule: reglas.create, updateRule: reglas.update,
      deleteRule: reglas.delete === undefined ? null : reglas.delete,
      fields: campos, indexes: indices,
    });
    app.save(coleccion);
    return coleccion;
  };
  const txt = (name, required = false, max = 250) => ({ type: 'text', name, required, max });
  const num = (name, min = 0) => ({ type: 'number', name, onlyInt: true, min });
  const rel = (name, collection, required = true) => ({
    type: 'relation', name, required, maxSelect: 1,
    collectionId: collection.id, cascadeDelete: false,
  });
  const fecha = (name, required = false) => ({ type: 'date', name, required });

  const clientes = crear('clientes', [
    txt('nombre', true, 120), txt('telefono', true, 40), txt('direccion', false, 250),
  ], { list: autenticado, view: autenticado, create: personal, update: personal });

  const vehiculos = crear('vehiculos', [
    rel('cliente', clientes), txt('matricula', true, 25), txt('marca', true, 60),
    txt('modelo', true, 60), num('anio', 1900), num('kilometraje_ultimo', 0),
  ], { list: autenticado, view: autenticado, create: personal, update: personal }, [
    'CREATE UNIQUE INDEX idx_vehiculos_matricula ON vehiculos (matricula)',
  ]);

  const protegerMecanico = [
    '@request.body.vehiculo:changed = false',
    '@request.body.mecanico:changed = false',
    '@request.body.fecha_ingreso:changed = false',
    '@request.body.kilometraje_ingreso:changed = false',
    '@request.body.problema:changed = false',
    '@request.body.fecha_entrega:changed = false',
  ].join(' && ');
  const edicionOrden = `${personal} || (${autenticado} && @request.auth.rol = "mecanico" && mecanico = @request.auth.id && ${protegerMecanico})`;

  const ordenes = crear('ordenes', [
    rel('vehiculo', vehiculos), rel('mecanico', users, false),
    fecha('fecha_ingreso', true), num('kilometraje_ingreso', 0),
    txt('problema', true, 2000), txt('diagnostico', false, 2000),
    { type: 'select', name: 'estado', required: true, maxSelect: 1, values: ['recibida', 'diagnostico', 'reparacion', 'lista', 'entregada', 'cancelada'] },
    fecha('fecha_entrega'), txt('observaciones', false, 2000),
  ], { list: autenticado, view: autenticado, create: personal, update: edicionOrden });

  // Escrituras sobre trabajos y consumos: CRUD de dueño/recepción.
  // Mecánicos pueden crear registros, pero la pertenencia a su orden solo
  // se controla en la interfaz. Sin hooks no se garantiza esta validación
  // al escribir una relación nueva: ver LIMITACIONES.md.
  const crearDetalle = `${autenticado} && (@request.auth.rol = "dueno" || @request.auth.rol = "recepcionista" || @request.auth.rol = "mecanico")`;

  crear('trabajos', [
    rel('orden', ordenes), txt('descripcion', true, 350), num('precio_centavos', 0),
  ], { list: autenticado, view: autenticado, create: crearDetalle, update: personal });

  const repuestos = crear('repuestos', [
    txt('codigo', true, 60), txt('nombre', true, 120),
    num('precio_venta_centavos', 0),
    // INVENTARIO DERIVADO: unidades recibidas (inicial + reposiciones).
    // El stock disponible no se guarda en este registro; se calcula
    // restando el consumo acumulado de orden_repuestos.
    num('unidades_recibidas', 0), num('stock_minimo', 0),
    { type: 'bool', name: 'activo' },
  ], { list: autenticado, view: autenticado, create: personal, update: personal }, [
    'CREATE UNIQUE INDEX idx_repuestos_codigo ON repuestos (codigo)',
  ]);

  crear('orden_repuestos', [
    rel('orden', ordenes), rel('repuesto', repuestos),
    num('cantidad', 1), num('precio_unitario_centavos', 0),
  ], { list: autenticado, view: autenticado, create: crearDetalle, update: personal });

  crear('pagos', [
    rel('orden', ordenes), num('monto_centavos', 1), fecha('fecha_pago', true),
    { type: 'select', name: 'medio_pago', required: true, maxSelect: 1, values: ['efectivo', 'tarjeta', 'transferencia'] },
    txt('observaciones', false, 250),
  ], { list: personal, view: personal, create: personal, update: null });
}, (app) => {
  // Retroceso solo para entornos de prueba vacíos; NO usar con datos reales.
  ['pagos','orden_repuestos','repuestos','trabajos','ordenes','vehiculos','clientes'].forEach((nombre) => {
    const col = app.findCollectionByNameOrId(nombre);
    app.delete(col);
  });
  const users = app.findCollectionByNameOrId('users');
  ['nombre','rol','activo'].forEach((campo) => users.fields.removeByName(campo));
  users.listRule = null; users.viewRule = null;
  users.createRule = null; users.updateRule = null;
  users.deleteRule = null; users.manageRule = null; users.authRule = '';
  app.save(users);
});
