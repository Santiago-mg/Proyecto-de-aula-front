import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

/*
 * ESC-13 — Recomendación de productos.
 * Como cliente que está mirando un celular, quiero ver otros celulares
 * parecidos, para comparar antes de decidir mi compra.
 */
Api api = Api.loginAsAdministrator()
CP.begin()

CP.scenario('El visitante ve celulares parecidos al que está mirando') {
    CP.startBrowser()
    CP.openPhone('iphone-15-pro-max')
    CP.shouldBe('celulares recomendados', { CP.recommendedNames() },
        ['iPhone 14', 'iPhone 13 (Usado)', 'Samsung Galaxy S24 Ultra'])
}

CP.scenario('Abrir una recomendación muestra ese celular') {
    CP.startBrowser()
    CP.openPhone('iphone-15-pro-max')
    CP.click(CP.recommendation('iPhone 14'))
    CP.shouldBe('nombre del celular abierto', { CP.textOf(CP.DETAIL_NAME) }, 'iPhone 14')
    CP.shouldBe('recomienda al iPhone 15 Pro Max', { CP.recommendedNames().contains('iPhone 15 Pro Max') }, true)
    // Un celular nunca se recomienda a sí mismo.
    CP.shouldBe('no se recomienda a sí mismo', { !CP.recommendedNames().contains('iPhone 14') }, true)
}

CP.scenario('Un celular parecido con stock sí se recomienda') {
    Map phone = api.publish(Api.newPhoneSimilarToIphone15ProMax(3))
    try {
        CP.startBrowser()
        CP.openPhone('iphone-15-pro-max')
        CP.shouldBe('incluye el celular nuevo', { CP.recommendedNames().contains(phone.name) }, true)
    } finally {
        api.deleteIfExists(phone)
    }
}

CP.scenario('Un celular parecido sin stock no se recomienda') {
    Map phone = api.publish(Api.newPhoneSimilarToIphone15ProMax(0))
    try {
        CP.startBrowser()
        CP.openPhone('iphone-15-pro-max')
        // Primero que carguen, para no dar por buena una lista que todavía no llegó.
        CP.mustAppear(CP.RECOMMENDATIONS)
        CP.shouldBe('no incluye el celular sin stock', { !CP.recommendedNames().contains(phone.name) }, true)
    } finally {
        api.deleteIfExists(phone)
    }
}

CP.finish()
