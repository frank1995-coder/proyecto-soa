DROP DATABASE IF EXISTS hospital;
CREATE DATABASE hospital;
\c hospital

-- ===== SERVICIO DE AUTENTICACIÓN =====
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  clave VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL
);

CREATE TABLE tokens (
  token VARCHAR(100) PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- ===== SERVICIO DE PACIENTES =====
CREATE TABLE pacientes (
  id_paciente VARCHAR(20) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  estado VARCHAR(20) DEFAULT 'ACTIVO',
  registrado_por INT REFERENCES usuarios(id)      
);

-- ===== SERVICIO DE HISTORIAS CLÍNICAS =====
-- ===== SERVICIO DE HISTORIAS CLÍNICAS =====
CREATE TABLE historias_clinicas (
  id SERIAL PRIMARY KEY,
  id_paciente VARCHAR(20) NOT NULL
    REFERENCES pacientes(id_paciente) ON DELETE CASCADE ON UPDATE CASCADE,
  registrado_por INT NOT NULL REFERENCES usuarios(id),  -- quién registró la historia
  fecha DATE NOT NULL,
  diagnostico TEXT
);
CREATE INDEX idx_historias_paciente ON historias_clinicas(id_paciente);
CREATE INDEX idx_historias_usuario  ON historias_clinicas(registrado_por);

-- ===== SERVICIO DE LABORATORIO =====
CREATE TABLE ordenes_laboratorio (
  id_orden VARCHAR(20) PRIMARY KEY,
  id_paciente VARCHAR(20) NOT NULL
    REFERENCES pacientes(id_paciente) ON DELETE CASCADE ON UPDATE CASCADE,
  registrado_por INT NOT NULL REFERENCES usuarios(id), 
  examen VARCHAR(100) NOT NULL,
  urgencia VARCHAR(10) DEFAULT 'ROUTINE',
  estado VARCHAR(20) DEFAULT 'RECEIVED',
  fecha TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_ordenes_paciente ON ordenes_laboratorio(id_paciente);
CREATE INDEX idx_ordenes_usuario  ON ordenes_laboratorio(registrado_por);

-- ===== VISTAS DE AUDITORÍA (¿quién registró qué y de quién?) =====

CREATE VIEW v_auditoria_historias AS
SELECT h.id, h.fecha, h.diagnostico,
       p.id_paciente, p.nombre || ' ' || p.apellido AS paciente,
       u.usuario AS registrado_por
FROM historias_clinicas h
JOIN pacientes p ON p.id_paciente = h.id_paciente
JOIN usuarios  u ON u.id = h.registrado_por;

CREATE VIEW v_auditoria_ordenes AS
SELECT o.id_orden, o.fecha, o.examen, o.urgencia, o.estado,
       p.id_paciente, p.nombre || ' ' || p.apellido AS paciente,
       u.usuario AS registrado_por
FROM ordenes_laboratorio o
JOIN pacientes p ON p.id_paciente = o.id_paciente
JOIN usuarios  u ON u.id = o.registrado_por;

-- ===== DATOS DE PRUEBA =====
INSERT INTO usuarios (usuario, clave, rol) VALUES
 ('dr.perez', '1234', 'MEDICO'),
 ('admin', 'admin', 'ADMIN');

INSERT INTO pacientes VALUES
 ('PAC-001', 'María', 'González', '1985-03-12', 'ACTIVO', 2),
 ('PAC-002', 'José', 'Ramírez', '1972-11-03', 'ACTIVO', 2);

INSERT INTO historias_clinicas (id_paciente, registrado_por, fecha, diagnostico) VALUES
 ('PAC-001', 1, '2026-07-10', 'E11.9 Diabetes tipo 2');

INSERT INTO ordenes_laboratorio (id_orden, id_paciente, registrado_por, examen, urgencia) VALUES
 ('LAB-001', 'PAC-001', 1, 'Hemograma completo', 'ROUTINE');