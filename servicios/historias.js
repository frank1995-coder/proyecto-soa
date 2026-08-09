const express = require('express');
const pool = require('../db');
const app = express();
app.use(express.json());

// Consulta de historias clínicas de un paciente
app.get('/historias/:id', async (req, res) => {
  const r = await pool.query(
    'SELECT fecha, diagnostico FROM historias_clinicas WHERE id_paciente=$1 ORDER BY fecha DESC',
    [req.params.id]
  );
  r.rows.length
    ? res.json(r.rows)
    : res.status(404).json({ codigoError: 'HIS-404', mensajeError: 'Sin historia clínica' });
});

// Registro de historia clínica con auditoría (usuario inyectado por el gateway)
app.post('/historias', async (req, res) => {
  const userId = req.headers['x-usuario-id'];
  if (!userId) return res.status(401).json({ codigoError: 'HIS-401', mensajeError: 'Sin usuario autenticado' });
  try {
    const { idPaciente, fecha, diagnostico } = req.body;
    const r = await pool.query(
      `INSERT INTO historias_clinicas (id_paciente, registrado_por, fecha, diagnostico)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [idPaciente, userId, fecha, diagnostico]
    );
    res.json({ id: r.rows[0].id, registradoPorId: Number(userId) });
  } catch (e) {
    if (e.code === '23503') return res.status(404).json({ codigoError: 'HIS-404', mensajeError: 'Paciente o usuario no existe' });
    res.status(500).json({ codigoError: 'HIS-500', mensajeError: 'Error de base de datos' });
  }
});

app.listen(4003, () => console.log('✔ Servicio de Historias Clínicas (REST+PG) en :4003'));