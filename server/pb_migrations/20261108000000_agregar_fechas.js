
migrate((app) => {
  const nombres = [
    "clientes",
    "vehiculos",
    "ordenes",
    "trabajos",
    "repuestos",
    "orden_repuestos",
    "pagos",
  ];

  for (const nombre of nombres) {
    const coleccion = app.findCollectionByNameOrId(nombre);
    let modificada = false;

    if (!coleccion.fields.getByName("created")) {
      coleccion.fields.add(new AutodateField({
        name: "created",
        onCreate: true,
        onUpdate: false,
      }));
      modificada = true;
    }

    if (!coleccion.fields.getByName("updated")) {
      coleccion.fields.add(new AutodateField({
        name: "updated",
        onCreate: true,
        onUpdate: true,
      }));
      modificada = true;
    }

    if (modificada) {
      app.save(coleccion);
    }
  }
});
