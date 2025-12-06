const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { verificarAutenticacao } = require("../middleware/auth");

// Todas as rotas requerem autenticação
router.use(verificarAutenticacao);

// Listar despesas de um mês específico (via query string)
router.get("/mes", async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const usuarioId = req.session.usuarioId;

    const [despesas] = await db.query(
      `
            SELECT
                d.*,
                c.nome as categoria_nome,
                c.cor as categoria_cor,
                u.nome as usuario_nome
            FROM despesas d
            JOIN categorias c ON d.categoria_id = c.id
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE MONTH(d.data_pagamento) = ?
            AND YEAR(d.data_pagamento) = ?
            AND (d.usuario_id = ? OR d.dividida = TRUE)
            ORDER BY d.data_pagamento DESC, d.criado_em DESC
        `,
      [mes, ano, usuarioId]
    );

    // Calcular total
    let total = 0;
    despesas.forEach((d) => {
      if (d.dividida) {
        total += parseFloat(d.valor) / 2;
      } else if (d.usuario_id === usuarioId) {
        total += parseFloat(d.valor);
      }
    });

    res.json({ sucesso: true, despesas, total });
  } catch (erro) {
    console.error("Erro ao buscar despesas:", erro);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao buscar despesas" });
  }
});

// Listar despesas de um mês específico (via parâmetro de rota - mantido para compatibilidade)
router.get("/mes/:mes/:ano", async (req, res) => {
  try {
    const { mes, ano } = req.params;
    const usuarioId = req.session.usuarioId;

    const [despesas] = await db.query(
      `
            SELECT
                d.*,
                c.nome as categoria_nome,
                c.cor as categoria_cor,
                u.nome as usuario_nome
            FROM despesas d
            JOIN categorias c ON d.categoria_id = c.id
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE MONTH(d.data_pagamento) = ?
            AND YEAR(d.data_pagamento) = ?
            AND (d.usuario_id = ? OR d.dividida = TRUE)
            ORDER BY d.data_pagamento DESC, d.criado_em DESC
        `,
      [mes, ano, usuarioId]
    );

    // Calcular total
    let total = 0;
    despesas.forEach((d) => {
      if (d.dividida) {
        total += parseFloat(d.valor) / 2;
      } else if (d.usuario_id === usuarioId) {
        total += parseFloat(d.valor);
      }
    });

    res.json({ sucesso: true, despesas, total });
  } catch (erro) {
    console.error("Erro ao buscar despesas:", erro);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao buscar despesas" });
  }
});

// Listar despesas do mês atual (mantido para compatibilidade)
router.get("/mes-atual", async (req, res) => {
  try {
    const usuarioId = req.session.usuarioId;
    const [despesas] = await db.query(
      `
            SELECT
                d.*,
                c.nome as categoria_nome,
                c.cor as categoria_cor,
                u.nome as usuario_nome
            FROM despesas d
            JOIN categorias c ON d.categoria_id = c.id
            JOIN usuarios u ON d.usuario_id = u.id
            WHERE MONTH(d.data_pagamento) = MONTH(CURRENT_DATE())
            AND YEAR(d.data_pagamento) = YEAR(CURRENT_DATE())
            AND (d.usuario_id = ? OR d.dividida = TRUE)
            ORDER BY d.data_pagamento DESC, d.criado_em DESC
        `,
      [usuarioId]
    );

    // Calcular total
    let total = 0;
    despesas.forEach((d) => {
      if (d.dividida) {
        total += parseFloat(d.valor) / 2;
      } else if (d.usuario_id === usuarioId) {
        total += parseFloat(d.valor);
      }
    });

    res.json({ sucesso: true, despesas, total });
  } catch (erro) {
    console.error("Erro ao buscar despesas:", erro);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao buscar despesas" });
  }
});

// Buscar todas as categorias
router.get("/categorias", async (req, res) => {
  try {
    const [categorias] = await db.query(
      "SELECT * FROM categorias ORDER BY nome"
    );
    res.json({ sucesso: true, categorias });
  } catch (erro) {
    console.error("Erro ao buscar categorias:", erro);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao buscar categorias" });
  }
});

// Criar nova despesa
router.post("/criar", async (req, res) => {
  const {
    valor,
    pago,
    data_pagamento,
    descricao,
    categoria_id,
    tipo_despesa,
    dividida,
    total_parcelas,
  } = req.body;

  const usuarioId = req.session.usuarioId;

  try {
    if (tipo_despesa === "parcelada" && total_parcelas > 1) {
      // Criar despesa parcelada
      // O valor informado já é o valor de cada parcela
      const valorParcela = parseFloat(valor);
      const dataPagamento = new Date(data_pagamento);

      for (let i = 1; i <= total_parcelas; i++) {
        const dataParcela = new Date(dataPagamento);
        dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

        await db.query(
          `
                    INSERT INTO despesas
                    (usuario_id, valor, descricao, categoria_id, tipo_despesa,
                     data_pagamento, pago, dividida, parcela_atual, total_parcelas)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
          [
            usuarioId,
            valorParcela,
            `${descricao} (${i}/${total_parcelas})`,
            categoria_id,
            tipo_despesa,
            dataParcela.toISOString().split("T")[0],
            i === 1 ? (pago ? 1 : 0) : 0,
            dividida ? 1 : 0,
            i,
            total_parcelas,
          ]
        );
      }
    } else {
      // Criar despesa única ou fixa
      await db.query(
        `
                INSERT INTO despesas
                (usuario_id, valor, descricao, categoria_id, tipo_despesa,
                 data_pagamento, pago, dividida)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
        [
          usuarioId,
          valor,
          descricao,
          categoria_id,
          tipo_despesa,
          data_pagamento,
          pago ? 1 : 0,
          dividida ? 1 : 0,
        ]
      );
    }

    res.json({ sucesso: true, mensagem: "Despesa criada com sucesso" });
  } catch (erro) {
    console.error("Erro ao criar despesa:", erro);
    res.status(500).json({ sucesso: false, mensagem: "Erro ao criar despesa" });
  }
});

// Atualizar status de pagamento
router.put("/:id/pago", async (req, res) => {
  const { id } = req.params;
  const { pago } = req.body;
  const usuarioId = req.session.usuarioId;

  try {
    // Verificar se a despesa pertence ao usuário ou é dividida
    const [despesas] = await db.query(
      "SELECT * FROM despesas WHERE id = ? AND (usuario_id = ? OR dividida = TRUE)",
      [id, usuarioId]
    );

    if (despesas.length === 0) {
      return res
        .status(404)
        .json({ sucesso: false, mensagem: "Despesa não encontrada" });
    }

    await db.query("UPDATE despesas SET pago = ? WHERE id = ?", [
      pago ? 1 : 0,
      id,
    ]);

    res.json({ sucesso: true, mensagem: "Status atualizado com sucesso" });
  } catch (erro) {
    console.error("Erro ao atualizar status:", erro);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao atualizar status" });
  }
});

// Excluir despesa
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.session.usuarioId;

  try {
    const [despesas] = await db.query(
      "SELECT * FROM despesas WHERE id = ? AND usuario_id = ?",
      [id, usuarioId]
    );

    if (despesas.length === 0) {
      return res
        .status(404)
        .json({ sucesso: false, mensagem: "Despesa não encontrada" });
    }

    await db.query("DELETE FROM despesas WHERE id = ?", [id]);
    res.json({ sucesso: true, mensagem: "Despesa excluída com sucesso" });
  } catch (erro) {
    console.error("Erro ao excluir despesa:", erro);
    res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro ao excluir despesa" });
  }
});

module.exports = router;
