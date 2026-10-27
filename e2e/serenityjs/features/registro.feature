@web @registro
Feature: Registro de usuario
  Como persona que quiere comprar en CelularPro
  Quiero crear una cuenta
  Para guardar mis datos y ver mis pedidos

  @smoke
  Scenario: Registro correcto
    Given Alicia abre la página "/register"
    When ella se registra con una contraseña válida
    Then ella llega a "/dashboard"
    And ella ve el saludo "Hola, Ana"

  # Un solo dato incorrecto a la vez: así, si falla, se sabe cuál fue la causa.
  Scenario Outline: Contraseña que no cumple la regla
    Given Alicia abre la página "/register"
    When ella se registra con la contraseña "<contraseña>"
    Then ella observa el error de campo "<mensaje>"
    And ella sigue en "/register"

    Examples:
      | contraseña  | mensaje                                                  |
      | 12345678    | La contraseña debe incluir al menos una letra minúscula  |
      | sololetras1 | La contraseña debe incluir al menos una letra mayúscula  |
      | SoloLetras  | La contraseña debe incluir al menos un número            |
      | Abc1        | La contraseña debe tener al menos 8 caracteres           |

  # El backend solo crea cuentas de Gmail, Outlook, Hotmail, Yahoo o iCloud.
  Scenario: Correo con un dominio no permitido
    Given Alicia abre la página "/register"
    When ella se registra con el correo "ana.perez@empresa.com"
    Then ella observa el error de campo "Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud."
    And ella sigue en "/register"

  Scenario: La confirmación no coincide
    Given Alicia abre la página "/register"
    When ella se registra confirmando con "OtraClave2026"
    Then ella observa el error de campo "Las contraseñas no coinciden"

  Scenario: Correo ya registrado
    Given Alicia tiene una cuenta registrada
    When ella intenta registrarse otra vez con el mismo correo
    Then ella observa el mensaje de error "El email ya está registrado"
