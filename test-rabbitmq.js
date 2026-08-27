const http = require('http');

function makeRequest(options, postData = null) {
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
}

async function runTests() {
  console.log('--- INICIANDO PRUEBAS RABBITMQ ---');

  // 1. Crear un repuesto en el inventario con stock = 5
  console.log('\n[1] Creando Repuesto en Inventario (POST :3001/repuestos)');
  const resRepuesto = await makeRequest({
    hostname: 'localhost', port: 3001, path: '/repuestos', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    nombre: 'Filtro de Aceite Test',
    codigo_oem: 'FILT-' + Date.now(),
    precio_costo: 5000,
    precio_venta: 8000,
    stock: 5,
    is_active: true
  });
  console.log(`STATUS: ${resRepuesto.status}`);
  console.log(resRepuesto.body);
  const repuestoId = resRepuesto.body.id;

  // 2. Cambiar estado de la orden a LISTO_PARA_RETIRO para disparar WhatsApp (suponiendo orden 2)
  console.log('\n[2] Actualizando Estado a LISTO_PARA_RETIRO (PATCH :3002/ordenes-trabajo/2/estado)');
  const resEstado = await makeRequest({
    hostname: 'localhost', port: 3002, path: '/ordenes-trabajo/2/estado', method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, {
    estado: 'LISTO_PARA_RETIRO'
  });
  console.log(`STATUS: ${resEstado.status}`);
  console.log(resEstado.body);

  // 3. Añadir el repuesto a la orden, esto debería descontar stock y dejarlo en 4 (y disparar alerta_stock_bajo!)
  console.log('\n[3] Añadiendo Repuesto a la Orden (POST :3002/ordenes-trabajo/2/repuestos)');
  const resOrdenRepuesto = await makeRequest({
    hostname: 'localhost', port: 3002, path: '/ordenes-trabajo/2/repuestos', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    repuesto_id_inventario: repuestoId,
    origen: 'TALLER',
    precio_venta: 8000
  });
  console.log(`STATUS: ${resOrdenRepuesto.status}`);
  console.log(resOrdenRepuesto.body);

  console.log('\n--- PRUEBAS FINALIZADAS. REVISA LA TERMINAL PARA VER LOS LOGS DE RABBITMQ ---');
}

runTests();
