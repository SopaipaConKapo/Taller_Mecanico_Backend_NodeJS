const { execSync } = require('child_process');
const { Client } = require('pg');
const fs = require('fs');

async function createTenant(tenantName) {
  if (!tenantName) {
    console.error('Por favor, proporciona un nombre para el tenant (ej: TallerGomez)');
    process.exit(1);
  }

  const dbWorkshopName = `db_workshop_${tenantName.toLowerCase()}`;
  const dbInventoryName = `db_inventory_${tenantName.toLowerCase()}`;

  // Conexión genérica a postgres para crear bases de datos
  const client = new Client({
    connectionString: 'postgresql://root:rootpassword@localhost:5432/postgres'
  });

  try {
    await client.connect();

    console.log(`[1] Creando bases de datos para Tenant: ${tenantName}...`);
    // Las sentencias CREATE DATABASE no pueden estar en transacciones, así que las ejecutamos directamente
    try {
      await client.query(`CREATE DATABASE ${dbWorkshopName}`);
      console.log(`✅ Base de datos ${dbWorkshopName} creada.`);
    } catch (e) {
      if (e.code === '42P04') console.log(`⚠️ Base de datos ${dbWorkshopName} ya existe.`);
      else throw e;
    }

    try {
      await client.query(`CREATE DATABASE ${dbInventoryName}`);
      console.log(`✅ Base de datos ${dbInventoryName} creada.`);
    } catch (e) {
      if (e.code === '42P04') console.log(`⚠️ Base de datos ${dbInventoryName} ya existe.`);
      else throw e;
    }

    await client.end();

    console.log(`\n[2] Empujando esquemas (Prisma db push)...`);
    
    // Workshop DB push
    console.log(`\n-> Configurando Workshop...`);
    execSync(`npx prisma db push --schema=apps/workshop-service/prisma/schema.prisma`, {
      env: {
        ...process.env,
        DATABASE_URL: `postgresql://root:rootpassword@localhost:5432/${dbWorkshopName}?schema=public`
      },
      stdio: 'inherit'
    });

    // Inventory DB push
    console.log(`\n-> Configurando Inventory...`);
    execSync(`npx prisma db push --schema=apps/inventory-service/prisma/schema.prisma`, {
      env: {
        ...process.env,
        DATABASE_URL: `postgresql://root:rootpassword@localhost:5432/${dbInventoryName}?schema=public`
      },
      stdio: 'inherit'
    });

    // Crear .env del tenant
    const envContent = `
# Variables de Entorno Generadas para ${tenantName}
WORKSHOP_DATABASE_URL="postgresql://root:rootpassword@localhost:5432/${dbWorkshopName}?schema=public"
INVENTORY_DATABASE_URL="postgresql://root:rootpassword@localhost:5432/${dbInventoryName}?schema=public"
TENANT_ID="${tenantName}"
`;
    fs.writeFileSync(`.env.${tenantName.toLowerCase()}`, envContent.trim());
    
    console.log(`\n🎉 Tenant ${tenantName} aprovisionado correctamente.`);
    console.log(`Se generó el archivo .env.${tenantName.toLowerCase()} con sus credenciales.`);

  } catch (error) {
    console.error('❌ Error creando el tenant:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
createTenant(args[0]);
