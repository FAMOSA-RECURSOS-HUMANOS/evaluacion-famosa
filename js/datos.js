const personal = [
    { nombre: "Keytlin RRHH", cargo: "RRHH", area: "Recursos Humanos", tipo: "FAMOSA" },
    { nombre: "Juan Pérez", cargo: "Operador", area: "Producción", tipo: "FAMOSA" },
    { nombre: "María López", cargo: "Auxiliar", area: "Administración", tipo: "FAMOSA" },
    { nombre: "Carlos Rojas", cargo: "Terciario", area: "Servicios", tipo: "TERCIARIO" }
];

const competencias = [
    { nombre: "Capacidad de respuesta", descripcion: "Rapidez para resolver tareas." },
    { nombre: "Colaboración", descripcion: "Trabajo en equipo efectivo." },
    { nombre: "Delegación", descripcion: "Asignación correcta de tareas." },
    { nombre: "Iniciativa", descripcion: "Actuar sin esperar órdenes." },
    { nombre: "Calidad", descripcion: "Cumplimiento de estándares." },
    { nombre: "Trabajo en equipo", descripcion: "Coordinación con otros." }
];

const funcionesPorCargo = {
    "Operador": ["Producción", "Orden", "Reportes"],
    "Auxiliar": ["Registro", "Documentación", "Apoyo"],
    "Terciario": ["Tareas asignadas", "Normas", "Comunicación"],
    "RRHH": ["Evaluación", "Coordinación", "Gestión"]
};