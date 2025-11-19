// ============================================================================
// SISTEMA DE HISTORIAS CLÍNICAS DEPORTIVAS - INDER HUILA
// Desarrollado por: Wilcas
// ============================================================================

const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const PORT = 5001; // Puerto fijo para evitar conflictos
const JWT_SECRET = process.env.JWT_SECRET || 'inder_huila_secret_key';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================================================

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'inder_huila_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Cambulosm2009', // Cambiar la contraseña por la que pongan en base de datos postgres recominedo la misma
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
    console.log('✓ Conexión exitosa a PostgreSQL');
});

pool.on('error', (err) => {
    console.error('Error en la base de datos:', err);
});

// Helper para queries
const query = async (text, params) => {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (error) {
        console.error('Error en query:', error.message);
        throw error;
    }
};

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================================================

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                error: true,
                message: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const result = await query(
            'SELECT id, nombre_completo, email, rol, especialidad FROM usuarios WHERE id = $1 AND activo = true',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: true,
                message: 'Usuario no autorizado'
            });
        }

        req.usuario = result.rows[0];
        next();
    } catch (error) {
        return res.status(401).json({
            error: true,
            message: 'Token inválido o expirado'
        });
    }
};

// Middleware para roles específicos
const requireRole = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                error: true,
                message: 'Usuario no autenticado'
            });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                error: true,
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
};

// ============================================================================
// RUTA PRINCIPAL
// ============================================================================

app.get('/', (req, res) => {
    res.json({
        message: 'API Sistema de Historias Clínicas Deportivas - INDER Huila',
        version: '1.0.0',
        developer: 'Wilcas',
        status: 'online'
    });
});

// ============================================================================
// RUTAS DE AUTENTICACIÓN
// ============================================================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: true,
                message: 'Email y contraseña son requeridos'
            });
        }

        const result = await query(
            'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: true,
                message: 'Credenciales inválidas'
            });
        }

        const usuario = result.rows[0];

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, usuario.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                error: true,
                message: 'Credenciales inválidas'
            });
        }

        // Actualizar última sesión
        await query(
            'UPDATE usuarios SET ultima_sesion = CURRENT_TIMESTAMP WHERE id = $1',
            [usuario.id]
        );

        // Generar token
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol: usuario.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        delete usuario.password_hash;

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            token,
            usuario
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            error: true,
            message: 'Error al iniciar sesión'
        });
    }
});

// Verificar token
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
    res.json({
        success: true,
        usuario: req.usuario
    });
});

// ============================================================================
// RUTAS DE DEPORTISTAS
// ============================================================================

