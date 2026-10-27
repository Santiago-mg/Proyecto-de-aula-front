@web @heuristicas
Feature: Correcciones de la evaluación heurística
  Como persona que usa CelularPro por primera vez
  Quiero entender dónde estoy, qué me piden y cómo deshacer
  Para no depender de adivinar ni de escribir a soporte

  # H10: antes la ayuda solo estaba en el pie, que Ingresar no tiene.
  @smoke
  Scenario: Desde Ingresar se llega al centro de ayuda
    Given Alicia abre la página "/login"
    When ella sigue el enlace "Centro de ayuda"
    Then ella llega a "/ayuda"
    And ella ve el título "Centro de ayuda"

  # H4: "Garantías" del pie llevaba al catálogo.
  Scenario: "Garantías" lleva a las garantías
    Given Alicia abre la página "/unauthorized"
    When ella sigue el enlace "Garantías"
    Then ella llega a "/ayuda"

  # H1: todas las pestañas se llamaban igual.
  Scenario: Cada pantalla nombra su pestaña
    Given Alicia abre la página "/register"
    Then la pestaña del navegador dice "Crear cuenta · CelularPro"

  # H5 y H8: la regla de la contraseña solo se conocía al fallar.
  Scenario: Los requisitos de la contraseña se marcan mientras se escribe
    Given Alicia abre la página "/register"
    When ella escribe la contraseña "medellin2026" sin enviar
    Then el requisito "minuscula" aparece cumplido
    And el requisito "numero" aparece cumplido
    And el requisito "mayuscula" aparece pendiente

  # H3: no había forma de volver al estado anterior.
  Scenario: Descartar los cambios devuelve el nombre guardado
    Given Alicia tiene la sesión iniciada
    And ella abre la página "/profile"
    When ella escribe el nombre "Otro Nombre" sin guardar
    And ella descarta los cambios
    Then el campo de nombre muestra "Ana Pérez"
