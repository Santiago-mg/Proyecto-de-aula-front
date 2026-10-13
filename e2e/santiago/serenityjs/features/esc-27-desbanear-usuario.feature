@esc-27
Feature: Desbanear usuario (ESC-27)
  Como administradora de CelularPro
  Quiero reactivar la cuenta de un cliente suspendido
  Para que pueda volver a comprar cuando se resuelva su caso

  Background:
    Given Carlos tiene una cuenta de cliente suspendida por "Spam"

  @web
  Scenario: Mientras está suspendido, el cliente no puede ingresar
    When Carlos intenta iniciar sesión
    Then él ve el mensaje "Tu cuenta ha sido suspendida. Motivo: Spam"

  @web @smoke
  Scenario: Un cliente reactivado vuelve a iniciar sesión
    Given Ana inició sesión como administradora
    When ella desbanea a Carlos
    Then ella ve a Carlos con estado "Activo" y sin motivo de baneo
    When Carlos inicia sesión
    Then él ve el saludo "Hola, Carlos"

  @api
  Scenario: Desbanear por la API deja la cuenta limpia
    Given Ana inició sesión en la API como administradora
    When ella desbanea a Carlos por la API
    Then la respuesta HTTP tiene estado 200
    And la respuesta indica que el usuario quedó activo y sin motivo de baneo

  @api
  Scenario: Desbanear a un usuario que no existe
    Given Ana inició sesión en la API como administradora
    When ella desbanea por la API al usuario "00000000-0000-0000-0000-000000000000"
    Then la respuesta HTTP tiene estado 404
    And el error de la API dice "Usuario no encontrado"
