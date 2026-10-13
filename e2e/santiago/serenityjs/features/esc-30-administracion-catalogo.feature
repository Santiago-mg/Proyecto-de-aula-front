@esc-30
Feature: Administración del catálogo (ESC-30)
  Como administradora de CelularPro
  Quiero publicar, editar y retirar celulares
  Para que la tienda muestre siempre el inventario real

  @web @smoke
  Scenario: Publicar un celular y verlo en la tienda
    Given Ana inició sesión como administradora
    When ella publica el celular de prueba desde el formulario
    Then ella ve el celular de prueba en la gestión del catálogo
    And Valeria ve el celular de prueba en la tienda con el precio "$199.000 COP"

  @web
  Scenario: Cambiar el precio de un celular
    Given Ana publicó por la API el celular de prueba
    And Ana inició sesión como administradora
    When ella cambia el precio del celular de prueba a 179000
    Then Valeria ve el celular de prueba en la tienda con el precio "$179.000 COP"

  @web
  Scenario: Retirar un celular del catálogo
    Given Ana publicó por la API el celular de prueba
    And Ana inició sesión como administradora
    When ella elimina el celular de prueba
    Then ella ya no ve el celular de prueba en la gestión del catálogo
    And Valeria ve "Celular no encontrado" al abrir la ficha del celular de prueba

  @web
  Scenario: No se puede repetir el slug de otro celular
    Given Ana inició sesión como administradora
    When ella intenta publicar el celular de prueba con el slug "iphone-14"
    Then ella ve el error "Ya existe un celular con ese slug"

  @api
  Scenario: Publicar y retirar un celular por la API
    Given Ana inició sesión en la API como administradora
    When ella publica el celular de prueba por la API
    Then la respuesta HTTP tiene estado 201
    When ella elimina el celular de prueba por la API
    Then la respuesta HTTP tiene estado 204
    And el celular de prueba ya no existe en la API

  @api
  Scenario: Sin iniciar sesión no se puede publicar un celular
    When Api intenta publicar el celular de prueba sin iniciar sesión
    Then la respuesta HTTP tiene estado 401
    And el error de la API dice "Token requerido"
