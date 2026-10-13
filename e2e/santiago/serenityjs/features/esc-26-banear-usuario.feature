@esc-26
Feature: Banear usuario (ESC-26)
  Como administradora de CelularPro
  Quiero suspender la cuenta de un cliente
  Para que no pueda volver a ingresar mientras se revisa su caso

  Background:
    Given Carlos tiene una cuenta de cliente

  @web @smoke
  Scenario: Un cliente baneado ya no puede iniciar sesión
    Given Ana inició sesión como administradora
    When ella banea a Carlos con el motivo "Fraude en pagos"
    Then ella ve a Carlos con estado "Baneado" y motivo "Fraude en pagos"
    When Carlos intenta iniciar sesión
    Then él ve el mensaje "Tu cuenta ha sido suspendida. Motivo: Fraude en pagos"

  @web
  Scenario: El motivo del baneo necesita al menos 4 caracteres
    Given Ana inició sesión como administradora
    When ella empieza a banear a Carlos con el motivo "abc"
    Then ella no puede confirmar el baneo

  @web
  Scenario: La administradora no puede banearse a sí misma
    Given Ana inició sesión como administradora
    When ella busca su propio correo en la gestión de usuarios
    Then ella ve su propia fila marcada como suya y sin el botón para banear

  @api
  Scenario: Banear por la API
    Given Ana inició sesión en la API como administradora
    When ella banea a Carlos por la API con el motivo "Spam"
    Then la respuesta HTTP tiene estado 200
    And la respuesta indica que el usuario quedó baneado por "Spam"

  @api
  Scenario: Un cliente no puede banear a otro
    Given Bruno tiene una cuenta de cliente
    And Carlos inició sesión en la API
    When él banea a Bruno por la API con el motivo "No me cae bien"
    Then la respuesta HTTP tiene estado 403
    And el error de la API dice "Acceso restringido a administradores"
