@web @perfil
Feature: Gestión de perfil
  Como cliente con sesión iniciada
  Quiero actualizar mi nombre y cambiar mi contraseña
  Para mantener mis datos al día y mi cuenta segura

  Background:
    Given Alicia tiene la sesión iniciada

  @smoke
  Scenario: Cambiar el nombre
    When ella cambia su nombre a "María Gómez"
    Then ella ve la confirmación "Perfil actualizado"
    When ella abre la página "/dashboard"
    Then ella ve el saludo "Hola, María"

  Scenario: Un nombre en blanco no se guarda
    When ella cambia su nombre a " "
    Then ella observa el error de campo "El nombre debe tener al menos 2 caracteres"

  Scenario: Cambiar la contraseña y entrar con la nueva
    When ella cambia su contraseña por "ClaveNueva2027"
    Then ella ve la confirmación "Contraseña actualizada"
    When ella cierra sesión
    And ella inicia sesión con su correo y la contraseña "ClaveNueva2027"
    Then ella llega a "/dashboard"

  Scenario: La contraseña actual equivocada no permite el cambio
    When ella intenta cambiar su contraseña usando como actual "EquivocadaXX1"
    Then ella observa el mensaje de error "La contraseña actual no es correcta"
