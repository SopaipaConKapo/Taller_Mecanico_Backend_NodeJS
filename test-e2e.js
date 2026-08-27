const http = require('http');
const crypto = require('crypto');

// Generate JWT manually
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

const defaultHeaders = { 
  'Authorization': `Bearer ${token}`, 
  'Content-Type': 'application/json' 
};

async function runTests() {
  console.log('=== E2E SYSTEM TEST (API GATEWAY -> MICROSERVICES -> RABBITMQ) ===\n');

  try {
    // 1. Crear un repuesto (Inventory Service vía Puerto 3001)
    console.log('[1] Creando Repuesto en Inventario (POST :3001/repuestos)');
    const resRepuesto = await request({ 
      hostname: 'localhost', port: 3001, path: '/repuestos', method: 'POST', headers: defaultHeaders 
    }, {
      nombre: 'Filtro de Aceite Test E2E',
      codigo_oem: 'FILT-E2E-' + Date.now(),
      precio_costo: 5000,
      precio_venta: 8000,
      stock: 5,
      is_active: true
    });
    console.log(`STATUS: ${resRepuesto.status}`);
    if (resRepuesto.status >= 400) {
      console.log('BODY ERROR:', resRepuesto.body);
    }
    const repuestoId = resRepuesto.body?.id;
    if (!repuestoId) throw new Error("No se pudo crear repuesto");

    // 2. Crear Cliente (Workshop Service vía Puerto 3002)
    console.log('\n[2] Creando Cliente (POST :3002/clientes)');
    const resCliente = await request({ 
      hostname: 'localhost', port: 3002, path: '/clientes', method: 'POST', headers: defaultHeaders 
    }, { nombre: 'Matias E2E', telefono: '+56900001111' });
    console.log(`STATUS: ${resCliente.status}`);
    const clienteId = resCliente.body?.id;
    if (!clienteId) throw new Error("No se pudo crear cliente");

    // 3. Crear Vehículo
    console.log('\n[3] Creando Vehículo (POST :3002/vehiculos)');
    const resVehiculo = await request({ 
      hostname: 'localhost', port: 3002, path: '/vehiculos', method: 'POST', headers: defaultHeaders 
    }, { vin: 'VINE2E' + Date.now(), marca: 'Ford', modelo: 'Ranger', ano: 2024, cliente_id: clienteId });
    console.log(`STATUS: ${resVehiculo.status}`);
    const vehiculoId = resVehiculo.body?.id;
    if (!vehiculoId) throw new Error("No se pudo crear vehiculo");

    // 4. Crear Orden de Trabajo
    console.log('\n[4] Creando Orden de Trabajo (POST :3002/ordenes-trabajo)');
    const resOrden = await request({ 
      hostname: 'localhost', port: 3002, path: '/ordenes-trabajo', method: 'POST', headers: defaultHeaders 
    }, { vehiculo_id: vehiculoId, mecanico_id: 'auth-uuid-456' });
    console.log(`STATUS: ${resOrden.status}`);
    const ordenId = resOrden.body?.id;
    if (!ordenId) throw new Error("No se pudo crear orden");

    // 5. Añadir Repuesto a la Orden (Debería disparar evento a RabbitMQ para descontar stock)
    console.log(`\n[5] Añadiendo Repuesto (ID: ${repuestoId}) a Orden (ID: ${ordenId})`);
    const resRepuestoOrden = await request({ 
      hostname: 'localhost', port: 3002, path: `/ordenes-trabajo/${ordenId}/repuestos`, method: 'POST', headers: defaultHeaders 
    }, {
      repuesto_id_inventario: repuestoId,
      origen: 'TALLER',
      precio_venta: 8000
    });
    console.log(`STATUS: ${resRepuestoOrden.status}`);

    // 6. Cambiar Estado a LISTO_PARA_RETIRO (Debería disparar evento a RabbitMQ para WhatsApp)
    console.log(`\n[6] Cambiando estado de Orden (ID: ${ordenId}) a LISTO_PARA_RETIRO`);
    const resEstado = await request({ 
      hostname: 'localhost', port: 3002, path: `/ordenes-trabajo/${ordenId}/estado`, method: 'PATCH', headers: defaultHeaders 
    }, {
      estado: 'LISTO_PARA_RETIRO'
    });
    console.log(`STATUS: ${resEstado.status}`);

    console.log('\n=== E2E TEST COMPLETED SUCESSFULLY ===');
    console.log('Revisa las terminales de los microservicios para ver los logs de RabbitMQ.');
  } catch (error) {
    console.error('\nERROR DURANTE EL TEST E2E:', error);
  }
}

runTests();
