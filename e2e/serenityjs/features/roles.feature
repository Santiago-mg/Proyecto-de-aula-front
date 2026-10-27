@web @roles
Feature: Control de roles
  Como dueño de la tienda
  Quiero que solo los administradores entren al panel
  Para proteger el catálogo, los pedidos y los usuarios

  Scenario: Un cliente no entra al panel de administración
    Given Alicia tiene la sesión iniciada
    When ella abre la página "/admin/alerts"
    Then ella llega a "/unauthorized"
    And ella ve el título "Acceso no autorizado"

  Scenario: Sin sesión, el panel lleva a iniciar sesión
    Given Alicia abre la página "/login"
    And ella borra la sesión del navegador
    When ella abre la página "/admin"
    Then ella llega a "/login"

  @smoke
  Scenario: Un administrador sí entra al panel
    Given Daniela es administradora y ha iniciado sesión
    When ella abre la página "/admin"
    Then ella ve el título "Panel"
