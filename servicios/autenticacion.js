const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const app = express();
app.use(express.json());


app.post('/login', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT id, rol FROM usuarios WHERE usuario=$1 AND clave=$2',
      [req.body.usuario, req.body.clave]
    );
    if (r.rows.length === 0)
      return res.status(401).json({ codigoError: 'AUTH-401', mensajeError: 'Credenciales inválidas' });

    const token = crypto.randomBytes(16).toString('hex');
    await pool.query('INSERT INTO tokens (token, usuario_id) VALUES ($1,$2)', [token, r.rows[0].id]);
    res.json({ token, rol: r.rows[0].rol });
  } catch (e) {
    res.status(500).json({ codigoError: 'AUTH-500', mensajeError: 'Error de base de datos' });
  }
});

app.get('/validar', async (req, res) => {
  const r = await pool.query('SELECT 1 FROM tokens WHERE token=$1', [req.query.token]);
  r.rows.length ? res.json({ valido: true }) : res.status(401).json({ valido: false });
});

app.listen(4001, () => console.log('✔ Servicio de Autenticación (REST+PG) en :4001'));