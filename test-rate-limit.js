const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/ping',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

let successCount = 0;
let error429Count = 0;

function makeRequest(index) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        if (res.statusCode === 429) {
          error429Count++;
        } else if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 401 || res.statusCode === 404) {
          successCount++;
        }
        if (res.statusCode !== 429 && res.statusCode !== 401 && res.statusCode !== 200 && res.statusCode !== 404) {
          console.log("Unexpected status:", res.statusCode);
        }
        if (successCount + error429Count === 1) console.log("First request status:", res.statusCode);
        resolve(res.statusCode);
      });
    });

    req.on('error', (e) => {
      resolve(500);
    });

    req.end();
  });
}

async function runTest() {
  console.log('Iniciando Test de Rate Limiting (110 peticiones concurrentes)...');
  const requests = [];
  
  for (let i = 0; i < 110; i++) {
    requests.push(makeRequest(i));
  }

  await Promise.all(requests);

  console.log('--- Resultados ---');
  console.log(`Peticiones Aceptadas (HTTP 200/201/401): ${successCount}`);
  console.log(`Peticiones Bloqueadas (HTTP 429 Too Many Requests): ${error429Count}`);

  if (error429Count > 0) {
    console.log('\n✅ ÉXITO: El Rate Limiting está funcionando correctamente y protegiendo el API Gateway.');
  } else {
    console.log('\n❌ ERROR: El Rate Limiting NO bloqueó las peticiones.');
  }
}

runTest();
