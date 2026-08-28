const http = require('http');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(body) });
      });
    });

    req.on('error', e => reject(e));
    req.write(payload);
    req.end();
  });
}

async function runTest() {
  console.log('=== TEST DE AUTENTICACIÓN REAL ===');
  const user = {
    email: 'admin@tallersaas.com',
    password: 'passwordSegura123',
    nombre: 'Administrador Principal',
    rol: 'ADMIN'
  };

  try {
    console.log('[1] Registrando Usuario...');
    let res = await makeRequest('/api/auth/register', user);
    if (res.status === 201) {
      console.log('✅ Usuario registrado con éxito:', res.data.email);
    } else if (res.status === 400 && res.data.message === 'El usuario ya existe') {
      console.log('⚠️ Usuario ya existía, continuando...');
    } else {
      console.log('❌ Fallo al registrar usuario:', res);
      return;
    }

    console.log('\n[2] Iniciando Sesión...');
    res = await makeRequest('/api/auth/login', { email: user.email, password: user.password });
    if (res.status === 200 && res.data.access_token) {
      console.log('✅ Login exitoso! JWT Token recibido:');
      console.log(res.data.access_token);
      console.log('\nUsuario extraído:', res.data.user);
    } else {
      console.log('❌ Fallo al iniciar sesión:', res);
    }
  } catch(e) {
    console.log('Error en test:', e);
  }
}

runTest();