// Obtener todos los deportistas
app.get('/api/deportistas', authMiddleware, async (req, res) => {
    try {
        const { activo, disciplina_id, buscar } = req.query;
        
        let queryText = `
            SELECT d.*, dd.nombre as disciplina_nombre,
                   u.nombre_completo as registrado_por_nombre
            FROM deportistas d
            LEFT JOIN disciplinas_deportivas dd ON d.disciplina_id = dd.id
            LEFT JOIN usuarios u ON d.registrado_por = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (activo !== undefined) {
            queryText += ` AND d.activo = $${paramCount}`;
            params.push(activo === 'true');
            paramCount++;
        }

        if (disciplina_id) {
            queryText += ` AND d.disciplina_id = $${paramCount}`;
            params.push(disciplina_id);
            paramCount++;
        }

        if (buscar) {
            queryText += ` AND (
                d.nombres ILIKE $${paramCount} OR 
                d.apellidos ILIKE $${paramCount} OR 
                d.numero_documento ILIKE $${paramCount}
            )`;
            params.push(`%${buscar}%`);
        }

        queryText += ' ORDER BY d.apellidos, d.nombres';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: true,
            message: 'Error al obtener deportistas'
        });
    }
});

// Obtener un deportista por ID
app.get('/api/deportistas/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT d.*, dd.nombre as disciplina_nombre,
                   u.nombre_completo as registrado_por_nombre
            FROM deportistas d
            LEFT JOIN disciplinas_deportivas dd ON d.disciplina_id = dd.id
            LEFT JOIN usuarios u ON d.registrado_por = u.id
            WHERE d.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Deportista no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: true,
            message: 'Error al obtener deportista'
        });
    }
});

// Crear nuevo deportista
app.post('/api/deportistas', authMiddleware, async (req, res) => {
    try {
        const {
            tipo_documento, numero_documento, nombres, apellidos,
            fecha_nacimiento, sexo, direccion, municipio,
            telefono, celular, email, contacto_emergencia,
            telefono_emergencia, eps, tipo_sangre, disciplina_id, foto_url
        } = req.body;

        // Verificar que no exista el documento
        const existe = await query(
            'SELECT id FROM deportistas WHERE numero_documento = $1',
            [numero_documento]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({
                error: true,
                message: 'Ya existe un deportista con este número de documento'
            });
        }

        // Calcular edad
        const fechaNac = new Date(fecha_nacimiento);
        const edad = Math.floor((new Date() - fechaNac) / (365.25 * 24 * 60 * 60 * 1000));

        const result = await query(`
            INSERT INTO deportistas (
                tipo_documento, numero_documento, nombres, apellidos,
                fecha_nacimiento, edad, sexo, direccion, municipio,
                telefono, celular, email, contacto_emergencia,
                telefono_emergencia, eps, tipo_sangre, disciplina_id,
                foto_url, registrado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `, [
            tipo_documento, numero_documento, nombres, apellidos,
            fecha_nacimiento, edad, sexo, direccion, municipio,
            telefono, celular, email, contacto_emergencia,
            telefono_emergencia, eps, tipo_sangre, disciplina_id,
            foto_url, req.usuario.id
        ]);

        res.status(201).json({
            success: true,
            message: 'Deportista creado exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: true,
            message: 'Error al crear deportista'
        });
    }
});

// Actualizar deportista
app.put('/api/deportistas/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tipo_documento, numero_documento, nombres, apellidos,
            fecha_nacimiento, sexo, direccion, municipio,
            telefono, celular, email, contacto_emergencia,
            telefono_emergencia, eps, tipo_sangre, disciplina_id,
            foto_url, activo
        } = req.body;

        const fechaNac = new Date(fecha_nacimiento);
        const edad = Math.floor((new Date() - fechaNac) / (365.25 * 24 * 60 * 60 * 1000));

        const result = await query(`
            UPDATE deportistas SET
                tipo_documento = $1, numero_documento = $2, nombres = $3, apellidos = $4,
                fecha_nacimiento = $5, edad = $6, sexo = $7, direccion = $8, municipio = $9,
                telefono = $10, celular = $11, email = $12, contacto_emergencia = $13,
                telefono_emergencia = $14, eps = $15, tipo_sangre = $16, disciplina_id = $17,
                foto_url = $18, activo = $19
            WHERE id = $20
            RETURNING *
        `, [
            tipo_documento, numero_documento, nombres, apellidos,
            fecha_nacimiento, edad, sexo, direccion, municipio,
            telefono, celular, email, contacto_emergencia,
            telefono_emergencia, eps, tipo_sangre, disciplina_id,
            foto_url, activo !== undefined ? activo : true, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Deportista no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Deportista actualizado exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: true,
            message: 'Error al actualizar deportista'
        });
    }
});

// Historial completo de un deportista
app.get('/api/deportistas/:id/historial-completo', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const [deportista, historias, medidas, pruebas, lesiones, seguimientoNut, laboratorios] = await Promise.all([
            query('SELECT * FROM deportistas WHERE id = $1', [id]),
            query('SELECT * FROM historias_clinicas WHERE deportista_id = $1 ORDER BY fecha_consulta DESC LIMIT 10', [id]),
            query('SELECT * FROM historia_deportiva_medidas WHERE deportista_id = $1 ORDER BY fecha_medicion DESC LIMIT 5', [id]),
            query('SELECT * FROM historia_deportiva_pruebas WHERE deportista_id = $1 ORDER BY fecha_prueba DESC LIMIT 10', [id]),
            query('SELECT * FROM historia_deportiva_lesiones WHERE deportista_id = $1 ORDER BY fecha_lesion DESC', [id]),
            query('SELECT * FROM seguimiento_nutricional WHERE deportista_id = $1 ORDER BY fecha_seguimiento DESC LIMIT 5', [id]),
            query('SELECT * FROM seguimiento_laboratorios WHERE deportista_id = $1 ORDER BY fecha_laboratorio DESC LIMIT 5', [id])
        ]);

        if (deportista.rows.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Deportista no encontrado'
            });
        }

        res.json({
            success: true,
            data: {
                deportista: deportista.rows[0],
                historias_clinicas: historias.rows,
                medidas_antropometricas: medidas.rows,
                pruebas_desempeno: pruebas.rows,
                lesiones: lesiones.rows,
                seguimiento_nutricional: seguimientoNut.rows,
                laboratorios: laboratorios.rows
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: true,
            message: 'Error al obtener historial'
        });
    }
});

// ============================================================================
// RUTAS DE DISCIPLINAS
// ============================================================================

app.get('/api/disciplinas', authMiddleware, async (req, res) => {
    try {
        const result = await query('SELECT * FROM disciplinas_deportivas WHERE activo = true ORDER BY nombre');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al obtener disciplinas' });
    }
});

app.post('/api/disciplinas', authMiddleware, async (req, res) => {
    try {
        const { nombre, categoria, descripcion } = req.body;
        const result = await query(
            'INSERT INTO disciplinas_deportivas (nombre, categoria, descripcion) VALUES ($1, $2, $3) RETURNING *',
            [nombre, categoria, descripcion]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al crear disciplina' });
    }
});

// ============================================================================
// RUTAS DE HISTORIAS CLÍNICAS (MÓDULO 1)
// ============================================================================

// Obtener todas las historias clínicas
app.get('/api/historias-clinicas', authMiddleware, async (req, res) => {
    try {
        const { deportista_id, fecha_desde, fecha_hasta, estado } = req.query;
        
        let queryText = `
            SELECT hc.*, 
                   d.nombres || ' ' || d.apellidos as deportista_nombre,
                   d.numero_documento,
                   u.nombre_completo as medico_nombre
            FROM historias_clinicas hc
            INNER JOIN deportistas d ON hc.deportista_id = d.id
            LEFT JOIN usuarios u ON hc.medico_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (deportista_id) {
            queryText += ` AND hc.deportista_id = $${paramCount}`;
            params.push(deportista_id);
            paramCount++;
        }

        if (fecha_desde) {
            queryText += ` AND hc.fecha_consulta >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        }

        if (fecha_hasta) {
            queryText += ` AND hc.fecha_consulta <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }

        if (estado) {
            queryText += ` AND hc.estado = $${paramCount}`;
            params.push(estado);
            paramCount++;
        }

        queryText += ' ORDER BY hc.fecha_consulta DESC, hc.hora_consulta DESC';

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: true, message: 'Error al obtener historias clínicas' });
    }
});

