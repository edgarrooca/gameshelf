require('dotenv').config();
const mongoose = require('mongoose');

// Script de migración para corregir índices de juegos
// Este script se ejecuta una sola vez para migrar de índice único global a índice compuesto por usuario

async function migrateIndexes() {
  try {
    console.log('🔄 Iniciando migración de índices...');

    // Conectar a MongoDB
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!MONGO_URI) {
      throw new Error('No se encontró MONGO_URI en las variables de entorno');
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener la colección de juegos
    const db = mongoose.connection.db;
    const collection = db.collection('games');

    console.log('🔍 Verificando índices existentes...');

    // Listar índices actuales
    const indexes = await collection.indexes();
    console.log('📋 Índices actuales:', indexes.map(idx => idx.name));

    // Buscar el índice problemático
    const oldIndex = indexes.find(idx => idx.name === 'title_1');
    const newIndex = indexes.find(idx => idx.name === 'owner_1_title_1');

    if (oldIndex) {
      console.log('🗑️ Eliminando índice único global problemático...');
      await collection.dropIndex('title_1');
      console.log('✅ Índice title_1 eliminado');
    } else {
      console.log('ℹ️ Índice title_1 no encontrado (ya eliminado)');
    }

    if (!newIndex) {
      console.log('🆕 Creando nuevo índice compuesto por usuario...');
      await collection.createIndex(
        { owner: 1, title: 1 },
        { unique: true, name: 'owner_1_title_1' }
      );
      console.log('✅ Nuevo índice owner_1_title_1 creado');
    } else {
      console.log('ℹ️ Índice owner_1_title_1 ya existe');
    }

    // Verificar índices finales
    const finalIndexes = await collection.indexes();
    console.log('📋 Índices finales:', finalIndexes.map(idx => idx.name));

    console.log('🎉 Migración completada exitosamente!');
    console.log('✅ Ahora múltiples usuarios pueden guardar los mismos juegos');

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar migración
migrateIndexes().then(() => {
  console.log('🏁 Script de migración finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
