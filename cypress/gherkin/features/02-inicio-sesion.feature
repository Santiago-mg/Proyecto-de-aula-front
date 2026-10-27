# language: es
@login
Característica: Inicio de sesión
  Como persona registrada
  Quiero ingresar con mi correo y mi contraseña
  Para acceder a mi cuenta

  @exitoso
  Escenario: El administrador ingresa con sus credenciales
    Dado que Admin visita la tienda
    Cuando Admin inicia sesión con las credenciales del administrador
    Entonces Admin llega a "/dashboard"

  @alternativo
  Escenario: El correo en mayúsculas también sirve
    Dado que Admin visita la tienda
    Cuando Admin inicia sesión con su correo en mayúsculas
    Entonces Admin llega a "/dashboard"

  @error
  Escenario: Con la contraseña incorrecta no entra
    Dado que Admin visita la tienda
    Cuando Admin inicia sesión con la contraseña "NoEsLaClave1"
    Entonces Admin sigue en "/login"
    Y ve el mensaje de error "Credenciales inválidas"
