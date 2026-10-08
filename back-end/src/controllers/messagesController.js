const db = require('../config/database');

// Listar Mensagens
exports.listMessages = async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM messages ORDER BY created_at ASC');
    const result = (rows || []).map(m => ({
      id: m.id,
      user_name: m.user_name,
      user_email: m.user_email,
      text: m.text,
      created_at: m.created_at
    }));
    return res.json(result);
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    return res.status(500).json({ error: 'Erro ao buscar mensagens.' });
  }
};

// Criar Mensagem
exports.createMessage = async (req, res) => {
  try {
    const { user_name, user_email, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Texto da mensagem é obrigatório.' });
    }

    const finalName = user_name || (req.user ? req.user.nome : 'Usuário Flora');
    const finalEmail = user_email || (req.user ? req.user.email : null);

    const result = await db.query(
      'INSERT INTO messages (user_name, user_email, text) VALUES (?, ?, ?)',
      [finalName, finalEmail, text.trim()]
    );

    const newMsg = {
      id: result.insertId,
      user_name: finalName,
      user_email: finalEmail,
      text: text.trim(),
      created_at: new Date().toISOString()
    };

    return res.status(201).json(newMsg);
  } catch (err) {
    console.error('Erro ao postar mensagem:', err);
    return res.status(500).json({ error: 'Erro ao postar mensagem.' });
  }
};
