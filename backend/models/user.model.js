const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema de usuario
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Nombre de usuario obligatorio'],
    unique: [true, 'Nombre ya registrado'],
    trim: true,
    minlength: [3, 'Mínimo 3 caracteres'],
    maxlength: [30, 'Máximo 30 caracteres'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones']
  },

  email: {
    type: String,
    required: [true, 'Email obligatorio'],
    unique: [true, 'Email ya registrado'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },

  password: {
    type: String,
    required: [true, 'Contraseña obligatoria'],
    minlength: [6, 'Mínimo 6 caracteres'],
    select: false
  },

  avatar: {
    type: String,
    default: null
  },

  bio: {
    type: String,
    maxlength: [500, 'Máximo 500 caracteres'],
    default: ''
  },

  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hashear contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Métodos de instancia
userSchema.methods.compararPassword = async function(passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

userSchema.methods.obtenerDatosPublicos = function() {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    isPublic: this.isPublic,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);
module.exports = User;
