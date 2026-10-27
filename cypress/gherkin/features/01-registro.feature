# language: es
@registro
Característica: Registro de usuario
  Como visitante de CelularPro
  Quiero crear una cuenta con un correo y una contraseña seguros
  Para poder comprar y seguir mis pedidos

  @exitoso
  Escenario: Registro correcto con un correo de Gmail
    Dado que Ana visita la tienda
    Cuando Ana crea una cuenta con un correo nuevo de "gmail.com" y la contraseña "Medellin2026"
    Entonces Ana llega a "/dashboard"
    Y el título dice "Hola, Ana"

  @error
  Esquema del escenario: El formulario rechaza datos inválidos antes de enviar
    Dado que Ana visita la tienda
    Cuando Ana intenta registrarse con el correo "<correo>", la contraseña "<clave>" y la confirmación "<confirmacion>"
    Entonces Ana sigue en "/register"
    Y el campo "<campo>" muestra el error "<mensaje>"

    Ejemplos:
      | correo                | clave        | confirmacion | campo    | mensaje                                                       |
      | ana@empresa.com       | Medellin2026 | Medellin2026 | email    | Correo inválido. Usa Gmail, Outlook, Hotmail, Yahoo o iCloud. |
      | ana.nueva@gmail.com   | medellin2026 | medellin2026 | password | La contraseña debe incluir al menos una letra mayúscula       |
      | ana.otra@gmail.com    | Medellin2026 | Medellin2027 | confirm  | Las contraseñas no coinciden                                  |
