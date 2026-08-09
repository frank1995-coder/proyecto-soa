async function main() {
  const h = { 'Content-Type': 'application/json' };

  // Autenticacion
  const login = await fetch('http://localhost:4001/login', {
    method: 'POST', headers: h,
    body: JSON.stringify({ usuario: 'dr.perez', clave: '1234' })
  }).then(r => r.json());
  console.log('1) Token:', login.token);
  h.Authorization = 'Bearer ' + login.token;

  //Paciente (SOAP por dentro, JSON por fuera , mediación)
  const pac = await fetch('http://localhost:3000/pacientes/PAC-001', 
    { headers: h }).then(r => r.json());
  console.log('2) Paciente:', pac);

  //Orden de laboratorio (flujo transaccional)
  const ord = await fetch('http://localhost:3000/laboratorio/ordenes', {
    method: 'POST', headers: h,
    body: JSON.stringify({ idPaciente: 'PAC-001', examen: 'Glucosa en ayunas', urgencia: 'ROUTINE' })
  }).then(r => r.json());
  console.log('3) Orden:', ord);

  //Historia clínica
  const his = await fetch('http://localhost:3000/historias/PAC-001', 
     { headers: h }).then(r => r.json());
  console.log('4) Historia:', his);
}
main();