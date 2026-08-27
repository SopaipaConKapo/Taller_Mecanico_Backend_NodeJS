const { PrismaClient } = require('@prisma/workshop-client');
const prisma = new PrismaClient();
const http = require('http');

const defaultHeaders = {
  'Content-Type': 'application/json'
};

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  console.log('=== TEST DEL MÓDULO DE COTIZACIONES ===\n');

  try {
    // 0. Seed CatalogoServicio
    let catalogo = await prisma.catalogoServicio.findFirst();
    if (!catalogo) {
      catalogo = await prisma.catalogoServicio.create({
        data: {
          nombre: 'Cambio de Pastillas de Freno',
          precio_base: 45000,
          is_combo: false
        }
      });
      console.log('[0] Seeded CatalogoServicio, ID:', catalogo.id);
    }

    // 1. Crear Cliente
    console.log('[1] Creando Cliente');
    const resCliente = await request(
      { hostname: 'localhost', port: 3002, path: '/clientes', method: 'POST', headers: defaultHeaders },
      { nombre: 'Cliente Cotización', telefono: '+56900002222' }
    );
    if (resCliente.status !== 201) throw new Error('Falló al crear cliente');

    // 2. Crear Vehículo
    console.log('[2] Creando Vehículo');
    const resVehiculo = await request(
      { hostname: 'localhost', port: 3002, path: '/vehiculos', method: 'POST', headers: defaultHeaders },
      { vin: 'VINCOTIZACION' + Math.floor(Math.random()*10000), marca: 'Honda', modelo: 'Civic', ano: 2020, cliente_id: resCliente.body.id }
    );
    if (resVehiculo.status !== 201) throw new Error('Falló al crear vehiculo');

    // 3. Crear Orden de Trabajo (estado CREADA)
    console.log('[3] Creando Orden de Trabajo');
    const resOrden = await request(
      { hostname: 'localhost', port: 3002, path: '/ordenes-trabajo', method: 'POST', headers: defaultHeaders },
      { vehiculo_id: resVehiculo.body.id }
    );
    if (resOrden.status !== 201) throw new Error('Falló al crear orden');
    const ordenId = resOrden.body.id;

    // 4. Mover Orden a EN_DIAGNOSTICO
    console.log('[4] Moviendo orden a EN_DIAGNOSTICO');
    await request(
      { hostname: 'localhost', port: 3002, path: `/ordenes-trabajo/${ordenId}/estado`, method: 'PATCH', headers: defaultHeaders },
      { estado: 'EN_DIAGNOSTICO' }
    );

    // 5. Crear la Cotización
    console.log('[5] Creando Cotización');
    const payloadCotizacion = {
      orden_id: ordenId,
      validez_dias: 7,
      observaciones: 'El vehículo necesita cambio de pastillas y discos.',
      servicios: [
        { servicio_id: catalogo.id, precio_estimado: 45000 }
      ],
      repuestos: [
        { nombre_repuesto: 'Pastillas de freno', cantidad: 1, precio_estimado: 35000 }
      ]
    };

    const resCotizacion = await request(
      { hostname: 'localhost', port: 3002, path: '/cotizaciones', method: 'POST', headers: defaultHeaders },
      payloadCotizacion
    );
    
    if (resCotizacion.status !== 201) throw new Error('Falló al crear la cotización: ' + JSON.stringify(resCotizacion.body));
    console.log('STATUS:', resCotizacion.status);
    console.log('Monto Calculado por el Backend:', resCotizacion.body.monto_total);
    const cotizacionId = resCotizacion.body.id;

    // 6. Aprobar la cotización
    console.log('[6] Aprobando la Cotización');
    const resAprobar = await request(
      { hostname: 'localhost', port: 3002, path: `/cotizaciones/${cotizacionId}/estado`, method: 'PATCH', headers: defaultHeaders },
      { estado: 'APROBADA' }
    );
    if (resAprobar.status !== 200) throw new Error('Falló al aprobar cotización');

    // 7. Verificar estado de la Orden de Trabajo
    console.log('[7] Verificando que la Orden cambió a ESPERANDO_REPUESTOS');
    const resCheckOrden = await request(
      { hostname: 'localhost', port: 3002, path: `/ordenes-trabajo/${ordenId}`, method: 'GET', headers: defaultHeaders }
    );
    console.log('ESTADO DE LA ORDEN AHORA:', resCheckOrden.body.estado);

    console.log('\n=== TEST COMPLETADO CON ÉXITO ===');
  } catch (error) {
    console.error('\nERROR DURANTE EL TEST:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
