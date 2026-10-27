import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

/*
 * ESC-28 — Consultar usuarios.
 * Como administradora de CelularPro, quiero ver y buscar las cuentas
 * registradas, para encontrar rápido a un cliente.
 */
Api api = Api.loginAsAdministrator()
CP.begin()

CP.scenario('La administradora ve cuántos usuarios hay registrados') {
    int totalAccordingToTheApi = api.totalUsers()
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openUsers()
    CP.shouldBe('usuarios registrados que muestra la página', { CP.registeredUsersShown() }, totalAccordingToTheApi)
}

CP.scenario('Buscar a un cliente por su correo') {
    Map carlos = api.register(Api.newCustomer('Carlos'))
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openUsers()
    CP.searchUsers(carlos.email)
    CP.shouldBe('correos en la tabla', { CP.textsOf(CP.USER_EMAILS) }, [carlos.email])
    CP.shouldBe('rol del cliente', { CP.textOf(CP.roleOf(carlos.email)) }, 'Usuario')
    CP.shouldBe('estado del cliente', { CP.textOf(CP.statusOf(carlos.email)) }, 'Activo')
}

CP.scenario('Una búsqueda sin coincidencias deja la tabla vacía') {
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openUsers()
    CP.searchUsers('nadie-se-llama-asi')
    CP.shouldBe('filas en la tabla', { CP.count(CP.ROWS) }, 0)
}

CP.scenario('Un cliente no puede abrir la gestión de usuarios') {
    Map carlos = api.register(Api.newCustomer('Carlos'))
    CP.startBrowser()
    CP.login(carlos.email, carlos.password)
    CP.open('/admin/users')
    CP.shouldBe('título de la página', { CP.textOf(CP.HEADING) }, 'Acceso no autorizado')
}

CP.finish()
