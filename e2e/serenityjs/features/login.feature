@web @login
Feature: Inicio de sesión
  Como cliente registrado
  Quiero ingresar con mi correo y contraseña
  Para ver mi cuenta y mis pedidos

  Background:
    Given Alicia tiene una cuenta registrada

  @smoke
  Scenario: Inicio de sesión correcto
    When ella inicia sesión con su correo y su contraseña
    Then ella llega a "/dashboard"
    And ella ve el saludo "Hola, Ana"

  # Se cambia UNA entrada a la vez (Clase 18): primero la contraseña, luego el correo.
  Scenario: Contraseña incorrecta con el correo correcto
    When ella inicia sesión con su correo y la contraseña "ClaveEquivocada1"
    Then ella observa el mensaje de error "Credenciales inválidas"
    And ella sigue en "/login"

  Scenario: Correo que no existe con la contraseña correcta
    When ella inicia sesión con el correo "nadie.existe@gmail.com" y su contraseña
    Then ella observa el mensaje de error "Credenciales inválidas"
    And ella sigue en "/login"

  Scenario: El correo escrito en mayúsculas también entra
    When ella inicia sesión con su correo en mayúsculas y su contraseña
    Then ella llega a "/dashboard"

  @lento
  # El backend bloquea la cuenta al 5.º fallo en 15 minutos (login-limiter.middleware.ts,
  # LOGIN_MAX_INTENTOS = 5): 5 intentos dan "Credenciales inválidas" y el 6.º ya está bloqueado.
  Scenario: Demasiados intentos fallidos bloquean el acceso un rato
    When ella falla 6 veces al iniciar sesión con su correo
    Then ella observa el mensaje de error "Demasiados intentos fallidos"
