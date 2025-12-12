const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'sua-chave-secreta-muito-segura',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Mudar para true se usar HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Rotas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const despesasRoutes = require('./routes/despesas');

app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/despesas', despesasRoutes);

// Rota principal redireciona para login
app.get('/', (req, res) => {
    if (req.session && req.session.usuario) {
        res.redirect('/dashboard.html');
    } else {
        res.redirect('/login.html');
    }
});

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║   💰 Sistema de Controle de Despesas Domésticas   ║
╚═══════════════════════════════════════════════════╝

🚀 Servidor rodando em: http://localhost:${PORT}
📊 Acesse: http://localhost:${PORT}/login.html

✅ Servidor iniciado com sucesso!
    `);
});