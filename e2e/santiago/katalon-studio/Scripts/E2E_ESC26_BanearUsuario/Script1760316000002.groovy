import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

/*
 * ESC-26 — Banear usuario.
 * Como administradora de CelularPro, quiero suspender la cuenta de un cliente,
 * para que no pueda volver a ingresar mientras se revisa su caso.
 */
Api api = Api.loginAsAdministrator()
CP.begin()

CP.scenario('Un cliente baneado ya no puede iniciar sesión') {
    Map carlos = api.register(Api.newCustomer('Carlos'))
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.banUser(carlos.email, 'Fraude en pagos')
    CP.shouldBe('estado del cliente', { CP.textOf(CP.statusOf(carlos.email)) }, 'Baneado')
    CP.shouldBe('motivo del baneo', { CP.textOf(CP.banReasonOf(carlos.email)) }, 'Fraude en pagos')

    CP.switchBrowser()
    CP.tryLogin(carlos.email, carlos.password)
    CP.shouldBe('mensaje al intentar ingresar', { CP.textOf(CP.LOGIN_ERROR) },
        'Tu cuenta ha sido suspendida. Motivo: Fraude en pagos')
}

CP.scenario('El motivo del baneo necesita al menos cuatro caracteres') {
    Map carlos = api.register(Api.newCustomer('Carlos'))
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.startBanning(carlos.email, 'abc')
    CP.shouldBe('el botón Confirmar baneo está deshabilitado', { CP.isDisabled(CP.BAN_CONFIRM) }, true)
}

CP.scenario('La administradora no puede banearse a sí misma') {
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openUsers()
    CP.searchUsers(CP.ADMIN_EMAIL)
    CP.shouldBe('su fila muestra "(tú)"', { CP.isPresent(CP.ownAccountMark(CP.ADMIN_EMAIL)) }, true)
    CP.shouldBe('su fila no tiene botón Banear', { CP.isPresent(CP.banButtonOf(CP.ADMIN_EMAIL)) }, false)
}

CP.finish()
