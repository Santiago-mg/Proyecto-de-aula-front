# language: es
@roles
Característica: Control de roles
  Como responsable de la tienda
  Quiero que solo los administradores usen el panel
  Para proteger la gestión del catálogo y los usuarios

  @error
  Escenario: Sin sesión, el panel pide ingresar
    Cuando Ana abre "/admin"
    Entonces Ana llega a "/login"

  @error
  Escenario: Un cliente no entra al panel
    Dado que Ana tiene una cuenta de cliente
    Cuando Ana abre "/admin"
    Entonces Ana llega a "/unauthorized"
    Y el título dice "Acceso no autorizado"

  @exitoso
  Escenario: La API rechaza a un cliente en una ruta de administración
    Dado que Ana tiene una cuenta de cliente
    Cuando Ana consulta las alertas de stock por la API
    Entonces la API responde 403 con "Acceso restringido a administradores"
