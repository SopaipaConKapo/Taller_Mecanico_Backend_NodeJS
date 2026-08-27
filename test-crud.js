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
  console.log('--- INICIANDO PRUEBAS CRUD (WORKSHOP SERVICE - PORT 3002) ---');

  try {
    // 1. Crear Cliente
    console.log('\n[1] Creando Cliente (POST /clientes)');
    let res = await request({
      hostname: 'localhost',
      port: 3002,
      path: '/clientes',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { nombre: 'Matias Fernandez', telefono: '+56900112233', auth_id: 'auth-user-999' });
    console.log(`STATUS: ${res.status}`);
    console.log(`BODY:`, res.body);
    const clienteId = res.body?.id;

    if (clienteId) {
      // 2. Obtener Clientes
      console.log('\n[2] Obteniendo Clientes (GET /clientes)');
      res = await request({ hostname: 'localhost', port: 3002, path: '/clientes', method: 'GET' });
      console.log(`STATUS: ${res.status}, COUNT: ${Array.isArray(res.body) ? res.body.length : 'N/A'}`);

      // 3. Crear Vehículo
      console.log('\n[3] Creando Vehículo (POST /vehiculos)');
      res = await request({
        hostname: 'localhost',
        port: 3002,
        path: '/vehiculos',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { vin: 'ABCD123456789' + Date.now(), marca: 'Ford', modelo: 'Mustang', ano: 2021, cliente_id: clienteId });
      console.log(`STATUS: ${res.status}`);
      console.log(`BODY:`, res.body);
      const vehiculoId = res.body?.id;

      if (vehiculoId) {
        // 4. Obtener Vehículos
        console.log('\n[4] Obteniendo Vehículos (GET /vehiculos)');
        res = await request({ hostname: 'localhost', port: 3002, path: '/vehiculos', method: 'GET' });
        console.log(`STATUS: ${res.status}, COUNT: ${Array.isArray(res.body) ? res.body.length : 'N/A'}`);

        // 5. Crear Orden de Trabajo (El que antes fallaba)
        console.log('\n[5] Creando Orden de Trabajo (POST /ordenes-trabajo)');
        res = await request({
          hostname: 'localhost',
          port: 3002,
          path: '/ordenes-trabajo',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, { vehiculo_id: vehiculoId, mecanico_id: 'mech-master-1' });
        console.log(`STATUS: ${res.status}`);
        console.log(`BODY:`, res.body);
      }
    }
    console.log('\n--- PRUEBAS FINALIZADAS ---');
  } catch (err) {
    console.error('Error during testing:', err.message);
  }
}

runTests();
