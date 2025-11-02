const Game = require('../models/game.model');
const axios = require('axios');
const logger = require('../config/logger');

let gamesInMemory = [];
let gameIdCounter = 1;

// Crear juego
const createGame = async (req, res, next) => {
  try {
    const gameData = { ...req.body, owner: req.usuario._id };
    console.log('🔍 Intentando crear juego:', gameData);

    try {
      const newGame = await Game.create(gameData);
      console.log('✅ Juego creado exitosamente:', newGame.title);
      res.status(201).json(newGame);
    } catch (mongoError) {
      console.error('❌ Error de MongoDB al crear juego:', mongoError.message);
      console.error('❌ Código de error:', mongoError.code);

      // Verificar si es un error de duplicado
      if (mongoError.code === 11000) {
        console.warn('⚠️ Intento de duplicado:', gameData.title);
        return res.status(409).json({
          message: 'Ya tienes este juego en tu biblioteca'
        });
      }

      // Si no es MongoDB disponible, guardar en memoria
      const newGame = {
        _id: gameIdCounter++,
        ...gameData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      gamesInMemory.push(newGame);
      console.log('💾 Juego guardado temporalmente: ' + newGame.title);
      res.status(201).json(newGame);
    }
  } catch (error) {
    console.error('💥 Error general al crear juego:', error.message);
    next(error);
  }
};

// Obtener todos los juegos
const getAllGames = async (req, res, next) => {
  try {
    try {
      const allGames = await Promise.race([
        Game.find({ owner: req.usuario._id }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB timeout')), 5000)
        )
      ]);
      res.status(200).json(allGames);
    } catch (mongoError) {
      const allGames = gamesInMemory.filter(g => g.owner === req.usuario._id);
      res.status(200).json(allGames);
    }
  } catch (error) {
    next(error);
  }
};

// Obtener mis juegos
const getMyGames = async (req, res, next) => {
  try {
    console.log('🔍 Consultando juegos del usuario:', req.usuario._id);

    try {
      const myGames = await Promise.race([
        Game.find({ owner: req.usuario._id }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB timeout')), 5000)
        )
      ]);

      console.log('📋 Juegos encontrados en MongoDB:', myGames.length);
      myGames.forEach(game => {
        console.log('  -', game.title, '(ID:', game._id, 'Owner:', game.owner, ')');
      });

      res.status(200).json(myGames);
    } catch (mongoError) {
      console.log('💾 MongoDB falló, usando memoria. Error:', mongoError.message);
      const myGames = gamesInMemory.filter(g => g.owner === req.usuario._id);
      console.log('📋 Juegos encontrados en memoria:', myGames.length);
      myGames.forEach(game => {
        console.log('  -', game.title, '(ID:', game._id, 'Owner:', game.owner, ')');
      });

      res.status(200).json(myGames);
    }
  } catch (error) {
    console.error('💥 Error general en getMyGames:', error.message);
    next(error);
  }
};

// Obtener juego por ID
const getGameById = async (req, res, next) => {
  try {
    try {
      const game = await Promise.race([
        Game.findById(req.params.id),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB timeout')), 5000)
        )
      ]);
      if (!game) {
        return res.status(404).json({ message: 'Juego no encontrado' });
      }
      if (game.owner.toString() !== req.usuario._id) {
        return res.status(403).json({ message: 'No tienes permiso para ver este juego' });
      }
      res.status(200).json(game);
    } catch (mongoError) {
      const game = gamesInMemory.find(g => g._id == req.params.id);
      if (!game) {
        return res.status(404).json({ message: 'Juego no encontrado' });
      }
      if (game.owner !== req.usuario._id) {
        return res.status(403).json({ message: 'No tienes permiso para ver este juego' });
      }
      res.status(200).json(game);
    }
  } catch (error) {
    next(error);
  }
};

// Actualizar juego
const updateGameById = async (req, res, next) => {
  try {
    try {
      const game = await Promise.race([
        Game.findById(req.params.id),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB timeout')), 5000)
        )
      ]);
      if (!game) {
        return res.status(404).json({ message: 'Juego no encontrado' });
      }
      if (game.owner.toString() !== req.usuario._id) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar este juego' });
      }
      const updatedGame = await Game.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.status(200).json(updatedGame);
    } catch (mongoError) {
      const gameIndex = gamesInMemory.findIndex(g => g._id == req.params.id);
      if (gameIndex === -1) {
        return res.status(404).json({ message: 'Juego no encontrado' });
      }
      const game = gamesInMemory[gameIndex];
      if (game.owner !== req.usuario._id) {
        return res.status(403).json({ message: 'No tienes permiso para actualizar este juego' });
      }
      gamesInMemory[gameIndex] = { ...game, ...req.body, updatedAt: new Date() };
      res.status(200).json(gamesInMemory[gameIndex]);
    }
  } catch (error) {
    next(error);
  }
};

