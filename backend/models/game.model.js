const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Propietario requerido']
  },

  title: {
    type: String,
    required: [true, 'Título obligatorio']
  },

  platform: {
    type: String,
    required: [true, 'Plataforma obligatoria']
  },

  status: {
    type: String,
    required: [true, 'Estado obligatorio'],
    enum: ['Pendiente', 'Jugando', 'Completado']
  },

  coverImage: {
    type: String,
    trim: true
  },

  rating: {
    type: Number,
    min: 0,
    max: 10
  },

  genres: {
    type: [String],
    default: []
  },

  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Crear índice compuesto único: un usuario no puede tener juegos duplicados con el mismo título
gameSchema.index({ owner: 1, title: 1 }, { unique: true });

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
