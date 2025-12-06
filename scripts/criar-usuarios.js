const bcrypt = require("bcrypt");
const db = require("../config/database");

async function criarUsuarios() {
  try {
    // Hash das senhas
    const senhaHash1 = await bcrypt.hash("senha123", 10);
    const senhaHash2 = await bcrypt.hash("senha456", 10);

    // Criar primeiro usuário (você)
    await db.query(
      "INSERT INTO usuarios (nome, usuario, senha) VALUES (?, ?, ?)",
      ["Thiago", "thiago", senhaHash1]
    );
    console.log("✅ Usuário 1 criado com sucesso!");

    // Criar segundo usuário (sua esposa)
    await db.query(
      "INSERT INTO usuarios (nome, usuario, senha) VALUES (?, ?, ?)",
      ["Vanessa", "vanessa", senhaHash2]
    );
    console.log("✅ Usuário 2 criado com sucesso!");

    console.log("\n📋 Credenciais criadas:");
    console.log("Usuário 1: thiago / senha123");
    console.log("Usuário 2: vanessa / senha456");
    console.log("\n⚠️  IMPORTANTE: Altere essas senhas após o primeiro login!");
    console.log(
      "💡 DICA: Edite este arquivo para personalizar os nomes de usuário!"
    );

    process.exit(0);
  } catch (erro) {
    console.error("❌ Erro ao criar usuários:", erro);
    process.exit(1);
  }
}

criarUsuarios();
