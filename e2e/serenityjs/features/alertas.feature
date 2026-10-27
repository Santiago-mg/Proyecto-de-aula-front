@web @alertas
Feature: Alertas de stock bajo
  Como administradora
  Quiero que el panel me avise cuando el inventario de un celular llega a su mínimo
  Para reponerlo antes de que se agote

  Background:
    Given Daniela es administradora y ha iniciado sesión

  # Tabla de bordes: justo en el mínimo SÍ avisa, un punto por encima no.
  @smoke
  Scenario Outline: La alerta depende del stock frente al mínimo
    When ella crea un celular con stock <stock> y mínimo <mínimo>
    And ella abre la página "/admin/alerts"
    Then ella ve que la alerta del celular es "<resultado>"

    Examples:
      | stock | mínimo | resultado   |
      | 3     | 5      | Stock bajo  |
      | 5     | 5      | Stock bajo  |
      | 6     | 5      | ninguna     |
      | 0     | 5      | Sin stock   |
      | 10    | 12     | Stock bajo  |

  Scenario: El menú muestra cuántas alertas hay abiertas
    When ella crea un celular con stock 2 y mínimo 5
    And ella abre la página "/admin"
    Then ella ve la insignia de alertas en el menú

  Scenario: Reponer el inventario cierra la alerta
    Given ella creó un celular con stock 2 y mínimo 5
    When ella repone ese celular a 50 unidades desde la alerta
    And ella abre la página "/admin/alerts"
    Then ella ve que la alerta del celular es "ninguna"
