@esc-13
Feature: Recomendación de productos (ESC-13)
  Como cliente que está mirando un celular
  Quiero ver otros celulares parecidos
  Para comparar antes de decidir mi compra

  @web @smoke
  Scenario: Ver celulares parecidos al que se está mirando
    Given Valeria abre la ficha del celular "iphone-15-pro-max"
    Then ella ve en "También te puede interesar" los celulares:
      | iPhone 14                |
      | iPhone 13 (Usado)        |
      | Samsung Galaxy S24 Ultra |

  @web
  Scenario: Abrir una recomendación lleva a la ficha de ese celular
    Given Valeria abre la ficha del celular "iphone-15-pro-max"
    When ella abre la recomendación "iPhone 14"
    Then ella ve la ficha del "iPhone 14"
    And entre las recomendaciones aparece "iPhone 15 Pro Max"
    And entre las recomendaciones no aparece "iPhone 14"

  @web
  Scenario Outline: Solo se recomiendan celulares que tienen stock
    Given Ana publicó por la API un celular parecido al "iPhone 15 Pro Max" con stock <stock>
    When Valeria abre la ficha del celular "iphone-15-pro-max"
    Then el celular publicado <resultado> entre las recomendaciones

    Examples:
      | stock | resultado  |
      | 3     | aparece    |
      | 0     | no aparece |

  @api
  Scenario: Consultar las recomendaciones por la API
    When Api consulta las recomendaciones del celular "iphone-15-pro-max"
    Then la respuesta HTTP tiene estado 200
    And la respuesta trae los celulares "iPhone 14, iPhone 13 (Usado), Samsung Galaxy S24 Ultra"

  @api
  Scenario: Pedir recomendaciones de un celular que no existe
    When Api consulta las recomendaciones del celular "celular-que-no-existe"
    Then la respuesta HTTP tiene estado 404
    And el error de la API dice "Celular no encontrado"

  @api
  Scenario: Pedir más recomendaciones de las permitidas
    When Api consulta 13 recomendaciones del celular "iphone-15-pro-max"
    Then la respuesta HTTP tiene estado 400
    And el error de la API dice "Datos inválidos"
