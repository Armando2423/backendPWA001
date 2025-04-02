require('dotenv').config({ path: './.env' }); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const webpush = require('web-push');
const path = require('path');
const { readFileSync } = require('fs');

// 📌 Importamos el modelo de usuario (incluye la suscripción)
const User = require('./models/User');

// 📌 Configuración de claves VAPID para Web Push
const keys_rute = path.resolve('keys.json');
const keys = JSON.parse(readFileSync(keys_rute, "utf-8"));

webpush.setVapidDetails(
  'mailto: sergio.reyes.21m@utzmg.edu.mx',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// 📌 Conexión con MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error en la conexión a MongoDB:", err));

/* -------------------- 🚀 Rutas -------------------- */

// 📌 Registro de usuario con contraseña encriptada
app.post('/register', async (req, res) => {
    try { 
      console.log("Datos recibidos:", req.body);
      const { name, app, apm, email, pwd } = req.body;

      if (!pwd) return res.status(400).json({ message: 'La contraseña es obligatoria' });

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'El correo ya está registrado' });

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(pwd, 10);

      const newUser = new User({ name, app, apm, email, pwd: hashedPassword });
      await newUser.save();
      console.log("Usuario guardado en la base de datos.");

      res.status(201).json({ message: 'Registro exitoso' });
    } catch (error) {
      console.error('❌ Error al registrar usuario:', error);
      res.status(500).json({ message: 'Error en el servidor' });
    }
});

// 📌 Login con comparación de contraseña encriptada
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.pwd);
    if (!isMatch) return res.status(401).json({ message: 'Contraseña incorrecta' });

    // Generar token con rol incluido
    const tokenPayload = { userId: user._id, email: user.email, rol: user.rol || 'user' };
    const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, { expiresIn: '1h' });

    res.json({ message: 'Inicio de sesión exitoso', token, rol: user.rol || 'user' });
  } catch (error) {
    console.error('❌ Error en el login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// 📌 Obtener usuarios registrados (sin mostrar contraseñas)
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-pwd');
    res.json(users);
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// 📌 Guardar suscripción en el usuario
app.post('/save_subscription', async (req, res) => {
  try {
      const { email, subscription } = req.body;
      if (!email || !subscription) return res.status(400).json({ message: "Faltan datos" });

      const user = await User.findOneAndUpdate(
          { email },
          { $set: { subscription } }, // 📌 Guardamos la suscripción dentro del usuario
          { new: true }
      );

      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

      res.status(200).json({ message: "Suscripción guardada con éxito" });
  } catch (error) {
      console.error("❌ Error al guardar la suscripción:", error);
      res.status(500).json({ message: "Error en el servidor" });
  }
});

// 📌 Enviar notificación push
app.post('/send_notification', async (req, res) => {
  try {
      const { email, title, body } = req.body;
      const user = await User.findOne({ email });

      if (!user || !user.subscription) return res.status(404).json({ message: "Usuario o suscripción no encontrada" });

      const payload = JSON.stringify({ title: String(title), body: String(body) });

      await webpush.sendNotification(user.subscription, payload)
          .catch(err => console.error('Error enviando notificación:', err));

      res.status(200).json({ message: "Notificación enviada con éxito" });
  } catch (error) {
      console.error("❌ Error al enviar la notificación:", error);
      res.status(500).json({ message: "Error en el servidor" });
  }
});

/* -------------------- 🚀 Servidor -------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto: ${PORT}`);
});
