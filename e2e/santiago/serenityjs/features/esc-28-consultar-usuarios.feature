@esc-28
Feature: Consultar usuarios (ESC-28)
  Como administradora de CelularPro
  Quiero ver y buscar las cuentas registradas
  Para encontrar rápido a un cliente

  @web @smoke
  Scenario: La administradora ve cuántos usuarios hay registrados
    Given Ana inició sesión como administradora
    When ella abre la gestión de usuarios
    Then ella ve el mismo total de usuarios que reporta la API

  @web
  Scenario: Buscar a un cliente por su correo
    Given Carlos tiene una cuenta de cliente
    And Ana inició sesión como administradora
    When ella busca el correo de Carlos en la gestión de usuarios
    Then ella ve únicamente a Carlos en la tabla
    And ella ve a Carlos con rol "Usuario" y estado "Activo"

  @web
  Scenario: Una búsqueda sin coincidencias deja la tabla vacía
    Given Ana inició sesión como administradora
    When ella busca "nadie-se-llama-asi" en la gestión de usuarios
    Then ella no ve ningún usuario en la tabla

  @web
  Scenario: Un cliente no puede entrar a la gestión de usuarios
    Given Carlos tiene una cuenta de cliente
    And Carlos inició sesión
    When él intenta abrir la gestión de usuarios
    Then él ve la página "Acceso no autorizado"

  @api
  Scenario: Consultar usuarios por la API, de a uno por página
    Given Carlos tiene una cuenta de cliente
    And Ana inició sesión en la API como administradora
    When ella consulta por la API la página 1 de usuarios de a 1
    Then la respuesta HTTP tiene estado 200
    And la respuesta trae 1 usuario y tantas páginas como usuarios registrados

  @api
  Scenario: Sin iniciar sesión no se pueden consultar los usuarios
    When Api consulta los usuarios sin iniciar sesión
    Then la respuesta HTTP tiene estado 401
    And el error de la API dice "Token requerido"
