const http = require('http');

function makeRequest(path, method = 'POST', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
      });
    });

    req.on('error', e => reject(e));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTest() {
  console.log('=== TEST DE PANEL DE ADMIN ===');
  const user = {
    email: 'mecanico_test@tallersaas.com',
    password: 'password123',
    nombre: 'Mecanico Intruso'
  };

  try {
    console.log('\n[1] Intentando crear cuenta maestra desde registro público con "rol: ADMIN"...');
    await makeRequest('/api/auth/register', 'POST', { ...user, rol: 'ADMIN' });
    
    let res = await makeRequest('/api/auth/login', 'POST', { email: user.email, password: user.password });
    const mecanicoToken = res.data.access_token;
    console.log('Rol asignado realmente:', res.data.user.rol);
    if (res.data.user.rol !== 'USUARIO') {
      console.log('❌ El parche falló! Se le asignó ADMIN u otro rol.');
      return;
    } else {
      console.log('✅ El parche funcionó. Se forzó USUARIO.');
    }

    console.log('\n[2] Intentando acceder a /api/workshop/usuarios como USUARIO...');
    res = await makeRequest('/api/workshop/usuarios', 'GET', null, mecanicoToken);
    console.log('Status code:', res.status);
    if (res.status === 403) {
      console.log('✅ Correcto! El Guard bloqueó al MECANICO.');
    } else {
      console.log('❌ Fallo! El MECANICO pudo entrar o hubo otro error:', res);
      return;
    }

    console.log('\n[3] Logueando como ADMIN legitimo...');
    res = await makeRequest('/api/auth/login', 'POST', { email: 'admin@tallersaas.com', password: 'passwordSegura123' });
    const adminToken = res.data.access_token;
    
    console.log('\n[4] Listando usuarios desde cuenta ADMIN...');
    res = await makeRequest('/api/workshop/usuarios', 'GET', null, adminToken);
    if (res.status === 200) {
      console.log('✅ Correcto! El ADMIN pudo listar los usuarios.');
      console.log(res.data);
    } else {
      console.log('❌ Fallo! El ADMIN no pudo listar usuarios:', res);
    }
  } catch(e) {
    console.log('Error en test:', e);
  }
}

runTest();
