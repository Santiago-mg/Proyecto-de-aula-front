import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

Api api = Api.loginAsAdministrator()

CP.begin()

CP.scenario('Un cliente suspendido ve el motivo al intentar entrar') {
    CP.startBrowser()

    def cliente
    try {
        cliente = api.register(Api.newCustomer('Carlos'))
        api.ban(cliente, 'Fraude en pagos')

        CP.tryLogin(cliente.email, cliente.password)

        CP.shouldBe(
            'el mensaje indica el motivo de suspensión',
            { CP.textOf(CP.LOGIN_ERROR) },
            'Tu cuenta ha sido suspendida. Motivo: Fraude en pagos'
        )
    } finally {
        if (cliente != null) {
            api.unban(cliente.email)
        }
    }
}

CP.scenario('La administradora reactiva a un cliente desde la tabla') {
    CP.startBrowser()

    def cliente
    try {
        cliente = api.register(Api.newCustomer('Carlos'))
        api.ban(cliente, 'Spam')

        CP.loginAsAdministrator()
        CP.unbanUser(cliente.email)

        CP.shouldBe(
            'el estado del cliente es Activo',
            { CP.textOf(CP.statusOf(cliente.email)) },
            'Activo'
        )

        CP.shouldBe(
            'el motivo de baneo no está presente',
            { CP.isPresent(CP.banReasonOf(cliente.email)) },
            false
        )

        CP.shouldBe(
            'el botón de Banear está presente',
            { CP.isPresent(CP.banButtonOf(cliente.email)) },
            true
        )
    } finally {
        if (cliente != null) {
            api.unban(cliente.email)
        }
    }
}

CP.scenario('Un cliente reactivado vuelve a iniciar sesión') {
    CP.startBrowser()

    def cliente
    try {
        cliente = api.register(Api.newCustomer('Carlos'))
        api.ban(cliente, 'Spam')

        CP.loginAsAdministrator()
        CP.unbanUser(cliente.email)

        CP.switchBrowser()
        CP.login(cliente.email, cliente.password)

        CP.shouldBe(
            'el cliente reactivado ve el saludo de Mi cuenta',
            { CP.textOf(CP.GREETING) },
            'Hola, Carlos'
        )
    } finally {
        if (cliente != null) {
            api.unban(cliente.email)
        }
    }
}

CP.finish()	