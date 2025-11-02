require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const gameRoutes = require('./routes/game.routes');
const authRoutes = require('./routes/auth.routes');
const logger = require('./config/logger');

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://gameshelf-lyart.vercel.app',
      'https://gameshelf-dusky.vercel.app',
      process.env.RENDER_EXTERNAL_URL,
      process.env.CORS_ORIGIN,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS rechazado: ${origin}`);
      callback(new Error('CORS no permite este origen'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => logger.info('MongoDB conectado'))
    .catch(err => {
      logger.warn('Error MongoDB: ' + err.message);
      logger.info('Modo demo activado');
    });
} else {
  logger.info('Sin MongoDB - modo demo');
}

// Crear usuario admin si no existe
(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const User = require('./models/user.model');
      const existe = await User.findOne({ email: 'admin@gameshelf.com' });

      if (!existe) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Admin123!', 10);

        const admin = new User({
          username: 'admin',
          email: 'admin@gameshelf.com',
          password: hash,
          isPublic: true
        });

        await admin.save();
        logger.info('Admin creado en MongoDB');
      }
    } else {
      const fs = require('fs');
      const pathUsers = path.join(__dirname, 'temp_users.json');

      let users = [];
      try {
        if (fs.existsSync(pathUsers)) {
          users = JSON.parse(fs.readFileSync(pathUsers, 'utf8'));
        }
      } catch (error) {
        logger.warn('Error leyendo users:', error.message);
      }

      const existe = users.find(u => u.email === 'admin@gameshelf.com');

      if (!existe) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('Admin123!', 10);

        const admin = {
          _id: `admin-${Date.now()}`,
          username: 'admin',
          email: 'admin@gameshelf.com',
          password: hash,
          avatar: null,
          bio: 'Admin demo',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        users.push(admin);

        try {
          fs.writeFileSync(pathUsers, JSON.stringify(users, null, 2));
          logger.info('Admin demo creado');
        } catch (error) {
          logger.error('Error guardando users:', error.message);
        }
      }
    }
  } catch (error) {
    logger.error('Error creando admin:', error.message);
  }
})();

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// Endpoints de diagnóstico
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Backend OK',
    apiUrl: process.env.VITE_API_URL,
    rawgKey: process.env.RAWG_API_KEY ? 'OK' : 'No',
    database: mongoose.connection.readyState === 1 ? 'OK' : 'No'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error('Error: ' + err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos.',
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Error en servidor.'
  });
});

// --- Inicio del Servidor ---
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  logger.info(`Servidor corriendo en puerto ${PORT}`);
  logger.info(`Entorno: ${NODE_ENV}`);
  logger.info('CORS habilitado para: localhost, Vercel y orígenes configurados');
});
