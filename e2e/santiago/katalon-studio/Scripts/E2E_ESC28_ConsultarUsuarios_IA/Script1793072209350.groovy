import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

Api api = Api.loginAsAdministrator()
CP.begin()

CP.scenario('El total de la página coincide con la API') {
    int totalFromApi = api.totalUsers()

    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openUsers()

    CP.shouldBe(
        'el total de usuarios mostrado coincide con la API',
        { CP.registeredUsersShown() },
        totalFromApi
    )
}

CP.scenario('Buscar a un cliente por su correo') {
    Map customer = api.register(Api.newCustomer('Carlos'))

    try {
        CP.startBrowser()
        CP.loginAsAdministrator()
        CP.openUsers()

        String email = customer.email as String
        String emailPrefix = email.split('@')[0]

        CP.searchUsers(emailPrefix)

        CP.shouldBe(
            'la tabla muestra únicamente el correo del cliente',
            { CP.textsOf(CP.USER_EMAILS) },
            [email]
        )
        CP.shouldBe(
            'el rol del cliente es Usuario',
            { CP.textOf(CP.roleOf(email)) },
            'Usuario'
        )
        CP.shouldBe(
            'el estado del cliente es Activo',
            { CP.textOf(CP.statusOf(email)) },
            'Activo'
        )
    } finally {
        api.delete(customer)
    }
}

CP.scenario('Una búsqueda sin coincidencias muestra el aviso') {
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openUsers()
    CP.searchUsers('nadie-se-llama-asi')

    CP.shouldBe(
        'no hay filas de usuarios',
        { CP.count(CP.ROWS) },
        0
    )
    CP.shouldBe(
        'se muestra el aviso de usuarios no encontrados',
        { CP.isPresent(CP.NO_USERS_FOUND) },
        true
    )
}

CP.scenario('La cuenta de la administradora está marcada y no se puede banear') {
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openUsers()
    CP.searchUsers(CP.ADMIN_EMAIL)

    CP.shouldBe(
        'la cuenta de la administradora está marcada como propia',
        { CP.isPresent(CP.ownAccountMark(CP.ADMIN_EMAIL)) },
        true
    )
    CP.shouldBe(
        'la cuenta de la administradora no tiene botón Banear',
        { CP.isPresent(CP.banButtonOf(CP.ADMIN_EMAIL)) },
        false
    )
}

CP.scenario('Un cliente no puede abrir la gestión de usuarios') {
    Map customer = api.register(Api.newCustomer('Carlos'))

    try {
        CP.startBrowser()
        CP.login(customer.email, customer.password)
        CP.open('/admin/users')

        CP.shouldBe(
            'se muestra el título de acceso no autorizado',
            { CP.textOf(CP.HEADING) },
            'Acceso no autorizado'
        )
    } finally {
        api.delete(customer)
    }
}

CP.finish()