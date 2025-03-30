require('dotenv').config({path: './.env'}); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const webpush = require('web-push');
const User = require('./models/Users');
const Subscription = require('./models/Suscription'); 
/* const TempID = require('./models/TempID'); */

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

webpush.setVapidDetails(
  'mailto: sergio.reyes.21m@utzmg.edu.mx',
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY,
)

const uri = process.env.MONGO_URI;

// Conexión con mongoose
mongoose.connect(uri)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error en la conexión a MongoDB:", err));

// 🚀 Registro de usuario con contraseña encriptada
app.post('/register', async (req, res) => {
    try { 
      console.log("Datos recibidos:", req.body);
      const { name, app, apm, email, pwd } = req.body;
  
      if (!pwd) {
        return res.status(400).json({ message: 'La contraseña es obligatoria' });
      }
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'El correo ya está registrado' });
      }
  
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
  

// 🚀 Login con comparación de contraseña encriptada
app.post('/login', async (req, res) => {
   
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log('Rol enviado al frontend:', user.rol);

    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.pwd);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Generar token incluyendo el rol si existe
    const tokenPayload = { userId: user._id, email: user.email, rol: user.rol || 'user' };
    const token = jwt.sign(tokenPayload, process.env.SECRET_KEY, { expiresIn: '1h' });

    res.json({ message: 'Inicio de sesión exitoso', token, rol: user.rol || 'user' });
  } catch (error) {
    console.error('❌ Error en el login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});


// 📌 Ver usuarios registrados (sin mostrar contraseñas)
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-pwd');
    res.json(users);
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
}); 

// Ruta para guardar la suscripción en la base de datos
app.post('/send-notification', async (req, res) => {
  try {
      const { title, body } = req.body;
      const subscriptions = await Subscription.find(); // Obtiene todas las suscripciones

      if (!subscriptions.length) {
          return res.status(404).json({ message: "No hay suscriptores registrados" });
      }

      const payload = JSON.stringify({ title, body });

      const sendPromises = subscriptions.map(subscription =>
          webpush.sendNotification(subscription, payload).catch(err => console.error('Error enviando notificación:', err))
      );

      await Promise.all(sendPromises);

      res.status(200).json({ message: "Notificación enviada con éxito" });
  } catch (error) {
      console.error("❌ Error al enviar la notificación:", error);
      res.status(500).json({ message: "Error en el servidor" });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Servidor personal corriendo en puerto: ${PORT}`);
}); 