const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
require("dotenv").config();

// EDITE AQUI: Adicione os usuários que deseja criar
const usuarios = [
  { usuario: "thiago", nome: "Thiago", senha: "thi102030" },
  { usuario: "vanessa", nome: "Vanessa", senha: "van102030" },
];

async function criarUsuarios() {
  let connection;

  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "despesas_domesticas",
      port: process.env.DB_PORT || 3306,
    });

    console.log("✅ Conectado ao banco de dados");

    for (const user of usuarios) {
      // Verificar se usuário já existe
      const [rows] = await connection.query(
        "SELECT id FROM usuarios WHERE usuario = ?",
        [user.usuario]
      );

      if (rows.length > 0) {
        console.log(`⚠️  Usuário "${user.usuario}" já existe, pulando...`);
        continue;
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(user.senha, 10);

      // Inserir usuário
      await connection.query(
        "INSERT INTO usuarios (usuario, nome, senha) VALUES (?, ?, ?)",
        [user.usuario, user.nome, senhaHash]
      );

      console.log(`✅ Usuário "${user.usuario}" criado com sucesso!`);
    }

    console.log("\n🎉 Processo concluído!");
    console.log("\n📋 Credenciais criadas:");
    usuarios.forEach((user) => {
      console.log(`   Usuário: ${user.usuario} | Senha: ${user.senha}`);
    });
    console.log("\n⚠️  IMPORTANTE: Altere as senhas após o primeiro login!");
  } catch (erro) {
    console.error("❌ Erro:", erro.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

criarUsuarios();