// Eliminar juego
const deleteGameById = async (req, res, next) => {
  try {
    try {
      const game = await Promise.race([
        Game.findById(req.params.id),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB timeout')), 5000)
        )
      ]);
      if (!game) {
        return res.status(404).json({ message: 'Juego no encontrado' });
      }
      if (game.owner.toString() !== req.usuario._id) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar este juego' });
      }
      await Game.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Juego eliminado exitosamente' });
    } catch (mongoError) {
      const gameIndex = gamesInMemory.findIndex(g => g._id == req.params.id);
      if (gameIndex === -1) {
        return res.status(404).json({ message: 'Juego no encontrado' });
      }
      const game = gamesInMemory[gameIndex];
      if (game.owner !== req.usuario._id) {
        return res.status(403).json({ message: 'No tienes permiso para eliminar este juego' });
      }
      gamesInMemory.splice(gameIndex, 1);
      res.status(200).json({ message: 'Juego eliminado exitosamente' });
    }
  } catch (error) {
    next(error);
  }
};

// Buscar juegos en RAWG
const searchGamesRAWG = async (req, res, next) => {
  try {
    const { query } = req.params;
    const apiKey = process.env.RAWG_API_KEY;
    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${query}`;

    const response = await axios.get(url);

    // Unificar formato con getExploreGames para mostrar la misma información
    const searchGames = response.data.results.slice(0, 8).map(game => ({
      id: game.id,
      name: game.name,
      background_image: game.background_image || 'https://via.placeholder.com/400x500.png?text=No+Image',
      description: game.description || null,
      rating: game.rating || null,
      genres: game.genres ? game.genres.map(g => g.name) : [],
    }));

    res.status(200).json(searchGames);
  } catch (error) {
    logger.error('Error RAWG search: ' + error.message);
    next(error);
  }
};

// Obtener juegos para explorar
const getExploreGames = async (req, res, next) => {
  try {
    const { ordering = '-relevance', pageSize = 20, page = 1 } = req.query;

    const apiKey = process.env.RAWG_API_KEY;
    const maxPageSize = 50;
    const validPageSize = Math.min(parseInt(pageSize) || 20, maxPageSize);
    const validPage = parseInt(page) || 1;

    const url = `https://api.rawg.io/api/games?key=${apiKey}&ordering=${ordering}&page_size=${validPageSize}&page=${validPage}`;

    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: status => status === 200
    });

    let filteredResults = response.data.results;
    if (ordering === '-rating') {
      filteredResults = response.data.results.filter(game =>
        (game.rating || 0) >= 3.5 &&
        game.background_image &&
        game.background_image.startsWith('http') &&
        game.name &&
        game.name.trim() !== '' &&
        (game.metacritic || 0) >= 50
      );
    } else {
      filteredResults = response.data.results.filter(game =>
        game.background_image &&
        game.background_image.startsWith('http') &&
        game.name &&
        game.name.trim() !== ''
      );
    }

    const exploreGames = filteredResults.slice(0, validPageSize).map(game => ({
      id: game.id,
      name: game.name,
      background_image: game.background_image || 'https://via.placeholder.com/400x500.png?text=No+Image',
      description: game.description || null,
      rating: game.rating || null,
      genres: game.genres ? game.genres.map(g => g.name) : [],
    }));

    res.status(200).json(exploreGames);
  } catch (error) {
    logger.error('Error explore games: ' + error.message);

    const mockGames = [
      {
        id: 3498,
        name: 'Grand Theft Auto V',
        background_image: 'https://media.rawg.io/media/games/20a/20aa03ad8601e7f42a6050e3f51d3f6f.jpg',
        description: 'Juego de acción y aventura ambientado en el estado ficticio de San Andreas.',
        rating: 4.5,
        genres: ['Acción', 'Aventura'],
      },
    ];
    res.status(200).json(mockGames);
  }
};

// Obtener juegos populares
const getPopularGames = async (req, res, next) => {
  try {
    const apiKey = process.env.RAWG_API_KEY;
    const url = `https://api.rawg.io/api/games?key=${apiKey}&ordering=-relevance&page_size=15`;

    const response = await axios.get(url, { timeout: 10000, validateStatus: status => status === 200 });

    const filteredGames = response.data.results.filter(game =>
      (game.rating || 0) >= 4.0 && (game.metacritic || 0) >= 60
    );

    const popularGames = filteredGames.slice(0, 10).map(game => ({
      id: game.id,
      name: game.name,
      background_image: game.background_image,
      description: game.description || null,
      rating: game.rating || null,
      genres: game.genres ? game.genres.map(g => g.name) : [],
    }));

    res.status(200).json(popularGames);
  } catch (error) {
    logger.error('Error popular games: ' + error.message);

    const mockGames = [
      {
        id: 3498,
        name: 'Grand Theft Auto V',
        background_image: 'https://media.rawg.io/media/games/20a/20aa03ad8601e7f42a6050e3f51d3f6f.jpg',
        description: 'Juego de acción y aventura ambientado en el estado ficticio de San Andreas.',
        rating: 4.5,
        genres: ['Acción', 'Aventura'],
      },
      {
        id: 3328,
        name: 'The Witcher 3: Wild Hunt',
        background_image: 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg',
        description: 'Como Geralt de Rivia, un cazador de monstruos profesional, debes rastrear al niño de la profecía.',
        rating: 4.6,
        genres: ['RPG', 'Aventura'],
      },
    ];
    res.status(200).json(mockGames);
  }
};

// Exporta todas las funciones del controlador para ser usadas en las rutas
module.exports = {
  createGame,
  getAllGames,
  getMyGames,
  getGameById,
  updateGameById,
  deleteGameById,
  searchGamesRAWG,
  getPopularGames,
  getExploreGames,
  gamesInMemory, // Exportar para pruebas
  gameIdCounter, // Exportar para pruebas
};