// Obtener una historia clínica completa
app.get('/api/historias-clinicas/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const [historia, examenFisico, diagnosticos, examenes, planes] = await Promise.all([
            query('SELECT * FROM historias_clinicas WHERE id = $1', [id]),
            query('SELECT * FROM examenes_fisicos WHERE historia_clinica_id = $1', [id]),
            query('SELECT * FROM diagnosticos WHERE historia_clinica_id = $1 ORDER BY tipo', [id]),
            query('SELECT * FROM examenes_solicitados WHERE historia_clinica_id = $1 ORDER BY fecha_solicitud DESC', [id]),
            query('SELECT * FROM planes_manejo WHERE historia_clinica_id = $1 ORDER BY fecha_registro DESC', [id])
        ]);

        if (historia.rows.length === 0) {
            return res.status(404).json({ error: true, message: 'Historia clínica no encontrada' });
        }

        res.json({
            success: true,
            data: {
                historia: historia.rows[0],
                examen_fisico: examenFisico.rows[0] || null,
                diagnosticos: diagnosticos.rows,
                examenes: examenes.rows,
                planes: planes.rows
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: true, message: 'Error al obtener historia clínica' });
    }
});

// Crear nueva historia clínica completa
app.post('/api/historias-clinicas', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const {
            deportista_id, fecha_consulta, hora_consulta, motivo_consulta,
            enfermedad_actual, antecedentes_personales, antecedentes_familiares,
            antecedentes_quirurgicos, antecedentes_alergicos, medicamentos_actuales,
            habitos, revision_sistemas, examen_fisico, diagnosticos,
            examenes_solicitados, planes_manejo
        } = req.body;

        // Crear historia clínica
        const historiaResult = await client.query(`
            INSERT INTO historias_clinicas (
                deportista_id, fecha_consulta, hora_consulta, motivo_consulta,
                enfermedad_actual, antecedentes_personales, antecedentes_familiares,
                antecedentes_quirurgicos, antecedentes_alergicos, medicamentos_actuales,
                habitos, revision_sistemas, medico_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            deportista_id, fecha_consulta, hora_consulta, motivo_consulta,
            enfermedad_actual, antecedentes_personales, antecedentes_familiares,
            antecedentes_quirurgicos, antecedentes_alergicos, medicamentos_actuales,
            habitos, revision_sistemas, req.usuario.id
        ]);

        const historiaId = historiaResult.rows[0].id;

        // Crear examen físico si existe
        if (examen_fisico) {
            await client.query(`
                INSERT INTO examenes_fisicos (
                    historia_clinica_id, peso, talla, imc, presion_arterial,
                    frecuencia_cardiaca, frecuencia_respiratoria, temperatura,
                    saturacion_oxigeno, estado_general, cabeza_cuello, torax,
                    cardiovascular, respiratorio, abdomen, extremidades,
                    neurologico, piel_faneras, observaciones
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            `, [
                historiaId, examen_fisico.peso, examen_fisico.talla, examen_fisico.imc,
                examen_fisico.presion_arterial, examen_fisico.frecuencia_cardiaca,
                examen_fisico.frecuencia_respiratoria, examen_fisico.temperatura,
                examen_fisico.saturacion_oxigeno, examen_fisico.estado_general,
                examen_fisico.cabeza_cuello, examen_fisico.torax, examen_fisico.cardiovascular,
                examen_fisico.respiratorio, examen_fisico.abdomen, examen_fisico.extremidades,
                examen_fisico.neurologico, examen_fisico.piel_faneras, examen_fisico.observaciones
            ]);
        }

        // Crear diagnósticos
        if (diagnosticos && diagnosticos.length > 0) {
            for (const diag of diagnosticos) {
                await client.query(`
                    INSERT INTO diagnosticos (historia_clinica_id, tipo, codigo_cie10, descripcion_diagnostico)
                    VALUES ($1, $2, $3, $4)
                `, [historiaId, diag.tipo, diag.codigo_cie10, diag.descripcion_diagnostico]);
            }
        }

        // Crear exámenes solicitados
        if (examenes_solicitados && examenes_solicitados.length > 0) {
            for (const examen of examenes_solicitados) {
                await client.query(`
                    INSERT INTO examenes_solicitados (
                        historia_clinica_id, tipo_examen, nombre_examen, justificacion, urgente
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [historiaId, examen.tipo_examen, examen.nombre_examen, examen.justificacion, examen.urgente || false]);
            }
        }

        // Crear planes de manejo
        if (planes_manejo && planes_manejo.length > 0) {
            for (const plan of planes_manejo) {
                await client.query(`
                    INSERT INTO planes_manejo (
                        historia_clinica_id, tipo_plan, descripcion, medicamento,
                        dosis, via_administracion, frecuencia, duracion,
                        recomendaciones, proximo_control
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    historiaId, plan.tipo_plan, plan.descripcion, plan.medicamento,
                    plan.dosis, plan.via_administracion, plan.frecuencia, plan.duracion,
                    plan.recomendaciones, plan.proximo_control
                ]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Historia clínica creada exitosamente',
            data: historiaResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error:', error);
        res.status(500).json({ error: true, message: 'Error al crear historia clínica' });
    } finally {
        client.release();
    }
});

// ============================================================================
// RUTAS DE HISTORIA DEPORTIVA (MÓDULO 2)
// ============================================================================

// Medidas antropométricas
app.post('/api/historia-deportiva/medidas', authMiddleware, async (req, res) => {
    try {
        const data = { ...req.body, evaluador_id: req.usuario.id };
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const result = await query(
            `INSERT INTO historia_deportiva_medidas (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: true, message: 'Error al registrar medidas' });
    }
});

