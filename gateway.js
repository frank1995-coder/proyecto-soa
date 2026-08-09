const express = require('express');
const soap = require('soap');
const app = express();
app.use(express.json());

// ===== REPOSITORIO DE SERVICIOS =====
const REPOSITORIO = {
  autenticacion: 'http://localhost:4001',
  pacientes: 'http://localhost:4002/pacientes',
  historias: 'http://localhost:4003',
  laboratorio: 'http://localhost:4004'
};

app.get('/servicios', (req, res) => res.json(REPOSITORIO));

// ===== MEDIACIÓN: seguridad centralizada =====
async function autenticado(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const r = await fetch(`${REPOSITORIO.autenticacion}/validar?token=${token}`);
    r.ok ? next() : res.status(401).json({ codigoError: 'GW-401', mensajeError: 'Token inválido' });
  } catch {
    res.status(503).json({ codigoError: 'GW-503', mensajeError: 'Servicio de autenticación caído' });
  }
}

// ===== MEDIACIÓN: enruta y transforma SOAP → JSON =====
app.get('/pacientes/:id', autenticado, async (req, res) => {
  try {
    const client = await soap.createClientAsync(`${REPOSITORIO.pacientes}?wsdl`);
    const [result] = await client.obtenerPacienteAsync({ idPaciente: req.params.id });
    res.json(result);
  } catch (e) {
    res.status(500).json({ codigoError: 'GW-500', mensajeError: 'Error consumiendo servicio SOAP' });
  }
});

app.get('/historias/:id', autenticado, async (req, res) => {
  const r = await fetch(`${REPOSITORIO.historias}/historias/${req.params.id}`);
  res.status(r.status).json(await r.json());
});

app.get('/laboratorio/ordenes/:id', autenticado, async (req, res) => {
  const r = await fetch(`${REPOSITORIO.laboratorio}/ordenes/${req.params.id}`);
  res.status(r.status).json(await r.json());
});

app.post('/laboratorio/ordenes', autenticado, async (req, res) => {
  const r = await fetch(`${REPOSITORIO.laboratorio}/ordenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  });
  res.status(r.status).json(await r.json());
});

app.listen(3000, () => console.log('ESB / API Gateway en :3000'));