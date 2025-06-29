const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());


const mongoURI = 'mongodb://localhost:27017/helpdesk_db';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB'ye bağlanıldı"))
.catch(err => console.error("❌ MongoDB bağlantı hatası:", err));



const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: String, // "admin", "user"
  token: String,
});
const User = mongoose.model('User', userSchema);

const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdBy: String, 
  assignedTo: String, 
  status: { type: String, default: "Beklemede" },
  priority: String,
  dueDate: { type: Date, default: Date.now },
  responses: [
    {
      responder: String,
      message: String,
      date: Date,
      role: String,
    }
  ],
});
const Ticket = mongoose.model('Ticket', ticketSchema);


let supportQueue = [];

async function loadSupportQueue() {
  const supports = await User.find({ role: "admin" });
  supportQueue = supports.map(u => u.email);
}
loadSupportQueue();




app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Bu e-posta zaten kullanılıyor." });
    }

    const token = `token-${Date.now()}`;

    const newUser = new User({
      fullName,
      email,
      password,
      role: role === "support" ? "admin" : "user",
      token,
    });

    await newUser.save();

    if (newUser.role === "admin") {
      supportQueue.push(newUser.email);
    }

    res.status(201).json({ message: "Kayıt başarılı" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Kayıt sırasında hata oluştu." });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: "Hatalı e-posta veya şifre" });
    }
    res.json({
      token: user.token,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Giriş sırasında hata oluştu." });
  }
});


app.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.json(tickets);
  } catch (err) {
    console.error("Get tickets error:", err);
    res.status(500).json({ message: "Talepler alınamadı." });
  }
});


app.get('/tickets/assigned/:email', async (req, res) => {
  try {
    const assignedEmail = req.params.email;
    const assignedUser = await User.findOne({ email: assignedEmail });
    if (!assignedUser) return res.status(404).json({ message: "Destek personeli bulunamadı" });

    const tickets = await Ticket.find({ assignedTo: assignedUser.fullName });
    res.json(tickets);
  } catch (err) {
    console.error("Get assigned tickets error:", err);
    res.status(500).json({ message: "Talepler alınamadı." });
  }
});


app.get('/tickets/user/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    const user = await User.findOne({ email: userEmail });
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const tickets = await Ticket.find({ createdBy: user.fullName });
    res.json(tickets);
  } catch (err) {
    console.error("Get user tickets error:", err);
    res.status(500).json({ message: "Talepler alınamadı." });
  }
});

app.post('/tickets', async (req, res) => {
  try {
    const { title, priority, description, createdBy } = req.body;

    if (supportQueue.length === 0) {
      return res.status(500).json({ message: "Şu anda destek personeli yok." });
    }

   
    const user = await User.findOne({ email: createdBy });
    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı." });


    const assignedEmail = supportQueue.shift();
    supportQueue.push(assignedEmail);

    const assignedUser = await User.findOne({ email: assignedEmail });

    const newTicket = new Ticket({
      title,
      priority,
      description,
      createdBy: user.fullName,  // artık isim olarak kaydediliyor
      assignedTo: assignedUser ? assignedUser.fullName : assignedEmail,
      status: "Beklemede",
      dueDate: new Date(),
      responses: [],
    });

    await newTicket.save();

    res.status(201).json(newTicket);
  } catch (err) {
    console.error("Ticket creation error:", err);
    res.status(500).json({ message: "Backend hatası", error: err.message });
  }
});


app.post('/tickets/:id/respond', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { responderEmail, message } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Talep bulunamadı" });

    const responderUser = await User.findOne({ email: responderEmail });
    if (!responderUser) return res.status(404).json({ message: "Cevap veren kullanıcı bulunamadı" });

   
    if (ticket.assignedTo !== responderUser.fullName) {
      return res.status(403).json({ message: "Bu talebe cevap verme yetkiniz yok" });
    }

    ticket.responses.push({
      responder: responderUser.fullName,
      message,
      date: new Date(),
      role: responderUser.role,
    });

    ticket.status = "Açık";
    ticket.dueDate = new Date();

    await ticket.save();

    res.json({ message: "Cevap eklendi", ticket });
  } catch (err) {
    console.error("Add response error:", err);
    res.status(500).json({ message: "Cevap eklenirken hata oluştu." });
  }
});


app.post('/tickets/:id/resolve', async (req, res) => {
  try {
    const ticketId = req.params.id;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Talep bulunamadı" });

    ticket.status = "Kapalı";
    ticket.dueDate = new Date();

    await ticket.save();

    res.json({ message: "Talep kapatıldı", ticket });
  } catch (err) {
    console.error("Resolve ticket error:", err);
    res.status(500).json({ message: "Talep kapatılırken hata oluştu." });
  }
});

app.listen(port, () => {
  console.log(`✅ Help Desk API http://localhost:${port} üzerinde çalışıyor.`);
});