app.get('/api/historia-deportiva/medidas/:deportista_id', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM historia_deportiva_medidas WHERE deportista_id = $1 ORDER BY fecha_medicion DESC',
            [req.params.deportista_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al obtener medidas' });
    }
});

// Pruebas de desempeño
app.post('/api/historia-deportiva/pruebas', authMiddleware, async (req, res) => {
    try {
        const data = { ...req.body, evaluador_id: req.usuario.id };
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const result = await query(
            `INSERT INTO historia_deportiva_pruebas (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al registrar prueba' });
    }
});

app.get('/api/historia-deportiva/pruebas/:deportista_id', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM historia_deportiva_pruebas WHERE deportista_id = $1 ORDER BY fecha_prueba DESC',
            [req.params.deportista_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al obtener pruebas' });
    }
});

// Lesiones
app.post('/api/historia-deportiva/lesiones', authMiddleware, async (req, res) => {
    try {
        const data = { ...req.body, registrado_por: req.usuario.id };
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const result = await query(
            `INSERT INTO historia_deportiva_lesiones (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al registrar lesión' });
    }
});

app.get('/api/historia-deportiva/lesiones/:deportista_id', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM historia_deportiva_lesiones WHERE deportista_id = $1 ORDER BY fecha_lesion DESC',
            [req.params.deportista_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al obtener lesiones' });
    }
});

// ============================================================================
// RUTAS DE SEGUIMIENTO (MÓDULO 3)
// ============================================================================

// Seguimiento nutricional
app.post('/api/seguimiento/nutricional', authMiddleware, async (req, res) => {
    try {
        const data = { ...req.body, nutricionista_id: req.usuario.id };
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const result = await query(
            `INSERT INTO seguimiento_nutricional (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al registrar seguimiento nutricional' });
    }
});

app.get('/api/seguimiento/nutricional/:deportista_id', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM seguimiento_nutricional WHERE deportista_id = $1 ORDER BY fecha_seguimiento DESC',
            [req.params.deportista_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al obtener seguimiento' });
    }
});

// Laboratorios
app.post('/api/seguimiento/laboratorios', authMiddleware, async (req, res) => {
    try {
        const data = { ...req.body, medico_id: req.usuario.id };
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const result = await query(
            `INSERT INTO seguimiento_laboratorios (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al registrar laboratorio' });
    }
});

app.get('/api/seguimiento/laboratorios/:deportista_id', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM seguimiento_laboratorios WHERE deportista_id = $1 ORDER BY fecha_laboratorio DESC',
            [req.params.deportista_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al obtener laboratorios' });
    }
});

// Otros seguimientos
app.post('/api/seguimiento/otros', authMiddleware, async (req, res) => {
    try {
        const data = { ...req.body, profesional_id: req.usuario.id };
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const result = await query(
            `INSERT INTO seguimiento_otros (${columns}) VALUES (${placeholders}) RETURNING *`,
            values
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al registrar seguimiento' });
    }
});

app.get('/api/seguimiento/otros/:deportista_id', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM seguimiento_otros WHERE deportista_id = $1 ORDER BY fecha_seguimiento DESC',
            [req.params.deportista_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al obtener seguimientos' });
    }
});

// ============================================================================
// RUTAS DE DASHBOARD
// ============================================================================

app.get('/api/dashboard/estadisticas', authMiddleware, async (req, res) => {
    try {
        const [deportistas, historias, lesiones, seguimientos] = await Promise.all([
            query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE activo = true) as activos FROM deportistas'),
            query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE fecha_consulta >= CURRENT_DATE - INTERVAL \'30 days\') as ultimo_mes FROM historias_clinicas'),
            query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE recuperado = false) as activas FROM historia_deportiva_lesiones'),
            query('SELECT COUNT(*) as total FROM seguimiento_nutricional WHERE fecha_seguimiento >= CURRENT_DATE - INTERVAL \'30 days\'')
        ]);

        const disciplinas = await query(`
            SELECT dd.nombre, COUNT(d.id) as cantidad
            FROM disciplinas_deportivas dd
            LEFT JOIN deportistas d ON dd.id = d.disciplina_id AND d.activo = true
            GROUP BY dd.id, dd.nombre
            ORDER BY cantidad DESC
        `);

        res.json({
            success: true,
            data: {
                deportistas: deportistas.rows[0],
                historias: historias.rows[0],
                lesiones: lesiones.rows[0],
                seguimientos: seguimientos.rows[0],
                por_disciplina: disciplinas.rows
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: true, message: 'Error al obtener estadísticas' });
    }
});

