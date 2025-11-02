const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

function loadUsersFromFile() {
  const fs = require('fs');
  const path = require('path');
  const tempUsersPath = path.join(__dirname, 'temp_users.json');

  try {
    if (fs.existsSync(tempUsersPath)) {
      return JSON.parse(fs.readFileSync(tempUsersPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error leyendo users:', error.message);
  }
  return [];
}

function saveUsersToFile(users) {
  const fs = require('fs');
  const path = require('path');
  const tempUsersPath = path.join(__dirname, 'temp_users.json');

  try {
    fs.writeFileSync(tempUsersPath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error guardando users:', error.message);
  }
}

let usersInMemory = loadUsersFromFile();
let userIdCounter = Math.max(...usersInMemory.map(u => parseInt(u._id.split('-')[1] || '0')), 0) + 1;

const generarToken = (userId, username) => {
  return jwt.sign(
    { _id: userId, username },
    process.env.JWT_SECRET || 'secreto_jwt',
    { expiresIn: '7d' }
  );
};

const registro = async (req, res, next) => {
  const { username, email, password, passwordConfirm } = req.body;

  if (password !== passwordConfirm) {
    logger.warn('Contraseñas no coinciden');
    return res.status(400).json({
      success: false,
      message: 'Las contraseñas no coinciden.'
    });
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const existe = await User.findOne({ $or: [{ email }, { username }] });
      if (existe) {
        return res.status(400).json({
          success: false,
          message: 'Usuario ya registrado.'
        });
      }

      const nuevoUsuario = new User({ username, email, password });
      await nuevoUsuario.save();

      const token = generarToken(nuevoUsuario._id, nuevoUsuario.username);
      return res.status(201).json({
        success: true,
        message: 'Usuario registrado.',
        token,
        usuario: nuevoUsuario.obtenerDatosPublicos()
      });
    } catch (error) {
      return next(error);
    }
  }

  // Modo demo
  try {
    const existe = usersInMemory.find(u => u.email === email || u.username === username);
    if (existe) {
      return res.status(400).json({
        success: false,
        message: 'Usuario ya registrado.'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const nuevoUsuario = {
      _id: `mem-${userIdCounter++}`,
      username,
      email,
      password: hash,
      avatar: null,
      bio: '',
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    usersInMemory.push(nuevoUsuario);
    saveUsersToFile(usersInMemory);

    const token = generarToken(nuevoUsuario._id, nuevoUsuario.username);
    return res.status(201).json({
      success: true,
      message: 'Usuario registrado (demo).',
      token,
      usuario: {
        _id: nuevoUsuario._id,
        username: nuevoUsuario.username,
        email: nuevoUsuario.email,
        avatar: nuevoUsuario.avatar,
        bio: nuevoUsuario.bio,
        isPublic: nuevoUsuario.isPublic,
        createdAt: nuevoUsuario.createdAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan credenciales.'
      });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        let usuario = await User.findOne({ email }).select('+password');
        if (!usuario) {
          usuario = await User.findOne({ username: email }).select('+password');
        }

        if (!usuario || !(await usuario.compararPassword(password))) {
          return res.status(401).json({
            success: false,
            message: 'Credenciales incorrectas.'
          });
        }

        const token = generarToken(usuario._id, usuario.username);
        return res.json({
          success: true,
          message: 'Login exitoso.',
          token,
          usuario: usuario.obtenerDatosPublicos()
        });
      } catch (error) {
        return next(error);
      }
    }

    // Modo demo
    try {
      let usuario = usersInMemory.find(u => u.email === email);
      if (!usuario) {
        usuario = usersInMemory.find(u => u.username === email);
      }

      if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas.'
        });
      }

      const token = generarToken(usuario._id, usuario.username);
      return res.json({
        success: true,
        message: 'Login exitoso (demo).',
        token,
        usuario: {
          _id: usuario._id,
          username: usuario.username,
          email: usuario.email,
          avatar: usuario.avatar,
          bio: usuario.bio,
          isPublic: usuario.isPublic,
          createdAt: usuario.createdAt
        }
      });
    } catch (error) {
      return next(error);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error en servidor.'
    });
  }
};

const obtenerPerfil = async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const usuario = await User.findById(req.usuario._id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.'
        });
      }
      return res.json({
        success: true,
        usuario: usuario.obtenerDatosPublicos()
      });
    } catch (error) {
      return next(error);
    }
  }

  // Modo demo
  try {
    const usuario = usersInMemory.find(u => u._id == req.usuario._id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }
    return res.json({
      success: true,
      usuario: {
        _id: usuario._id,
        username: usuario.username,
        email: usuario.email,
        avatar: usuario.avatar,
        bio: usuario.bio,
        isPublic: usuario.isPublic,
        createdAt: usuario.createdAt
      }
    });
  } catch (error) {
    return next(error);
  }
};



module.exports = {
  registro,
  login,
  obtenerPerfil
};
