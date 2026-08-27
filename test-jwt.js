const http = require('http');
const crypto = require('crypto');

// Crear un JWT simple a mano para pruebas
function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
const header = { alg: 'HS256', typ: 'JWT' };
const payload = { sub: 'auth-uuid-456', username: 'admin', role: 'ADMIN', exp: Math.floor(Date.now() / 1000) + (60 * 60) };

const encodedHeader = base64url(JSON.stringify(header));
const encodedPayload = base64url(JSON.stringify(payload));
const signatureInput = `${encodedHeader}.${encodedPayload}`;

const signature = crypto.createHmac('sha256', 'super_secret_key_change_in_prod')
  .update(signatureInput)
  .digest('base64')
  .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const token = `${signatureInput}.${signature}`;

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
  console.log('--- INICIANDO PRUEBAS DE SEGURIDAD Y NUEVOS MÓDULOS ---');

  // 1. Probar acceso denegado (Sin Token)
  console.log('\n-> GET /api/inventory/repuestos (SIN TOKEN)');
  let res = await request({ hostname: 'localhost', port: 3000, path: '/api/inventory/repuestos', method: 'GET' });
  console.log(`STATUS: ${res.status}`);
  console.log(`BODY:`, res.body);

  // 2. Probar acceso permitido (Con Token)
  console.log('\n-> GET /api/inventory/repuestos (CON TOKEN)');
  res = await request({ 
    hostname: 'localhost', 
    port: 3000, 
    path: '/api/inventory/repuestos', 
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`STATUS: ${res.status}`);
  
  // 3. Crear Cliente en Workshop Service a través de Gateway
  console.log('\n-> POST /api/workshop/clientes (CON TOKEN)');
  res = await request({ 
    hostname: 'localhost', 
    port: 3000, 
    path: '/api/workshop/clientes', 
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  }, { nombre: 'Juan Perez', telefono: '+56912345678' });
  console.log(`STATUS: ${res.status}`);
  console.log(`BODY:`, res.body);
  const clienteId = res.body?.id;

  if (clienteId) {
    // 4. Crear Vehículo asociado al Cliente
    console.log(`\n-> POST /api/workshop/vehiculos (CON TOKEN)`);
    res = await request({ 
      hostname: 'localhost', 
      port: 3000, 
      path: '/api/workshop/vehiculos', 
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    }, { vin: 'VIN123456789' + Date.now(), marca: 'Toyota', modelo: 'Corolla', ano: 2020, cliente_id: clienteId });
    console.log(`STATUS: ${res.status}`);
    console.log(`BODY:`, res.body);
    const vehiculoId = res.body?.id;

    if (vehiculoId) {
        // 5. Crear Orden de Trabajo
        console.log(`\n-> POST /api/workshop/ordenes-trabajo (CON TOKEN)`);
        res = await request({ 
          hostname: 'localhost', 
          port: 3000, 
          path: '/api/workshop/ordenes-trabajo', 
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }, { vehiculo_id: vehiculoId, mecanico_id: 'auth-uuid-456' });
        console.log(`STATUS: ${res.status}`);
        console.log(`BODY:`, res.body);
    }
  }

}

runTests();
