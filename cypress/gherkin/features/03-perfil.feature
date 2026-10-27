# language: es
@perfil
Característica: Gestión de perfil
  Como cliente
  Quiero actualizar mis datos
  Para mantener mi cuenta al día

  Antecedentes:
    Dado que Ana tiene una cuenta de cliente

  @exitoso
  Escenario: Cambiar el nombre
    Cuando Ana cambia su nombre a "María Gómez"
    Entonces ve la notificación "Perfil actualizado"

  @alternativo
  Escenario: Descartar los cambios devuelve el nombre guardado
    Cuando Ana edita su nombre a "Otro Nombre" sin guardar
    Y Ana pulsa "Descartar cambios"
    Entonces el campo "#profile-name" vale "Ana Pérez"

  @error
  Escenario: Cambiar la contraseña con la actual incorrecta
    Cuando Ana cambia su contraseña de "NoEsLaClave1" a "ClaveNueva2027"
    Entonces ve el mensaje de error "La contraseña actual no es correcta"
