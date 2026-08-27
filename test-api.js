const http = require('http');

const request = (options, postData) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function runTests() {
  console.log('--- INICIANDO PRUEBAS DE MICROSERVICIOS ---');

  try {
    // INVENTORY SERVICE (PORT 3001)
    console.log('\n[1] Probando Inventory Service (Port 3001) - CRUD Repuestos');
    
    // Create
    console.log('-> POST /repuestos');
    let repuestoData = {
      nombre: 'Filtro de Aceite Test',
      codigo_oem: 'FL-TEST-' + Date.now(),
      precio_costo: 5.5,
      precio_venta: 12.0,
      stock: 50
    };
    let res = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/repuestos',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, repuestoData);
    console.log(`STATUS: ${res.status}`);
    console.log(`BODY:`, res.body);
    const repuestoId = res.body?.id;

    if (repuestoId) {
      // Read
      console.log(`\n-> GET /repuestos/${repuestoId}`);
      res = await request({ hostname: 'localhost', port: 3001, path: `/repuestos/${repuestoId}`, method: 'GET' });
      console.log(`STATUS: ${res.status}`);

      // Read All
      console.log(`\n-> GET /repuestos`);
      res = await request({ hostname: 'localhost', port: 3001, path: `/repuestos`, method: 'GET' });
      console.log(`STATUS: ${res.status}, COUNT: ${Array.isArray(res.body) ? res.body.length : 'N/A'}`);

      // Update
      console.log(`\n-> PATCH /repuestos/${repuestoId}`);
      res = await request({
        hostname: 'localhost',
        port: 3001,
        path: `/repuestos/${repuestoId}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      }, { precio_venta: 15.0 });
      console.log(`STATUS: ${res.status}`);

      // Update Stock
      console.log(`\n-> POST /repuestos/${repuestoId}/stock`);
      res = await request({
        hostname: 'localhost',
        port: 3001,
        path: `/repuestos/${repuestoId}/stock`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { cantidad: 5, tipoMovimiento: 'SALIDA' });
      console.log(`STATUS: ${res.status}`);

      // Delete (Soft Delete)
      console.log(`\n-> DELETE /repuestos/${repuestoId}`);
      res = await request({ hostname: 'localhost', port: 3001, path: `/repuestos/${repuestoId}`, method: 'DELETE' });
      console.log(`STATUS: ${res.status}`);
    }

    // WORKSHOP SERVICE (PORT 3002)
    console.log('\n[2] Probando Workshop Service (Port 3002) - CRUD Ordenes de Trabajo');
    
    console.log('-> POST /ordenes-trabajo');
    // Note: This requires a vehiculo to exist. We might get a foreign key error since we don't create a vehicle first!
    res = await request({
      hostname: 'localhost',
      port: 3002,
      path: '/ordenes-trabajo',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { vehiculo_id: 1, mecanico_id: 'mech-123' });
    console.log(`STATUS: ${res.status}`);
    console.log(`BODY:`, res.body);

    const ordenId = res.body?.id;

    if (ordenId) {
      console.log(`\n-> PATCH /ordenes-trabajo/${ordenId}/estado`);
      res = await request({
        hostname: 'localhost',
        port: 3002,
        path: `/ordenes-trabajo/${ordenId}/estado`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      }, { estado: 'EN_DIAGNOSTICO' });
      console.log(`STATUS: ${res.status}`);
    } else {
      console.log('\n[!] Note: POST /ordenes-trabajo might have failed because vehiculo_id = 1 does not exist yet.');
    }

    console.log('\n--- PRUEBAS FINALIZADAS ---');
  } catch (err) {
    console.error('Error during testing:', err.message);
  }
}

runTests();
