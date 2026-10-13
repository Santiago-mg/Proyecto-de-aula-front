@esc-29
Feature: Panel de estadísticas (ESC-29)
  Como administradora de CelularPro
  Quiero ver los indicadores de la tienda en un solo lugar
  Para saber cómo va el negocio sin consultar la base de datos

  @web @smoke
  Scenario: El panel muestra los totales reales de la tienda
    Given Ana inició sesión como administradora
    When ella abre el panel principal
    Then el indicador "Usuarios" muestra el total de usuarios de la API
    And el indicador "Celulares en catálogo" muestra el total de celulares de la API

  @web
  Scenario: Banear a un cliente se refleja en las estadísticas
    Given Carlos tiene una cuenta de cliente
    And Ana inició sesión como administradora
    And ella anota cuántos usuarios baneados muestran las estadísticas
    When ella banea a Carlos con el motivo "Contracargos repetidos"
    Then las estadísticas muestran un usuario baneado más

  @web
  Scenario: Un cliente no puede ver el panel
    Given Carlos tiene una cuenta de cliente
    And Carlos inició sesión
    When él intenta abrir el panel de administración
    Then él ve la página "Acceso no autorizado"

  @api
  Scenario: Las estadísticas traen los ingresos de los últimos 7 días
    Given Ana inició sesión en la API como administradora
    When ella consulta las estadísticas por la API
    Then la respuesta HTTP tiene estado 200
    And la respuesta trae los ingresos de 7 días
