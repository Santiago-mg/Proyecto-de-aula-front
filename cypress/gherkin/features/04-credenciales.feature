# language: es
@credenciales
Característica: Validación de credenciales
  Como visitante
  Quiero saber qué contraseña se acepta mientras la escribo
  Para no equivocarme al enviar

  @exitoso
  Esquema del escenario: Los requisitos se marcan en tiempo real
    Dado que Ana visita la tienda
    Cuando Ana escribe la contraseña "<clave>" en el registro
    Entonces el requisito "mayuscula" está "<mayuscula>"
    Y el requisito "minuscula" está "<minuscula>"
    Y el requisito "numero" está "<numero>"
    Y el requisito "largo" está "<largo>"

    Ejemplos:
      | clave        | mayuscula | minuscula | numero    | largo     |
      | medellin2026 | pendiente | cumplido  | cumplido  | cumplido  |
      | MEDELLIN     | cumplido  | pendiente | pendiente | cumplido  |
      | Medellin2026 | cumplido  | cumplido  | cumplido  | cumplido  |
      | Me1          | cumplido  | cumplido  | cumplido  | pendiente |

  @error
  Escenario: Una sesión inválida se explica en Ingresar
    Dado que Ana tiene una sesión con un token inválido
    Cuando Ana abre "/dashboard"
    Entonces Ana llega a "/login"
    Y ve el aviso "Tu sesión ya no es válida"
