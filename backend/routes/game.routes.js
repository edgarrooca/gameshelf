

const express = require('express');
const router = express.Router();

// Importa las funciones del controlador de juegos
const {
  createGame,
  getAllGames,
  getMyGames,
  getGameById,
  updateGameById,
  deleteGameById,
  searchGamesRAWG,
  getPopularGames,
  getExploreGames
} = require('../controllers/game.controller');

// Importa middleware de validación de datos
const { validateGameCreate, validateGameUpdate, validateSearch } = require('../middleware/validation');

// Importa middleware de autenticación requerido para operaciones privadas
const { verificarToken } = require('../middleware/auth');


// Obtener los juegos populares
// GET /api/games/popular
router.get('/popular', getPopularGames);

// Explorar juegos con filtros
// GET /api/games/explore
router.get('/explore', getExploreGames);

// Buscar juegos en la API de RAWG
// GET /api/games/search/:query
router.get('/search/:query', validateSearch, searchGamesRAWG);

// Crear un nuevo juego
// POST /api/games
router.post('/', verificarToken, validateGameCreate, createGame);

// Obtener todos los juegos
// GET /api/games
router.get('/', verificarToken, getAllGames);

// Obtener los juegos del usuario autenticado
// GET /api/games/my
router.get('/my', verificarToken, getMyGames);

// Obtener un juego específico por su ID
// GET /api/games/:id
router.get('/:id', verificarToken, getGameById);

// Actualizar un juego específico por su ID
// PUT /api/games/:id
router.put('/:id', verificarToken, validateGameUpdate, updateGameById);

// Eliminar un juego específico por su ID
// DELETE /api/games/:id
router.delete('/:id', verificarToken, deleteGameById);

// Ruta temporal para migración de índices (ejecutar una sola vez)
router.post('/migrate-indexes', async (req, res) => {
  try {
    console.log('🔄 Ejecutando migración de índices desde endpoint...');

    const Game = require('../models/game.model');
    const mongoose = require('mongoose');

    // Verificar conexión a BD
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ error: 'No hay conexión a MongoDB' });
    }

    const db = mongoose.connection.db;
    const collection = db.collection('games');

    // Listar índices actuales
    const indexes = await collection.indexes();
    console.log('📋 Índices actuales:', indexes.map(idx => idx.name));

    // Eliminar índice problemático
    const oldIndex = indexes.find(idx => idx.name === 'title_1');
    if (oldIndex) {
      console.log('🗑️ Eliminando índice title_1...');
      await collection.dropIndex('title_1');
      console.log('✅ Índice title_1 eliminado');
    }

    // Crear nuevo índice
    const newIndex = indexes.find(idx => idx.name === 'owner_1_title_1');
    if (!newIndex) {
      console.log('🆕 Creando índice owner_1_title_1...');
      await collection.createIndex(
        { owner: 1, title: 1 },
        { unique: true, name: 'owner_1_title_1' }
      );
      console.log('✅ Índice owner_1_title_1 creado');
    }

    // Verificar resultado
    const finalIndexes = await collection.indexes();
    console.log('📋 Índices finales:', finalIndexes.map(idx => idx.name));

    res.json({
      success: true,
      message: 'Migración completada',
      indexes: finalIndexes.map(idx => idx.name)
    });

  } catch (error) {
    console.error('❌ Error en migración:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Exporta el router para que pueda ser utilizado en el archivo principal del servidor
module.exports = router;
