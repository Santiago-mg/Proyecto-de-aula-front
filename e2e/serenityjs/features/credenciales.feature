@web @credenciales
Feature: Validación de credenciales y sesión
  Como persona que usa la tienda
  Quiero que mi sesión se compruebe en cada acción
  Para que nadie más pueda usar mi cuenta

  Scenario: Sin sesión, el perfil lleva a iniciar sesión
    Given Alicia abre la página "/login"
    And ella borra la sesión del navegador
    When ella abre la página "/profile"
    Then ella llega a "/login"

  @smoke
  Scenario: Cerrar sesión devuelve al inicio de sesión y cierra el perfil
    Given Alicia tiene la sesión iniciada
    When ella cierra sesión
    Then ella llega a "/login"
    When ella abre la página "/profile"
    Then ella llega a "/login"

  Scenario: Una sesión corrupta se explica en lugar de fallar en silencio
    Given Alicia tiene la sesión iniciada
    And su sesión se corrompe
    When ella abre la página "/dashboard"
    Then ella llega a "/login"
    And ella ve el aviso de sesión "Tu sesión ya no es válida. Inicia sesión de nuevo."
