import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

Api api = Api.loginAsAdministrator()

CP.begin()

CP.scenario('Las tarjetas coinciden con la API') {
    CP.startBrowser()

    Map expected = api.statistics()

    CP.loginAsAdministrator()
    CP.openStatistics()

    CP.shouldBe('Total registrados',
        { CP.numberOf(CP.statistic('Total registrados')) },
        expected.users.total as int)

    CP.shouldBe('Baneados',
        { CP.numberOf(CP.statistic('Baneados')) },
        expected.users.banned as int)

    CP.shouldBe('Total en catálogo',
        { CP.numberOf(CP.statistic('Total en catálogo')) },
        expected.phones.total as int)
}

CP.scenario('Publicar un celular sin stock sube el contador Sin stock') {
    CP.startBrowser()

    CP.loginAsAdministrator()
    CP.openStatistics()

    int initialOutOfStock = CP.numberOf(CP.statistic('Sin stock'))
    int initialTotal = CP.numberOf(CP.statistic('Total en catálogo'))

    Map phone = Api.newPhone()
    phone.stock = 0

    try {
        api.publish(phone)

        CP.openStatistics()

        CP.shouldBe('Sin stock después de publicar un celular sin stock',
            { CP.numberOf(CP.statistic('Sin stock')) },
            initialOutOfStock + 1)

        CP.shouldBe('Total en catálogo después de publicar un celular',
            { CP.numberOf(CP.statistic('Total en catálogo')) },
            initialTotal + 1)
    } finally {
        api.deleteIfExists(phone)
    }
}

CP.scenario('Banear a un cliente sube el contador Baneados') {
    CP.startBrowser()

    Map customer = api.register(Api.newCustomer('Carlos'))

    CP.loginAsAdministrator()
    CP.openStatistics()

    int initialBanned = CP.numberOf(CP.statistic('Baneados'))

    CP.banUser(customer.email, 'Contracargos repetidos')
    CP.openStatistics()

    CP.shouldBe('Baneados después de bloquear un cliente',
        { CP.numberOf(CP.statistic('Baneados')) },
        initialBanned + 1)
}

CP.scenario('Un cliente no puede abrir las estadísticas') {
    CP.startBrowser()

    Map customer = api.register(Api.newCustomer('Carlos'))

    CP.login(customer.email, customer.password)
    CP.open('/admin/stats')

    CP.shouldBe('Título de acceso no autorizado',
        { CP.textOf(CP.HEADING) },
        'Acceso no autorizado')
}

CP.finish()