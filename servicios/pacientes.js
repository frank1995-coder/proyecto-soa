const http = require('http');
const fs = require('fs');
const path = require('path');
const soap = require('soap');
const pool = require('../db');

const wsdl = fs.readFileSync(path.join(__dirname, '..', 'ServicioPacientes.wsdl'), 'utf8');

const servicio = {
  ServicioPacientes: {
    PacientesPort: {
      obtenerPaciente: (args, callback) => {
        pool.query('SELECT * FROM pacientes WHERE id_paciente=$1', [args.idPaciente])
          .then(r => {
            if (r.rows.length === 0)
              return callback(null, { codigoError: 'PAC-404', mensajeError: 'Paciente no encontrado' });
            const p = r.rows[0];
            callback(null, {
              idPaciente: p.id_paciente,
              nombre: p.nombre,
              apellido: p.apellido,
              fechaNacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.toISOString().slice(0, 10) : '',
              estado: p.estado
            });
          })
          .catch(e => callback(e));
      }
    }
  }
};

const server = http.createServer();
soap.listen(server, '/pacientes', servicio, wsdl);
server.listen(4002, () => console.log('Servicio de Pacientes (SOAP/XML+PG) en :4002'));