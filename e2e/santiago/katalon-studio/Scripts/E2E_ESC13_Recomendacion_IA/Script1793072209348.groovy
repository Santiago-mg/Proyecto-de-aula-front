import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api
Api api = Api.loginAsAdministrator()

CP.begin()

CP.scenario('Un celular muestra entre 1 y 4 recomendaciones y nunca a sí mismo') {
    CP.startBrowser()
    CP.openPhone('iphone-15-pro-max')
    CP.mustAppear(CP.RECOMMENDATIONS)

    CP.shouldBe(
        'La cantidad de recomendaciones está entre 1 y 4',
        {
            def recommendations = CP.recommendedNames()
            recommendations.size() >= 1 && recommendations.size() <= 4
        },
        true
    )

    CP.shouldBe(
        'El celular actual no aparece entre las recomendaciones',
        {
            !CP.recommendedNames().contains('iPhone 15 Pro Max')
        },
        true
    )
}

CP.scenario('Abrir una recomendación lleva a su ficha') {
    CP.startBrowser()
    CP.openPhone('iphone-15-pro-max')
    CP.mustAppear(CP.RECOMMENDATIONS)
    CP.click(CP.recommendation('Samsung Galaxy S24 Ultra'))

    CP.shouldBe(
        'Se muestra la ficha del celular recomendado',
        { CP.textOf(CP.DETAIL_NAME) },
        'Samsung Galaxy S24 Ultra'
    )
}

CP.scenario('Solo se recomienda el celular parecido que tiene stock') {
    def phoneWithStock = null
    def phoneWithoutStock = null

    try {
        phoneWithStock = api.publish(Api.newPhoneSimilarToIphone15ProMax(3))
        phoneWithoutStock = api.publish(Api.newPhoneSimilarToIphone15ProMax(0))

        CP.startBrowser()
        CP.openPhone('iphone-15-pro-max')
        CP.mustAppear(CP.RECOMMENDATIONS)

        CP.shouldBe(
            'Se recomienda el celular parecido que tiene stock',
            { CP.recommendedNames().contains(phoneWithStock.name) },
            true
        )

        CP.shouldBe(
            'No se recomienda el celular parecido sin stock',
            { !CP.recommendedNames().contains(phoneWithoutStock.name) },
            true
        )
    } finally {
        if (phoneWithStock != null) {
            api.deleteIfExists(phoneWithStock)
        }
        if (phoneWithoutStock != null) {
            api.deleteIfExists(phoneWithoutStock)
        }
    }
}

CP.finish()
/*
 * PROMPT PARA STUDIOASSIST
 * Selecciona el comentario completo, de la primera a la última línea, y haz clic derecho > Katalon AI Assistant > Generate Code.
 * Borra el bloque cuando el código generado te convenza, o déjalo como evidencia del prompt.
 *
 * Escribe un script de Katalon Studio en Groovy para la historia ESC-13 "Recomendación de productos".
 * "Como cliente que está mirando un celular, quiero ver otros celulares parecidos, para comparar antes de decidir mi compra."
 * Los imports de celularpro.CelularPro (como CP) y celularpro.CelularProApi (como Api) ya están
 * arriba. Usa SOLO los métodos de abajo: nada de WebUI directo ni de Object Repository.
 *
 * Estructura obligatoria:
 *  - Primero: Api api = Api.loginAsAdministrator()
 *  - Luego: CP.begin()
 *  - Un bloque CP.scenario('nombre del escenario') { ... } por cada escenario de la lista.
 *  - Al final: CP.finish()
 *  - Cada escenario arranca su propio navegador con CP.startBrowser() y no depende de otro.
 *  - Para verificar usa siempre CP.shouldBe('qué se verifica', { valor_actual }, valor_esperado).
 *  - Lo que se publique con la API se borra en un bloque finally.
 *
 * Métodos que puedes usar:
 *  - api.publish(Api.newPhoneSimilarToIphone15ProMax(stock)): publica un celular parecido al iPhone 15 Pro Max
 *    y devuelve un Map con name y slug. api.deleteIfExists(phone) lo borra.
 *  - CP.startBrowser(), CP.openPhone(slug)
 *  - CP.mustAppear(CP.RECOMMENDATIONS): espera a que cargue la sección de recomendados.
 *  - CP.recommendedNames(): lista con los nombres recomendados.
 *  - CP.click(CP.recommendation(nombre)): abre la recomendación con ese nombre.
 *  - CP.textOf(CP.DETAIL_NAME): nombre del celular que se está viendo.
 *
 * Escenarios:
 *  1. 'Un celular muestra entre 1 y 4 recomendaciones y nunca a sí mismo': abre iphone-15-pro-max y verifica que
 *     CP.recommendedNames() tiene entre 1 y 4 elementos y no contiene 'iPhone 15 Pro Max'.
 *  2. 'Abrir una recomendación lleva a su ficha': abre iphone-15-pro-max, haz clic en la recomendación
 *     'Samsung Galaxy S24 Ultra' y verifica que CP.textOf(CP.DETAIL_NAME) es 'Samsung Galaxy S24 Ultra'.
 *  3. 'Solo se recomienda el celular parecido que tiene stock': publica un celular parecido con stock 3 y otro con stock 0,
 *     abre iphone-15-pro-max, espera la sección de recomendados y verifica que la lista incluye el nombre del
 *     primero y no incluye el del segundo. Borra los dos en el finally.
 */
