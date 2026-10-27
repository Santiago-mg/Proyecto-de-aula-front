import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

/*
 * ESC-29 — Panel de estadísticas.
 * Como administradora de CelularPro, quiero ver los indicadores de la tienda
 * en un solo lugar, para saber cómo va el negocio sin consultar la base de datos.
 */
Api api = Api.loginAsAdministrator()
CP.begin()

CP.scenario('El panel muestra los totales reales de la tienda') {
    Map accordingToTheApi = api.statistics()
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openDashboard()
    CP.shouldBe('indicador Usuarios', { CP.numberOf(CP.indicator('Usuarios')) }, accordingToTheApi.users.total as int)
    CP.shouldBe('indicador Celulares en catálogo', { CP.numberOf(CP.indicator('Celulares en catálogo')) },
        accordingToTheApi.phones.total as int)
}

CP.scenario('Banear a un cliente se refleja en las estadísticas') {
    Map carlos = api.register(Api.newCustomer('Carlos'))
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openStatistics()
    int bannedBefore = CP.numberOf(CP.statistic('Baneados'))
    CP.banUser(carlos.email, 'Contracargos repetidos')
    CP.openStatistics()
    CP.shouldBe('baneados después de banear', { CP.numberOf(CP.statistic('Baneados')) }, bannedBefore + 1)
}

CP.scenario('Un cliente no puede ver el panel de administración') {
    Map carlos = api.register(Api.newCustomer('Carlos'))
    CP.startBrowser()
    CP.login(carlos.email, carlos.password)
    CP.open('/admin')
    CP.shouldBe('título de la página', { CP.textOf(CP.HEADING) }, 'Acceso no autorizado')
}

CP.finish()
