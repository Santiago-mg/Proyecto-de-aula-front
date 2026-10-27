# language: es
@alertas-stock
Característica: Alertas de stock bajo
  Como administrador
  Quiero ver los celulares con stock bajo o agotado
  Para reponerlos a tiempo

  @exitoso
  Escenario: La pantalla muestra las mismas alertas que la API
    Dado que Admin tiene sesión de administrador
    Cuando Admin consulta las alertas de stock por la API
    Y Admin abre el panel de alertas
    Entonces la pantalla muestra tantas alertas como devuelve la API
    Y todas las alertas son de tipo "LOW_STOCK" u "OUT_OF_STOCK"

  @error
  Escenario: Un cliente no ve las alertas
    Dado que Ana tiene una cuenta de cliente
    Cuando Ana abre "/admin/alerts"
    Entonces Ana llega a "/unauthorized"
