// ============================================================================
// SISTEMA DE HISTORIAS CLÍNICAS DEPORTIVAS - INDER HUILA
// Desarrollado por: Wilcas
// ============================================================================

import React, { useState, useEffect, createContext, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

// ============================================================================
// CONFIGURACIÓN Y CONTEXTO POR FAVOR MANTENER LAS CONEXIONES API 
// ============================================================================

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const AppContext = createContext();

// ============================================================================
// COMPONENTES DE UI REUTILIZABLES
// ============================================================================

const Button = ({ children, onClick, className = '', type = 'button', variant = 'primary', disabled = false }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <input
      {...props}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none ${error ? 'border-red-500' : 'border-gray-300'}`}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const Select = ({ label, options, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <select
      {...props}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none ${error ? 'border-red-500' : 'border-gray-300'}`}
    >
      <option value="">Seleccionar...</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const TextArea = ({ label, error, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
    <textarea
      {...props}
      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none ${error ? 'border-red-500' : 'border-gray-300'}`}
      rows={4}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const Card = ({ children, title, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
    {title && <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>}
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4" 
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop oscuro */}
      <div 
        className="absolute inset-0 bg-black"
        style={{ opacity: 0.75 }}
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div 
        className={`relative bg-white rounded-lg shadow-2xl ${sizes[size]} w-full overflow-hidden`}
        style={{ maxHeight: '90vh', zIndex: 10000 }}
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-600 hover:text-gray-800 text-3xl font-bold leading-none hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            type="button"
          >
            &times;
          </button>
        </div>
        <div className="p-6 overflow-y-auto bg-white" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  };
  
  return (
    <div 
      className={`fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg animate-slide-in`}
      style={{ zIndex: 10001 }}
    >
      {message}
    </div>
  );
};

// ============================================================================
// PÁGINA DE LOGIN  está desactivada
// ============================================================================

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      onLogin(usuario);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-green-600">
      <div className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-3xl">IH</span>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">INDER Huila</h1>
          <p className="text-blue-100 text-sm">Historias Clínicas Deportivas</p>
          <p className="text-blue-200 text-xs mt-2">Desarrollado por Wilcas</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Input
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@inderhuila.gov.co"
              required
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600 mb-2">Credenciales de prueba:</p>
            <p className="text-xs text-blue-900 font-mono">admin@inderhuila.gov.co / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DASHBOARD
// ============================================================================

const Dashboard = () => {
  const [stats] = useState({
    deportistas: { activos: 45, total: 50 },
    historias: { ultimo_mes: 23, total: 150 },
    lesiones: { activas: 8, total: 35 },
    seguimientos: { total: 67 },
    por_disciplina: [
      { nombre: 'Fútbol', cantidad: 15 },
      { nombre: 'Atletismo', cantidad: 12 },
      { nombre: 'Natación', cantidad: 8 },
      { nombre: 'Baloncesto', cantidad: 6 },
      { nombre: 'Voleibol', cantidad: 4 }
    ]
  });
  const [loading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  const statsCards = [
    { title: 'Deportistas Activos', value: stats?.deportistas?.activos || 0, color: 'bg-green-600' },
    { title: 'Historias Clínicas', value: stats?.historias?.ultimo_mes || 0, color: 'bg-blue-600' },
    { title: 'Lesiones Activas', value: stats?.lesiones?.activas || 0, color: 'bg-red-600' },
    { title: 'Seguimientos', value: stats?.seguimientos?.total || 0, color: 'bg-yellow-600' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900 to-green-600 rounded-lg p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-blue-100">Panel de Control - Sistema de Historias Clínicas Deportivas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, i) => (
          <Card key={i}>
            <div className={`${stat.color} p-3 rounded-lg inline-block mb-4`}>
              <span className="text-white text-2xl">📊</span>
            </div>
            <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Deportistas por Disciplina">
          <div className="space-y-3">
            {(stats?.por_disciplina || []).slice(0, 5).map((disc, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-gray-700">{disc.nombre}</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {disc.cantidad}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Accesos Rápidos">
          <div className="space-y-3">
            <button className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
              <p className="font-medium text-gray-800">Gestión de Deportistas</p>
              <p className="text-sm text-gray-600">Registrar y consultar deportistas</p>
            </button>
            <button className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
              <p className="font-medium text-gray-800">Nueva Historia Clínica</p>
              <p className="text-sm text-gray-600">Crear historia clínica deportiva</p>
            </button>
            <button className="w-full p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors">
              <p className="font-medium text-gray-800">Seguimiento</p>
              <p className="text-sm text-gray-600">Nutricional, laboratorios y más</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// MODAL DE DEPORTISTA
// ============================================================================

const DeportistaModal = ({ isOpen, onClose, deportista, disciplinas, onSave }) => {
  const [formData, setFormData] = useState({});
  const { showToast } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (deportista) {
      setFormData(deportista);
    } else {
      setFormData({
        tipo_documento: 'CC',
        numero_documento: '',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        sexo: 'Masculino',
        direccion: '',
        municipio: 'Neiva',
        telefono: '',
        celular: '',
        email: '',
        contacto_emergencia: '',
        telefono_emergencia: '',
        eps: '',
        tipo_sangre: '',
        disciplina_id: ''
      });
    }
  }, [deportista, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (deportista?.id) {
        showToast('Deportista actualizado exitosamente', 'success');
      } else {
        showToast('Deportista creado exitosamente', 'success');
      }
      if (typeof onSave === 'function') onSave();
      onClose();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={deportista ? 'Editar Deportista' : 'Nuevo Deportista'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Documento"
            name="tipo_documento"
            value={formData.tipo_documento || ''}
            onChange={handleChange}
            options={[
              { value: 'CC', label: 'Cédula de Ciudadanía' },
              { value: 'TI', label: 'Tarjeta de Identidad' },
              { value: 'CE', label: 'Cédula de Extranjería' },
              { value: 'PA', label: 'Pasaporte' }
            ]}
            required
          />
          <Input
            label="Número de Documento"
            name="numero_documento"
            value={formData.numero_documento || ''}
            onChange={handleChange}
            required
          />
          <Input
            label="Nombres"
            name="nombres"
            value={formData.nombres || ''}
            onChange={handleChange}
            required
          />
          <Input
            label="Apellidos"
            name="apellidos"
            value={formData.apellidos || ''}
            onChange={handleChange}
            required
          />
          <Input
            label="Fecha de Nacimiento"
            type="date"
            name="fecha_nacimiento"
            value={formData.fecha_nacimiento || ''}
            onChange={handleChange}
            required
          />
          <Select
            label="Sexo"
            name="sexo"
            value={formData.sexo || ''}
            onChange={handleChange}
            options={[
              { value: 'Masculino', label: 'Masculino' },
              { value: 'Femenino', label: 'Femenino' }
            ]}
            required
          />
          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono || ''}
            onChange={handleChange}
          />
          <Input
            label="Celular"
            name="celular"
            value={formData.celular || ''}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
          />
          <Input
            label="EPS"
            name="eps"
            value={formData.eps || ''}
            onChange={handleChange}
          />
          <Input
            label="Tipo de Sangre"
            name="tipo_sangre"
            value={formData.tipo_sangre || ''}
            onChange={handleChange}
            placeholder="Ej: O+"
          />
          <Select
            label="Disciplina Deportiva"
            name="disciplina_id"
            value={formData.disciplina_id || ''}
            onChange={handleChange}
            options={disciplinas.map(d => ({ value: d.id, label: d.nombre }))}
            required
          />
        </div>

        <Input
          label="Dirección"
          name="direccion"
          value={formData.direccion || ''}
          onChange={handleChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contacto de Emergencia"
            name="contacto_emergencia"
            value={formData.contacto_emergencia || ''}
            onChange={handleChange}
          />
          <Input
            label="Teléfono de Emergencia"
            name="telefono_emergencia"
            value={formData.telefono_emergencia || ''}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// GESTIÓN DE DEPORTISTAS
// ============================================================================

const Deportistas = () => {
  const [deportistas] = useState([
    { id: 1, tipo_documento: 'CC', numero_documento: '1075234567', nombres: 'Juan Carlos', apellidos: 'Rodríguez Pérez', edad: 22, fecha_nacimiento: '2002-03-15', sexo: 'Masculino', disciplina_nombre: 'Fútbol', celular: '3124567890', email: 'juan.rodriguez@mail.com', direccion: 'Calle 15 #20-30', telefono: '8765432', contacto_emergencia: 'María Pérez', telefono_emergencia: '3109876543', eps: 'Sanitas', tipo_sangre: 'O+', disciplina_id: 1 },
    { id: 2, tipo_documento: 'CC', numero_documento: '1075345678', nombres: 'María Fernanda', apellidos: 'López García', edad: 19, fecha_nacimiento: '2005-07-22', sexo: 'Femenino', disciplina_nombre: 'Atletismo', celular: '3145678901', email: 'maria.lopez@mail.com', direccion: 'Carrera 10 #15-20', telefono: '8765433', contacto_emergencia: 'Pedro López', telefono_emergencia: '3198765432', eps: 'Compensar', tipo_sangre: 'A+', disciplina_id: 2 },
    { id: 3, tipo_documento: 'CC', numero_documento: '1075456789', nombres: 'Andrés Felipe', apellidos: 'Martínez Torres', edad: 24, fecha_nacimiento: '2000-11-08', sexo: 'Masculino', disciplina_nombre: 'Natación', celular: '3156789012', email: 'andres.martinez@mail.com', direccion: 'Avenida 5 #30-40', telefono: '8765434', contacto_emergencia: 'Laura Torres', telefono_emergencia: '3187654321', eps: 'Nueva EPS', tipo_sangre: 'B+', disciplina_id: 3 },
    { id: 4, tipo_documento: 'TI', numero_documento: '1075567890', nombres: 'Laura Valentina', apellidos: 'Gómez Silva', edad: 17, fecha_nacimiento: '2007-05-12', sexo: 'Femenino', disciplina_nombre: 'Baloncesto', celular: '3167890123', email: 'laura.gomez@mail.com', direccion: 'Calle 20 #10-15', telefono: '8765435', contacto_emergencia: 'Carlos Gómez', telefono_emergencia: '3176543210', eps: 'Salud Total', tipo_sangre: 'AB+', disciplina_id: 4 },
    { id: 5, tipo_documento: 'CC', numero_documento: '1075678901', nombres: 'Carlos Eduardo', apellidos: 'Ramírez Díaz', edad: 21, fecha_nacimiento: '2003-09-30', sexo: 'Masculino', disciplina_nombre: 'Voleibol', celular: '3178901234', email: 'carlos.ramirez@mail.com', direccion: 'Carrera 15 #25-35', telefono: '8765436', contacto_emergencia: 'Ana Díaz', telefono_emergencia: '3165432109', eps: 'Sura', tipo_sangre: 'O-', disciplina_id: 5 }
  ]);
  
  const [disciplinas] = useState([
    { id: 1, nombre: 'Fútbol' },
    { id: 2, nombre: 'Atletismo' },
    { id: 3, nombre: 'Natación' },
    { id: 4, nombre: 'Baloncesto' },
    { id: 5, nombre: 'Voleibol' },
    { id: 6, nombre: 'Ciclismo' },
    { id: 7, nombre: 'Tenis' }
  ]);
  
  const [loading] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deportistaSeleccionado, setDeportistaSeleccionado] = useState(null);

  const handleNuevo = () => {
    setDeportistaSeleccionado(null);
    setShowModal(true);
  };

  const handleEditar = (deportista) => {
    setDeportistaSeleccionado(deportista);
    setShowModal(true);
  };

  const handleSaveDeportista = () => {
    setShowModal(false);
    // Aquí iría la lógica para recargar deportistas del backend tener presente ingenieros
  };

  const deportistasFiltrados = deportistas.filter(d =>
    d.nombres.toLowerCase().includes(buscar.toLowerCase()) ||
    d.apellidos.toLowerCase().includes(buscar.toLowerCase()) ||
    d.numero_documento.includes(buscar)
  );

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Deportistas</h1>
          <p className="text-gray-600">Gestión de deportistas registrados</p>
        </div>
        <Button onClick={handleNuevo}>+ Nuevo Deportista</Button>
      </div>

      <Card>
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disciplina</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deportistasFiltrados.map((deportista) => (
                <tr key={deportista.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{deportista.numero_documento}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{deportista.nombres} {deportista.apellidos}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{deportista.edad} años</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{deportista.disciplina_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{deportista.celular}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button onClick={() => handleEditar(deportista)} className="text-blue-900 hover:text-blue-700">
                      Ver/Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deportistasFiltrados.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron deportistas</p>
          </div>
        )}
      </Card>

      <DeportistaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deportista={deportistaSeleccionado}
        disciplinas={disciplinas}
        onSave={handleSaveDeportista}
      />
    </div>
  );
};

// ============================================================================
// HISTORIAS CLÍNICAS
// ============================================================================

const HistoriaClinicaModal = ({ isOpen, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    deportista_id: '',
    fecha_consulta: new Date().toISOString().split('T')[0],
    hora_consulta: new Date().toTimeString().split(' ')[0].substring(0, 5),
    motivo_consulta: '',
    enfermedad_actual: '',
    antecedentes_personales: '',
    antecedentes_familiares: '',
    examen_fisico: {},
    diagnosticos: [],
    examenes_solicitados: [],
    planes_manejo: []
  });
  const [deportistas] = useState([
    { id: 1, nombres: 'Juan Carlos', apellidos: 'Rodríguez Pérez', numero_documento: '1075234567' },
    { id: 2, nombres: 'María Fernanda', apellidos: 'López García', numero_documento: '1075345678' }
  ]);
  const { showToast } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      showToast('Historia clínica creada exitosamente', 'success');
      if (typeof onSave === 'function') onSave();
      onClose();
      setStep(1);
    } catch (error) {
      showToast('Error al guardar historia clínica', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Historia Clínica" size="xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {['Datos Iniciales', 'Examen Físico', 'Diagnóstico', 'Plan de Manejo'].map((label, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step > i + 1 ? 'bg-green-600' : step === i + 1 ? 'bg-blue-900' : 'bg-gray-300'} text-white font-bold`}>
                {i + 1}
              </div>
              <span className="ml-2 text-sm font-medium">{label}</span>
              {i < 3 && <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {step === 1 && (
          <>
            <Select
              label="Deportista"
              value={formData.deportista_id}
              onChange={(e) => handleChange('deportista_id', e.target.value)}
              options={deportistas.map(d => ({ value: d.id, label: `${d.nombres} ${d.apellidos} - ${d.numero_documento}` }))}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Fecha de Consulta"
                type="date"
                value={formData.fecha_consulta}
                onChange={(e) => handleChange('fecha_consulta', e.target.value)}
                required
              />
              <Input
                label="Hora de Consulta"
                type="time"
                value={formData.hora_consulta}
                onChange={(e) => handleChange('hora_consulta', e.target.value)}
                required
              />
            </div>
            <TextArea
              label="Motivo de Consulta"
              value={formData.motivo_consulta}
              onChange={(e) => handleChange('motivo_consulta', e.target.value)}
              required
            />
            <TextArea
              label="Enfermedad Actual"
              value={formData.enfermedad_actual}
              onChange={(e) => handleChange('enfermedad_actual', e.target.value)}
            />
            <TextArea
              label="Antecedentes Personales"
              value={formData.antecedentes_personales}
              onChange={(e) => handleChange('antecedentes_personales', e.target.value)}
            />
            <TextArea
              label="Antecedentes Familiares"
              value={formData.antecedentes_familiares}
              onChange={(e) => handleChange('antecedentes_familiares', e.target.value)}
            />
          </>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Peso (kg)"
              type="number"
              step="0.1"
              value={formData.examen_fisico.peso || ''}
              onChange={(e) => handleChange('examen_fisico', { ...formData.examen_fisico, peso: e.target.value })}
            />
            <Input
              label="Talla (cm)"
              type="number"
              step="0.1"
              value={formData.examen_fisico.talla || ''}
              onChange={(e) => handleChange('examen_fisico', { ...formData.examen_fisico, talla: e.target.value })}
            />
            <Input
              label="Presión Arterial"
              placeholder="120/80"
              value={formData.examen_fisico.presion_arterial || ''}
              onChange={(e) => handleChange('examen_fisico', { ...formData.examen_fisico, presion_arterial: e.target.value })}
            />
            <Input
              label="Frecuencia Cardíaca"
              type="number"
              value={formData.examen_fisico.frecuencia_cardiaca || ''}
              onChange={(e) => handleChange('examen_fisico', { ...formData.examen_fisico, frecuencia_cardiaca: e.target.value })}
            />
            <Input
              label="Temperatura (°C)"
              type="number"
              step="0.1"
              value={formData.examen_fisico.temperatura || ''}
              onChange={(e) => handleChange('examen_fisico', { ...formData.examen_fisico, temperatura: e.target.value })}
            />
            <Input
              label="Saturación O2 (%)"
              type="number"
              value={formData.examen_fisico.saturacion_oxigeno || ''}
              onChange={(e) => handleChange('examen_fisico', { ...formData.examen_fisico, saturacion_oxigeno: e.target.value })}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Agregue los diagnósticos según sea necesario</p>
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Tipo"
                options={[
                  { value: 'Principal', label: 'Principal' },
                  { value: 'Secundario', label: 'Secundario' },
                  { value: 'Relacionado', label: 'Relacionado' }
                ]}
              />
              <Input label="Código CIE-10" placeholder="Ej: M79.1" />
              <Input label="Descripción" placeholder="Descripción del diagnóstico" />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Defina el plan de manejo para el paciente</p>
            <Select
              label="Tipo de Plan"
              options={[
                { value: 'Farmacologico', label: 'Farmacológico' },
                { value: 'No farmacologico', label: 'No Farmacológico' },
                { value: 'Terapeutico', label: 'Terapéutico' },
                { value: 'Seguimiento', label: 'Seguimiento' }
              ]}
            />
            <TextArea label="Descripción del Plan" />
            <Input label="Medicamento" placeholder="Nombre del medicamento" />
            <div className="grid grid-cols-3 gap-4">
              <Input label="Dosis" placeholder="Ej: 500mg" />
              <Input label="Frecuencia" placeholder="Ej: Cada 8 horas" />
              <Input label="Duración" placeholder="Ej: 7 días" />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} type="button">
            Anterior
          </Button>
        )}
        <div className="ml-auto space-x-4">
          <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} type="button">Siguiente</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} type="button">
              {loading ? 'Guardando...' : 'Finalizar y Guardar'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

const VerDetallesModal = ({ isOpen, onClose, historia }) => {
  if (!historia) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalles de Historia Clínica" size="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha de Consulta</p>
            <p className="text-lg font-semibold text-gray-900">{historia.fecha_consulta}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Hora</p>
            <p className="text-lg font-semibold text-gray-900">{historia.hora_consulta}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Deportista</p>
            <p className="text-lg font-semibold text-gray-900">{historia.deportista_nombre}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Médico</p>
            <p className="text-lg font-semibold text-gray-900">{historia.medico_nombre}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Motivo de Consulta</p>
          <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{historia.motivo_consulta}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Estado</p>
          <span className={`px-3 py-1 text-sm rounded-full ${historia.estado === 'Finalizada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {historia.estado}
          </span>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-900">📋 Los detalles completos de examen físico, diagnósticos y plan de manejo estarían disponibles con conexión al backend.</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
};

const HistoriasClinicas = () => {
  const [historias] = useState([
    { id: 1, fecha_consulta: '2024-11-15', hora_consulta: '09:30', deportista_nombre: 'Juan Carlos Rodríguez', motivo_consulta: 'Control rutinario deportivo', medico_nombre: 'Dr. Carlos Medina', estado: 'Finalizada' },
    { id: 2, fecha_consulta: '2024-11-14', hora_consulta: '10:15', deportista_nombre: 'María Fernanda López', motivo_consulta: 'Dolor en rodilla izquierda', medico_nombre: 'Dr. Carlos Medina', estado: 'En Proceso' },
    { id: 3, fecha_consulta: '2024-11-13', hora_consulta: '14:00', deportista_nombre: 'Andrés Felipe Martínez', motivo_consulta: 'Evaluación pre-competencia', medico_nombre: 'Dr. Carlos Medina', estado: 'Finalizada' },
    { id: 4, fecha_consulta: '2024-11-12', hora_consulta: '11:30', deportista_nombre: 'Laura Valentina Gómez', motivo_consulta: 'Seguimiento lesión tobillo', medico_nombre: 'Dr. Carlos Medina', estado: 'Finalizada' },
    { id: 5, fecha_consulta: '2024-11-11', hora_consulta: '15:45', deportista_nombre: 'Carlos Eduardo Ramírez', motivo_consulta: 'Dolor muscular hombro', medico_nombre: 'Dr. Carlos Medina', estado: 'En Proceso' }
  ]);
  
  const [loading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetalles, setShowDetalles] = useState(false);
  const [historiaSeleccionada, setHistoriaSeleccionada] = useState(null);
  const { showToast } = useContext(AppContext);

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Historias Clínicas</h1>
          <p className="text-gray-600">Módulo 1 - Gestión de historias clínicas deportivas</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Nueva Historia Clínica</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deportista</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historias.map((historia) => (
                <tr key={historia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{historia.fecha_consulta}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{historia.deportista_nombre}</td>
                  <td className="px-6 py-4 text-sm">{historia.motivo_consulta}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{historia.medico_nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${historia.estado === 'Finalizada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {historia.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => {
                        setHistoriaSeleccionada(historia);
                        setShowDetalles(true);
                      }}
                      className="text-blue-900 hover:text-blue-700 font-medium"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {historias.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay historias clínicas registradas</p>
          </div>
        )}
      </Card>

      <HistoriaClinicaModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={() => {
          setShowModal(false);
          showToast('Historia clínica creada exitosamente', 'success');
        }}
      />

      <VerDetallesModal
        isOpen={showDetalles}
        onClose={() => setShowDetalles(false)}
        historia={historiaSeleccionada}
      />
    </div>
  );
};

// ============================================================================
// MODALES DE SEGUIMIENTO
// ============================================================================

const SeguimientoNutricionalModal = ({ isOpen, onClose }) => {
  const { showToast } = useContext(AppContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Seguimiento nutricional registrado exitosamente', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registro Nutricional" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Deportista"
          options={[
            { value: 1, label: 'Juan Carlos Rodríguez' },
            { value: 2, label: 'María Fernanda López' }
          ]}
          required
        />
        <Input label="Fecha" type="date" required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Peso Actual (kg)" type="number" step="0.1" required />
          <Input label="Objetivo de Peso (kg)" type="number" step="0.1" />
        </div>
        <TextArea label="Plan Alimenticio" placeholder="Descripción del plan..." required />
        <TextArea label="Recomendaciones" placeholder="Suplementos, horarios, etc." />
        <TextArea label="Observaciones" placeholder="Progreso, adherencia al plan..." />
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const SeguimientoLaboratorioModal = ({ isOpen, onClose }) => {
  const { showToast } = useContext(AppContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Resultados de laboratorio registrados exitosamente', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resultados de Laboratorio" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Deportista"
          options={[
            { value: 1, label: 'Juan Carlos Rodríguez' },
            { value: 2, label: 'María Fernanda López' }
          ]}
          required
        />
        <Input label="Fecha del Examen" type="date" required />
        <Select
          label="Tipo de Examen"
          options={[
            { value: 'hemograma', label: 'Hemograma Completo' },
            { value: 'quimica', label: 'Química Sanguínea' },
            { value: 'perfil_lipidico', label: 'Perfil Lipídico' },
            { value: 'hormonas', label: 'Perfil Hormonal' },
            { value: 'orina', label: 'Examen de Orina' }
          ]}
          required
        />
        <TextArea label="Resultados" placeholder="Detalles de los resultados del examen..." required />
        <TextArea label="Interpretación Médica" placeholder="Análisis e interpretación..." />
        <TextArea label="Recomendaciones" placeholder="Acciones a seguir..." />
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

const SeguimientoOtrosModal = ({ isOpen, onClose }) => {
  const { showToast } = useContext(AppContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Seguimiento registrado exitosamente', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Otro Seguimiento" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Deportista"
          options={[
            { value: 1, label: 'Juan Carlos Rodríguez' },
            { value: 2, label: 'María Fernanda López' }
          ]}
          required
        />
        <Input label="Fecha" type="date" required />
        <Select
          label="Tipo de Seguimiento"
          options={[
            { value: 'psicologico', label: 'Psicológico' },
            { value: 'fisioterapia', label: 'Fisioterapia' },
            { value: 'rehabilitacion', label: 'Rehabilitación' },
            { value: 'otro', label: 'Otro' }
          ]}
          required
        />
        <Input label="Título" placeholder="Título del seguimiento" required />
        <TextArea label="Descripción" placeholder="Detalles del seguimiento..." required />
        <TextArea label="Recomendaciones" placeholder="Próximos pasos, indicaciones..." />
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// HISTORIA DEPORTIVA - MODALES
// ============================================================================

const MedidasAntropometricasModal = ({ isOpen, onClose, deportista }) => {
  const { showToast } = useContext(AppContext);
  const [formData, setFormData] = useState({
    deportista_id: deportista?.id || '',
    fecha_medicion: new Date().toISOString().split('T')[0],
    peso: '',
    talla: '',
    imc: '',
    porcentaje_grasa: '',
    masa_muscular: '',
    perimetro_cintura: '',
    perimetro_cadera: '',
    perimetro_brazo: '',
    perimetro_pierna: '',
    observaciones: ''
  });

  useEffect(() => {
    if (deportista) {
      setFormData(prev => ({ ...prev, deportista_id: deportista.id }));
    }
  }, [deportista]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Calcular IMC automáticamente
      if (name === 'peso' || name === 'talla') {
        const peso = parseFloat(name === 'peso' ? value : updated.peso);
        const talla = parseFloat(name === 'talla' ? value : updated.talla) / 100; // convertir a metros
        if (peso && talla) {
          updated.imc = (peso / (talla * talla)).toFixed(2);
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Medidas antropométricas registradas exitosamente', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Medidas Antropométricas" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Fecha de Medición"
          type="date"
          name="fecha_medicion"
          value={formData.fecha_medicion}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Peso (kg)"
            type="number"
            step="0.1"
            name="peso"
            value={formData.peso}
            onChange={handleChange}
            required
          />
          <Input
            label="Talla (cm)"
            type="number"
            step="0.1"
            name="talla"
            value={formData.talla}
            onChange={handleChange}
            required
          />
          <Input
            label="IMC"
            type="number"
            step="0.01"
            name="imc"
            value={formData.imc}
            onChange={handleChange}
            readOnly
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="% Grasa Corporal"
            type="number"
            step="0.1"
            name="porcentaje_grasa"
            value={formData.porcentaje_grasa}
            onChange={handleChange}
          />
          <Input
            label="Masa Muscular (kg)"
            type="number"
            step="0.1"
            name="masa_muscular"
            value={formData.masa_muscular}
            onChange={handleChange}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-medium text-gray-700 mb-3">Perímetros (cm)</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cintura"
              type="number"
              step="0.1"
              name="perimetro_cintura"
              value={formData.perimetro_cintura}
              onChange={handleChange}
            />
            <Input
              label="Cadera"
              type="number"
              step="0.1"
              name="perimetro_cadera"
              value={formData.perimetro_cadera}
              onChange={handleChange}
            />
            <Input
              label="Brazo"
              type="number"
              step="0.1"
              name="perimetro_brazo"
              value={formData.perimetro_brazo}
              onChange={handleChange}
            />
            <Input
              label="Pierna"
              type="number"
              step="0.1"
              name="perimetro_pierna"
              value={formData.perimetro_pierna}
              onChange={handleChange}
            />
          </div>
        </div>

        <TextArea
          label="Observaciones"
          name="observaciones"
          value={formData.observaciones}
          onChange={handleChange}
          placeholder="Notas adicionales sobre las mediciones..."
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit">Guardar Medidas</Button>
        </div>
      </form>
    </Modal>
  );
};



const LesionesModal = ({ isOpen, onClose, deportista, lesion }) => {
  const { showToast } = useContext(AppContext);
  const [formData, setFormData] = useState({
    deportista_id: deportista?.id || '',
    fecha_lesion: new Date().toISOString().split('T')[0],
    tipo_lesion: '',
    zona_afectada: '',
    gravedad: '',
    descripcion: '',
    diagnostico: '',
    tratamiento: '',
    tiempo_recuperacion_estimado: '',
    fecha_recuperacion: '',
    recuperado: false,
    observaciones: ''
  });

  useEffect(() => {
    if (lesion) {
      setFormData(lesion);
    } else if (deportista) {
      setFormData(prev => ({ ...prev, deportista_id: deportista.id }));
    }
  }, [deportista, lesion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast(lesion ? 'Lesión actualizada exitosamente' : 'Lesión registrada exitosamente', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lesion ? 'Editar Lesión' : 'Registrar Lesión'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Lesión"
            type="date"
            name="fecha_lesion"
            value={formData.fecha_lesion}
            onChange={handleChange}
            required
          />
          <Select
            label="Gravedad"
            name="gravedad"
            value={formData.gravedad}
            onChange={handleChange}
            options={[
              { value: 'Leve', label: 'Leve' },
              { value: 'Moderada', label: 'Moderada' },
              { value: 'Grave', label: 'Grave' },
              { value: 'Muy Grave', label: 'Muy Grave' }
            ]}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo de Lesión"
            name="tipo_lesion"
            value={formData.tipo_lesion}
            onChange={handleChange}
            options={[
              { value: 'Muscular', label: 'Muscular' },
              { value: 'Articular', label: 'Articular' },
              { value: 'Ósea', label: 'Ósea' },
              { value: 'Ligamentosa', label: 'Ligamentosa' },
              { value: 'Tendinosa', label: 'Tendinosa' },
              { value: 'Contusión', label: 'Contusión' },
              { value: 'Luxación', label: 'Luxación' },
              { value: 'Esguince', label: 'Esguince' },
              { value: 'Fractura', label: 'Fractura' }
            ]}
            required
          />
          <Input
            label="Zona Afectada"
            name="zona_afectada"
            value={formData.zona_afectada}
            onChange={handleChange}
            placeholder="Ej: Rodilla derecha, Hombro izquierdo"
            required
          />
        </div>

        <TextArea
          label="Descripción de la Lesión"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="¿Cómo ocurrió la lesión? Síntomas..."
          required
        />

        <TextArea
          label="Diagnóstico Médico"
          name="diagnostico"
          value={formData.diagnostico}
          onChange={handleChange}
          placeholder="Diagnóstico del profesional de salud..."
        />

        <TextArea
          label="Tratamiento"
          name="tratamiento"
          value={formData.tratamiento}
          onChange={handleChange}
          placeholder="Medicamentos, terapias, procedimientos..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tiempo de Recuperación Estimado"
            name="tiempo_recuperacion_estimado"
            value={formData.tiempo_recuperacion_estimado}
            onChange={handleChange}
            placeholder="Ej: 4 semanas, 2 meses"
          />
          <Input
            label="Fecha de Recuperación"
            type="date"
            name="fecha_recuperacion"
            value={formData.fecha_recuperacion}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            name="recuperado"
            checked={formData.recuperado}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label className="text-sm font-medium text-gray-700">
            Marcar como recuperado
          </label>
        </div>

        <TextArea
          label="Observaciones"
          name="observaciones"
          value={formData.observaciones}
          onChange={handleChange}
          placeholder="Evolución, complicaciones, notas adicionales..."
        />

        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================================
// HISTORIA DEPORTIVA - COMPONENTES PRINCIPALES
// ============================================================================

const MedidasAntropometricas = () => {
  const [showModal, setShowModal] = useState(false);
  const [deportistaSeleccionado, setDeportistaSeleccionado] = useState(null);
  const [medidas] = useState([
    { id: 1, deportista_id: 1, deportista_nombre: 'Juan Carlos Rodríguez', fecha_medicion: '2024-11-15', peso: 75.5, talla: 178, imc: 23.8, porcentaje_grasa: 12.5, masa_muscular: 62.3 },
    { id: 2, deportista_id: 1, deportista_nombre: 'Juan Carlos Rodríguez', fecha_medicion: '2024-10-15', peso: 76.2, talla: 178, imc: 24.1, porcentaje_grasa: 13.1, masa_muscular: 61.8 },
    { id: 3, deportista_id: 2, deportista_nombre: 'María Fernanda López', fecha_medicion: '2024-11-14', peso: 58.3, talla: 165, imc: 21.4, porcentaje_grasa: 18.2, masa_muscular: 45.1 }
  ]);

  const deportistas = [
    { id: 1, nombre: 'Juan Carlos Rodríguez' },
    { id: 2, nombre: 'María Fernanda López' },
    { id: 3, nombre: 'Andrés Felipe Martínez' }
  ];

  const medidasFiltradas = deportistaSeleccionado 
    ? medidas.filter(m => m.deportista_id === deportistaSeleccionado.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Select
          label="Seleccionar Deportista"
          value={deportistaSeleccionado?.id || ''}
          onChange={(e) => {
            const dep = deportistas.find(d => d.id === parseInt(e.target.value));
            setDeportistaSeleccionado(dep);
          }}
          options={deportistas.map(d => ({ value: d.id, label: d.nombre }))}
        />
        <Button 
          onClick={() => setShowModal(true)} 
          disabled={!deportistaSeleccionado}
        >
          + Registrar Medidas
        </Button>
      </div>

      {deportistaSeleccionado ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peso (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Talla (cm)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IMC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Grasa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masa Muscular</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {medidasFiltradas.map((medida) => (
                  <tr key={medida.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{medida.fecha_medicion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{medida.peso}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{medida.talla}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{medida.imc}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{medida.porcentaje_grasa}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{medida.masa_muscular} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {medidasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay medidas registradas para este deportista</p>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <p className="text-gray-500 text-center py-12">
            Seleccione un deportista para ver su historial de medidas antropométricas
          </p>
        </Card>
      )}

      <MedidasAntropometricasModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deportista={deportistaSeleccionado}
      />
    </div>
  );
};

const PruebasDesempeno = () => {
   const [disciplinaSeleccionada, setDisciplinaSeleccionada] = useState('levantamiento_pesas');
  const [deportistaSeleccionado, setDeportistaSeleccionado] = useState('1');

  // Definición de pruebas por disciplina
  const pruebasEstandar = {
    levantamiento_pesas: {
      nombre: 'Levantamiento de Pesas',
      descripcion: 'Evaluación de la capacidad de fuerza explosiva y potencia muscular',
      pruebas: [
        {
          id: 'sentadilla',
          nombre: 'Sentadilla (Squat)',
          unidad: 'kg',
          descripcion: 'Movimiento de flexión de rodillas con carga. Evalúa la fuerza de miembros inferiores.',
          tipo: 'fuerza'
        },
        {
          id: 'press_banca',
          nombre: 'Press de Banca (Bench Press)',
          unidad: 'kg',
          descripcion: 'Empuje horizontal con barra. Evalúa la fuerza del pecho, hombros y tríceps.',
          tipo: 'fuerza'
        },
        {
          id: 'levantamiento_muerto',
          nombre: 'Levantamiento Muerto (Deadlift)',
          unidad: 'kg',
          descripcion: 'Elevación de carga desde el piso. Evalúa fuerza total del cuerpo y espalda.',
          tipo: 'fuerza'
        },
        {
          id: 'clean_jerk',
          nombre: 'Clean & Jerk',
          unidad: 'kg',
          descripcion: 'Movimiento olímpico de dos fases. Evalúa potencia, coordinación y velocidad.',
          tipo: 'potencia'
        },
        {
          id: 'snatch',
          nombre: 'Snatch (Envión)',
          unidad: 'kg',
          descripcion: 'Levantamiento olímpico en una sola fase. Evalúa explosividad y técnica.',
          tipo: 'potencia'
        }
      ]
    }
  };

  // Datos de deportistas
  const deportistasPorDisciplina = {
    levantamiento_pesas: [
      { id: '1', nombre: 'Juan Carlos Rodríguez', documento: '1075234567' },
      { id: '3', nombre: 'Andrés Felipe Martínez', documento: '1075456789' }
    ]
  };

  // Estado para almacenar datos de pruebas
  const [datosPruebas, setDatosPruebas] = useState({
    1: {
      sentadilla: [
        { fecha: '2024-08-01', valor: 80, nota: 'Inicio del programa' },
        { fecha: '2024-09-01', valor: 85, nota: 'Mejora leve' },
        { fecha: '2024-10-01', valor: 92, nota: 'Buen progreso' },
        { fecha: '2024-11-01', valor: 100, nota: 'Objetivo alcanzado' },
        { fecha: '2024-11-15', valor: 105, nota: 'Superó expectativa' }
      ],
      press_banca: [
        { fecha: '2024-08-01', valor: 60, nota: 'Inicio' },
        { fecha: '2024-09-01', valor: 65, nota: 'Mejora' },
        { fecha: '2024-10-01', valor: 70, nota: 'Progreso' },
        { fecha: '2024-11-01', valor: 78, nota: 'Muy bueno' },
        { fecha: '2024-11-15', valor: 82, nota: 'Excelente' }
      ],
      levantamiento_muerto: [
        { fecha: '2024-08-01', valor: 100, nota: 'Inicio' },
        { fecha: '2024-09-01', valor: 110, nota: 'Mejora' },
        { fecha: '2024-10-01', valor: 125, nota: 'Progreso' },
        { fecha: '2024-11-01', valor: 140, nota: 'Muy bueno' },
        { fecha: '2024-11-15', valor: 150, nota: 'Excelente' }
      ],
      clean_jerk: [
        { fecha: '2024-08-01', valor: 50, nota: 'Aprendiendo' },
        { fecha: '2024-09-01', valor: 55, nota: 'Mejora' },
        { fecha: '2024-10-01', valor: 62, nota: 'Progreso' },
        { fecha: '2024-11-01', valor: 70, nota: 'Dominio' },
        { fecha: '2024-11-15', valor: 75, nota: 'Excelente' }
      ],
      snatch: [
        { fecha: '2024-08-01', valor: 40, nota: 'Aprendiendo' },
        { fecha: '2024-09-01', valor: 45, nota: 'Mejora' },
        { fecha: '2024-10-01', valor: 50, nota: 'Progreso' },
        { fecha: '2024-11-01', valor: 58, nota: 'Dominio' },
        { fecha: '2024-11-15', valor: 62, nota: 'Excelente' }
      ]
    },
    3: {
      sentadilla: [],
      press_banca: [],
      levantamiento_muerto: [],
      clean_jerk: [],
      snatch: []
    }
  });

  // Modal para agregar prueba
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [pruebaSeleccionada, setPruebaSeleccionada] = useState(null);
  const [formAgregar, setFormAgregar] = useState({
    fecha: new Date().toISOString().split('T')[0],
    valor: '',
    nota: ''
  });

  // Función para agregar un nuevo registro
  const agregarRegistroPrueba = (e) => {
    e.preventDefault();

    if (!formAgregar.valor) {
      alert('Por favor ingresa un valor');
      return;
    }

    const nuevoRegistro = {
      fecha: formAgregar.fecha,
      valor: parseFloat(formAgregar.valor),
      nota: formAgregar.nota || 'Registro normal'
    };

    setDatosPruebas(prevData => ({
      ...prevData,
      [deportistaSeleccionado]: {
        ...prevData[deportistaSeleccionado],
        [pruebaSeleccionada.id]: [
          ...prevData[deportistaSeleccionado][pruebaSeleccionada.id],
          nuevoRegistro
        ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      }
    }));

    setFormAgregar({
      fecha: new Date().toISOString().split('T')[0],
      valor: '',
      nota: ''
    });
    setShowModalAgregar(false);
  };

  // Función para filtrar datos por tiempo
  const filtrarDatosPorTiempo = (datos, filtro) => {
    if (!datos || datos.length === 0) return [];

    const hoy = new Date();
    let fechaLimite = new Date();

    switch(filtro) {
      case 'semana':
        fechaLimite.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        fechaLimite.setMonth(hoy.getMonth() - 1);
        break;
      case 'año':
        fechaLimite.setFullYear(hoy.getFullYear() - 1);
        break;
      default:
        fechaLimite.setMonth(hoy.getMonth() - 1);
    }

    return datos.filter(d => new Date(d.fecha) >= fechaLimite);
  };

  // Componente para mostrar cada prueba
  const ComponentePrueba = ({ prueba, datos }) => {
    const [filtroTiempo, setFiltroTiempo] = useState('mes');

    const datosFiltrados = filtrarDatosPorTiempo(datos, filtroTiempo);
    const tieneHistorial = datosFiltrados && datosFiltrados.length > 0;

    const datosGrafica = datosFiltrados.map(d => ({
      fecha: new Date(d.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      valor: d.valor,
      nota: d.nota
    }));

    const calcularProgreso = () => {
      if (datosFiltrados.length < 2) return 0;
      const primero = datosFiltrados[0].valor;
      const ultimo = datosFiltrados[datosFiltrados.length - 1].valor;
      return ((ultimo - primero) / primero * 100).toFixed(1);
    };

    const progreso = calcularProgreso();
    const valorActual = datosFiltrados.length > 0 ? datosFiltrados[datosFiltrados.length - 1].valor : 0;
    const mejorValor = datosFiltrados.length > 0 ? Math.max(...datosFiltrados.map(d => d.valor)) : 0;
    const peorValor = datosFiltrados.length > 0 ? Math.min(...datosFiltrados.map(d => d.valor)) : 0;

    return (
      <Card title={prueba.nombre} className="mb-6">
        {/* Descripción y botón agregar */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-600 mb-2">{prueba.descripcion}</p>
            <p className="text-xs text-gray-500">Unidad: <span className="font-semibold">{prueba.unidad}</span></p>
          </div>
          <Button 
            variant="secondary"
            onClick={() => {
              setPruebaSeleccionada(prueba);
              setShowModalAgregar(true);
            }}
            className="whitespace-nowrap ml-4"
          >
            + Agregar Registro
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <p className="text-xs text-gray-500 uppercase">Valor Actual</p>
            <p className="text-xl font-bold text-blue-900">{valorActual} {prueba.unidad}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-600">
            <p className="text-xs text-gray-500 uppercase">Mejor</p>
            <p className="text-xl font-bold text-green-600">{mejorValor} {prueba.unidad}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-600">
            <p className="text-xs text-gray-500 uppercase">Peor</p>
            <p className="text-xl font-bold text-red-600">{peorValor} {prueba.unidad}</p>
          </div>
          <div className={`p-3 rounded-lg border-l-4 ${progreso >= 0 ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
            <p className="text-xs text-gray-500 uppercase">Progreso</p>
            <p className={`text-xl font-bold ${progreso >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {progreso > 0 ? '+' : ''}{progreso}%
            </p>
          </div>
        </div>

        {/* Filtros de tiempo */}
        <div className="mb-4 flex gap-2">
          <p className="text-sm font-medium text-gray-700 self-center">Filtrar por:</p>
          {['semana', 'mes', 'año'].map((periodo) => (
            <button
              key={periodo}
              onClick={() => setFiltroTiempo(periodo)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtroTiempo === periodo
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Último {periodo === 'semana' ? 'Semana' : periodo === 'mes' ? 'Mes' : 'Año'}
            </button>
          ))}
        </div>

        {/* Gráfica */}
        {tieneHistorial ? (
          <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Evolución</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `${value} ${prueba.unidad}`}
                  labelFormatter={(label) => `Fecha: ${label}`}
                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#1e3a8a" 
                  dot={{ fill: '#1e3a8a', r: 5 }}
                  activeDot={{ r: 8 }}
                  name={prueba.nombre}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg mb-4">
            <p className="text-gray-500">📊 No hay datos para este período</p>
          </div>
        )}

        {/* Tabla histórica */}
        {datosFiltrados.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Historial de registros</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-right">Valor</th>
                    <th className="px-4 py-2 text-left">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {datosFiltrados.map((registro, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {new Date(registro.fecha).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-blue-900">
                        {registro.valor} {prueba.unidad}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{registro.nota}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    );
  };

  const disciplinas = [
    { value: 'levantamiento_pesas', label: 'Levantamiento de Pesas' }
  ];

  const deportistasDisponibles = deportistasPorDisciplina[disciplinaSeleccionada] || [];
  const disciplinaActual = pruebasEstandar[disciplinaSeleccionada];
  const deportistaActual = deportistasDisponibles.find(d => d.id === deportistaSeleccionado);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">📈 Pruebas de Desempeño Deportivo</h1>
        <p className="text-gray-600 mt-2">Módulo de seguimiento, gráficas y análisis de pruebas con datos en tiempo real</p>
      </div>

      {/* Filtros */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select
            label="1️⃣ Disciplina"
            value={disciplinaSeleccionada}
            onChange={(e) => setDisciplinaSeleccionada(e.target.value)}
            options={disciplinas}
          />

          <Select
            label="2️⃣ Deportista"
            value={deportistaSeleccionado}
            onChange={(e) => setDeportistaSeleccionado(e.target.value)}
            options={deportistasDisponibles.map(d => ({ value: d.id, label: `${d.nombre} (${d.documento})` }))}
          />
        </div>
      </Card>

      {/* Información */}
      {disciplinaActual && deportistaActual && (
        <Card className="bg-blue-50 border-l-4 border-blue-900">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">{disciplinaActual.nombre}</h2>
              <p className="text-gray-700">{disciplinaActual.descripcion}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Deportista:</p>
              <p className="text-lg font-bold text-blue-900">{deportistaActual.nombre}</p>
              <p className="text-xs text-gray-500">Doc: {deportistaActual.documento}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Pruebas */}
      {disciplinaActual && deportistaActual && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pruebas Registradas</h2>
          
          {disciplinaActual.pruebas.map(prueba => {
            const datosDeportista = datosPruebas[deportistaSeleccionado] || {};
            const datosPrueba = datosDeportista[prueba.id] || [];
            
            return (
              <ComponentePrueba
                key={prueba.id}
                prueba={prueba}
                datos={datosPrueba}
              />
            );
          })}

          {/* Resumen */}
          <Card title="📊 Resumen Estadístico" className="mt-6 bg-green-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border-l-4 border-green-600">
                <p className="text-sm text-gray-600">Total de Pruebas</p>
                <p className="text-3xl font-bold text-green-700">{disciplinaActual.pruebas.length}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border-l-4 border-blue-600">
                <p className="text-sm text-gray-600">Total de Registros</p>
                <p className="text-3xl font-bold text-blue-900">
                  {Object.values(datosPruebas[deportistaSeleccionado] || {}).reduce((acc, arr) => acc + arr.length, 0)}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg border-l-4 border-purple-600">
                <p className="text-sm text-gray-600">Deportista Actual</p>
                <p className="text-lg font-bold text-purple-900">{deportistaActual.nombre}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-600 rounded">
              <p className="text-sm font-semibold text-yellow-900">💡 Nota:</p>
              <p className="text-sm text-yellow-800 mt-1">
                Los datos se guardan en memoria durante esta sesión. Para persistencia en BD, se integrará con el backend.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL PARA AGREGAR PRUEBA */}
      <Modal 
        isOpen={showModalAgregar} 
        onClose={() => setShowModalAgregar(false)} 
        title={`Registrar ${pruebaSeleccionada?.nombre}`} 
        size="md"
      >
        <form onSubmit={agregarRegistroPrueba} className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
            <p className="text-sm text-gray-600">Deportista:</p>
            <p className="text-lg font-bold text-blue-900">{deportistaActual?.nombre}</p>
            <p className="text-sm text-gray-600 mt-1">Prueba: {pruebaSeleccionada?.nombre}</p>
          </div>

          <Input
            label="Fecha del Registro"
            type="date"
            value={formAgregar.fecha}
            onChange={(e) => setFormAgregar({...formAgregar, fecha: e.target.value})}
            required
          />

          <Input
            label={`Valor (${pruebaSeleccionada?.unidad})`}
            type="number"
            step="0.1"
            value={formAgregar.valor}
            onChange={(e) => setFormAgregar({...formAgregar, valor: e.target.value})}
            placeholder={`Ej: ${pruebaSeleccionada?.unidad === 'kg' ? '100' : '12.5'}`}
            required
          />

          <TextArea
            label="Nota o Observación"
            value={formAgregar.nota}
            onChange={(e) => setFormAgregar({...formAgregar, nota: e.target.value})}
            placeholder="Ej: Buena técnica, con fatiga acumulada, etc"
          />

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModalAgregar(false)} type="button">Cancelar</Button>
            <Button type="submit">Guardar Registro</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const Lesiones = () => {
  const [showModal, setShowModal] = useState(false);
  const [deportistaSeleccionado, setDeportistaSeleccionado] = useState(null);
  const [lesionSeleccionada, setLesionSeleccionada] = useState(null);
  const [lesiones] = useState([
    { id: 1, deportista_id: 1, deportista_nombre: 'Juan Carlos Rodríguez', fecha_lesion: '2024-10-20', tipo_lesion: 'Muscular', zona_afectada: 'Isquiotibial derecho', gravedad: 'Moderada', recuperado: false },
    { id: 2, deportista_id: 1, deportista_nombre: 'Juan Carlos Rodríguez', fecha_lesion: '2024-08-15', tipo_lesion: 'Articular', zona_afectada: 'Rodilla izquierda', gravedad: 'Leve', recuperado: true },
    { id: 3, deportista_id: 2, deportista_nombre: 'María Fernanda López', fecha_lesion: '2024-11-01', tipo_lesion: 'Esguince', zona_afectada: 'Tobillo derecho', gravedad: 'Grave', recuperado: false }
  ]);

  const deportistas = [
    { id: 1, nombre: 'Juan Carlos Rodríguez' },
    { id: 2, nombre: 'María Fernanda López' },
    { id: 3, nombre: 'Andrés Felipe Martínez' }
  ];

  const lesionesFiltradas = deportistaSeleccionado 
    ? lesiones.filter(l => l.deportista_id === deportistaSeleccionado.id)
    : [];

  const handleNuevo = () => {
    setLesionSeleccionada(null);
    setShowModal(true);
  };

  const handleEditar = (lesion) => {
    setLesionSeleccionada(lesion);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Select
          label="Seleccionar Deportista"
          value={deportistaSeleccionado?.id || ''}
          onChange={(e) => {
            const dep = deportistas.find(d => d.id === parseInt(e.target.value));
            setDeportistaSeleccionado(dep);
          }}
          options={deportistas.map(d => ({ value: d.id, label: d.nombre }))}
        />
        <Button 
          onClick={handleNuevo} 
          disabled={!deportistaSeleccionado}
        >
          + Registrar Lesión
        </Button>
      </div>

      {deportistaSeleccionado ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zona Afectada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gravedad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lesionesFiltradas.map((lesion) => (
                  <tr key={lesion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{lesion.fecha_lesion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{lesion.tipo_lesion}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{lesion.zona_afectada}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        lesion.gravedad === 'Leve' ? 'bg-green-100 text-green-800' :
                        lesion.gravedad === 'Moderada' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lesion.gravedad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        lesion.recuperado ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {lesion.recuperado ? 'Recuperado' : 'En Recuperación'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => handleEditar(lesion)}
                        className="text-blue-900 hover:text-blue-700 font-medium"
                      >
                        Ver/Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {lesionesFiltradas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay lesiones registradas para este deportista</p>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <p className="text-gray-500 text-center py-12">
            Seleccione un deportista para ver el registro de lesiones
          </p>
        </Card>
      )}

      <LesionesModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setLesionSeleccionada(null);
        }}
        deportista={deportistaSeleccionado}
        lesion={lesionSeleccionada}
      />
    </div>
  );
};

const HistoriaDeportiva = () => {
  const [activeTab, setActiveTab] = useState('medidas');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Historia Deportiva</h1>
        <p className="text-gray-600">Módulo 2 - Medidas antropométricas, pruebas de desempeño y lesiones</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {[
            { id: 'medidas', label: 'Medidas Antropométricas' },
            { id: 'pruebas', label: 'Pruebas de Desempeño' },
            { id: 'lesiones', label: 'Lesiones' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'medidas' && <MedidasAntropometricas />}
      {activeTab === 'pruebas' && <PruebasDesempeno />}
      {activeTab === 'lesiones' && <Lesiones />}
    </div>
  );
};

// ============================================================================
// SEGUIMIENTO
// ============================================================================

const Seguimiento = () => {
  const [activeTab, setActiveTab] = useState('nutricional');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Seguimiento</h1>
        <p className="text-gray-600">Módulo 3 - Seguimiento nutricional, laboratorios y otros</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {[
            { id: 'nutricional', label: 'Nutricional' },
            { id: 'laboratorios', label: 'Laboratorios' },
            { id: 'otros', label: 'Otros' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <p className="text-gray-500 text-center py-12">
          Seleccione un deportista para ver su historial de seguimiento
        </p>
      </Card>
    </div>
  );
};

// ============================================================================
// REPORTES
// ============================================================================

const Reportes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Reportes</h1>
        <p className="text-gray-600">Generación de reportes y estadísticas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <h3 className="font-bold text-lg mb-2">Listado de Deportistas</h3>
          <p className="text-gray-600 text-sm mb-4">Reporte completo de todos los deportistas registrados</p>
          <Button className="w-full">Generar Reporte</Button>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-2">Historias Clínicas</h3>
          <p className="text-gray-600 text-sm mb-4">Reporte de historias clínicas por período</p>
          <Button className="w-full">Generar Reporte</Button>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-2">Estadísticas de Lesiones</h3>
          <p className="text-gray-600 text-sm mb-4">Análisis de lesiones deportivas</p>
          <Button className="w-full">Generar Reporte</Button>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-2">Seguimiento Nutricional</h3>
          <p className="text-gray-600 text-sm mb-4">Reporte de evolución nutricional</p>
          <Button className="w-full">Generar Reporte</Button>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-2">Pruebas de Desempeño</h3>
          <p className="text-gray-600 text-sm mb-4">Evolución del rendimiento deportivo</p>
          <Button className="w-full">Generar Reporte</Button>
        </Card>

        <Card>
          <h3 className="font-bold text-lg mb-2">Reporte Personalizado</h3>
          <p className="text-gray-600 text-sm mb-4">Crear un reporte con filtros personalizados</p>
          <Button className="w-full">Configurar</Button>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// USUARIOS (ADMIN)
// ============================================================================

const Usuarios = () => {
  const [usuarios] = useState([
    { id: 1, nombre_completo: 'Administrador Sistema', email: 'admin@inderhuila.gov.co', rol: 'administrador', especialidad: 'Administración', activo: true },
    { id: 2, nombre_completo: 'Dr. Carlos Medina', email: 'cmedina@inderhuila.gov.co', rol: 'medico', especialidad: 'Medicina Deportiva', activo: true },
    { id: 3, nombre_completo: 'Lic. Ana López', email: 'alopez@inderhuila.gov.co', rol: 'nutricionista', especialidad: 'Nutrición Deportiva', activo: true },
    { id: 4, nombre_completo: 'Ft. Jorge Pérez', email: 'jperez@inderhuila.gov.co', rol: 'fisioterapeuta', especialidad: 'Fisioterapia Deportiva', activo: true },
    { id: 5, nombre_completo: 'Prof. Pedro García', email: 'pgarcia@inderhuila.gov.co', rol: 'entrenador', especialidad: 'Entrenamiento Funcional', activo: true }
  ]);
  
  const [loading] = useState(false);

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Usuarios del Sistema</h1>
          <p className="text-gray-600">Gestión de usuarios y roles</p>
        </div>
        <Button>+ Nuevo Usuario</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{usuario.nombre_completo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{usuario.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{usuario.rol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{usuario.especialidad}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// LAYOUT PRINCIPAL
// ============================================================================

const Layout = ({ usuario, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'deportistas', label: 'Deportistas', icon: '👥' },
    { id: 'historias-clinicas', label: 'Historia Clínica', icon: '📋' },
    { id: 'historia-deportiva', label: 'Historia Deportiva', icon: '🏃' },
    { id: 'seguimiento', label: 'Seguimiento', icon: '📈' },
    { id: 'reportes', label: 'Reportes', icon: '📄' }
  ];

  if (usuario?.rol === 'administrador') {
    menuItems.push({ id: 'usuarios', label: 'Usuarios', icon: '⚙️' });
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'deportistas': return <Deportistas />;
      case 'historias-clinicas': return <HistoriasClinicas />;
      case 'historia-deportiva': return <HistoriaDeportiva />;
      case 'seguimiento': return <Seguimiento />;
      case 'reportes': return <Reportes />;
      case 'usuarios': return <Usuarios />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md fixed w-full top-0" style={{ zIndex: 100 }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-600 hover:text-blue-900 text-2xl font-bold"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">IH</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">INDER Huila</h1>
                <p className="text-xs text-gray-600">Historias Clínicas Deportivas</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{usuario?.nombre_completo}</p>
              <p className="text-xs text-gray-500 capitalize">{usuario?.rol}</p>
            </div>
            <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold">
              {usuario?.nombre_completo?.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white shadow-lg fixed left-0 h-full overflow-y-auto" style={{ zIndex: 90 }}>
            <nav className="py-6">
              <div className="px-4 mb-6">
                <div className="bg-gradient-to-r from-blue-900 to-green-600 text-white p-4 rounded-lg">
                  <p className="text-xs uppercase tracking-wide">Desarrollado por</p>
                  <p className="text-lg font-bold">Wilcas</p>
                </div>
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`w-full flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${currentPage === item.id ? 'bg-blue-900 text-white hover:bg-blue-900' : ''}`}
                  >
                    <span className="mr-3 text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}

                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-6 py-3 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <span className="mr-3 text-xl">🚪</span>
                  <span className="font-medium">Cerrar Sesión</span>
                </button>
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 p-6`}>
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className={`${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 bg-white border-t border-gray-200 py-4 px-6 mt-8`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-600">
          <p>© 2024 INDER Huila - Todos los derechos reservados</p>
          <p>Desarrollado por <span className="font-semibold text-blue-900">Wilcas</span></p>
        </div>
      </footer>
    </div>
  );
};

// ============================================================================
// APLICACIÓN PRINCIPAL
// ============================================================================

function App() {
  const [usuario, setUsuario] = useState({
    id: 1,
    nombre_completo: 'Administrador Sistema',
    email: 'admin@inderhuila.gov.co',
    rol: 'administrador'
  });
  const [loading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleLogin = (userData) => {
    setUsuario(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ showToast }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Layout usuario={usuario} onLogout={handleLogout} />
    </AppContext.Provider>
  );
}

export default App; 