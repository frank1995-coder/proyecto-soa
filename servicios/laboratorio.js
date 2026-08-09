const express = require('express');
const pool = require('../db');
const app = express();
app.use(express.json());

// Crear orden de laboratorio con auditoría
app.post('/ordenes', async (req, res) => {
  const userId = req.headers['x-usuario-id'];
  if (!userId) return res.status(401).json({ codigoError: 'LAB-401', mensajeError: 'Sin usuario autenticado' });
  try {
    const id = 'LAB-' + Date.now().toString().slice(-6);
    await pool.query(
      `INSERT INTO ordenes_laboratorio (id_orden, id_paciente, registrado_por, examen, urgencia)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, req.body.idPaciente, userId, req.body.examen, req.body.urgencia || 'ROUTINE']
    );
    res.json({ idOrden: id, estado: 'RECEIVED' });
  } catch (e) {
    if (e.code === '23503') return res.status(404).json({ codigoError: 'LAB-404', mensajeError: 'Paciente no existe' });
    res.status(500).json({ codigoError: 'LAB-500', mensajeError: 'Error de base de datos' });
  }
});

// Consultar una orden
app.get('/ordenes/:id', async (req, res) => {
  const r = await pool.query('SELECT * FROM ordenes_laboratorio WHERE id_orden=$1', [req.params.id]);
  r.rows.length
    ? res.json(r.rows[0])
    : res.status(404).json({ codigoError: 'LAB-404', mensajeError: 'Orden no encontrada' });
});

app.listen(4004, () => console.log('✔ Servicio de Laboratorio (REST+PG) en :4004'));