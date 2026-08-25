
import { PrismaClient as WorkshopClient } from '@prisma/workshop-client';
import { PrismaClient as InventoryClient } from '@prisma/inventory-client';

async function main() {
  const workshop = new WorkshopClient({
    datasourceUrl: 'postgresql://root:rootpassword@localhost:5432/db_taller?schema=public'
  });
  const inventory = new InventoryClient({
    datasourceUrl: 'postgresql://root:rootpassword@localhost:5433/db_inventario?schema=public'
  });

  console.log('--- Creando Repuesto en Inventario ---');
  const repuesto = await inventory.repuesto.create({
    data: {
      nombre: 'Pastillas de Freno',
      codigo_oem: 'BRK-001',
      precio_costo: 25.0,
      precio_venta: 50.0,
      stock: 20,
    }
  });
  console.log('Repuesto creado:', repuesto.nombre);

  console.log('\n--- Creando Cliente y Vehiculo en Taller ---');
  const cliente = await workshop.cliente.create({
    data: {
      nombre: 'Maria Lopez',
      telefono: '987654321',
      vehiculos: {
        create: {
          vin: 'VIN987654321',
          marca: 'Honda',
          modelo: 'Civic',
          ano: 2021
        }
      }
    },
    include: { vehiculos: true }
  });
  console.log('Cliente y Vehiculo creados:', cliente.nombre, cliente.vehiculos[0].vin);

  console.log('\n--- Creando Orden de Trabajo ---');
  const orden = await workshop.ordenTrabajo.create({
    data: {
      vehiculo_id: cliente.vehiculos[0].id,
      estado: 'CREADA'
    }
  });
  console.log('Orden creada con ID:', orden.id);

  console.log('\n--- Agregando Repuesto a la Orden ---');
  const ordenRepuesto = await workshop.ordenTrabajoRepuesto.create({
    data: {
      orden_id: orden.id,
      repuesto_id_inventario: repuesto.id,
      origen: 'TALLER',
      precio_venta: repuesto.precio_venta,
      estado_abastecimiento: 'EN_STOCK'
    }
  });
  console.log('Repuesto asignado a orden:', ordenRepuesto.id);

  console.log('\n? Datos de prueba generados exitosamente.');
}

main().catch(console.error);