// ============================================================================
// RUTAS DE REPORTES
// ============================================================================

app.get('/api/reportes/deportistas', authMiddleware, async (req, res) => {
    try {
        const result = await query(`
            SELECT d.*, dd.nombre as disciplina_nombre
            FROM deportistas d
            LEFT JOIN disciplinas_deportivas dd ON d.disciplina_id = dd.id
            WHERE d.activo = true
            ORDER BY d.apellidos, d.nombres
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al generar reporte' });
    }
});

app.get('/api/reportes/historias-periodo', authMiddleware, async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const result = await query(`
            SELECT hc.*, d.nombres || ' ' || d.apellidos as deportista_nombre
            FROM historias_clinicas hc
            INNER JOIN deportistas d ON hc.deportista_id = d.id
            WHERE hc.fecha_consulta BETWEEN $1 AND $2
            ORDER BY hc.fecha_consulta DESC
        `, [fecha_inicio, fecha_fin]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al generar reporte' });
    }
});

// ============================================================================
// RUTAS DE USUARIOS
// ============================================================================

app.get('/api/usuarios', authMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const result = await query(
            'SELECT id, nombre_completo, email, rol, especialidad, telefono, activo FROM usuarios ORDER BY nombre_completo'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al obtener usuarios' });
    }
});

app.post('/api/usuarios', authMiddleware, requireRole('administrador'), async (req, res) => {
    try {
        const { nombre_completo, email, password, rol, especialidad, telefono } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        
        const result = await query(
            'INSERT INTO usuarios (nombre_completo, email, password_hash, rol, especialidad, telefono) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre_completo, email, rol, especialidad, telefono',
            [nombre_completo, email, passwordHash, rol, especialidad, telefono]
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Error al crear usuario' });
    }
});

// ============================================================================
// MANEJO DE ERRORES
// ============================================================================

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.statusCode || 500).json({
        error: true,
        message: err.message || 'Error interno del servidor'
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: true,
        message: 'Ruta no encontrada'
    });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║   Sistema de Historias Clínicas Deportivas                ║
    ║   INDER Huila                                             ║
    ║   Desarrollado por: Wilcas                                ║
    ║   Servidor corriendo en: http://localhost:${PORT}         ║
    ╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;