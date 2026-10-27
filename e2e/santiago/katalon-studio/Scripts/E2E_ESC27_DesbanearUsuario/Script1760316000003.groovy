import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

/*
 * ESC-27 — Desbanear usuario.
 * Como administradora de CelularPro, quiero reactivar la cuenta de un cliente
 * suspendido, para que pueda volver a comprar cuando se resuelva su caso.
 */
Api api = Api.loginAsAdministrator()
CP.begin()

CP.scenario('Un cliente suspendido no puede iniciar sesión') {
    Map carlos = api.register(Api.newCustomer('Carlos'))
    api.ban(carlos, 'Spam')
    CP.startBrowser()
    CP.tryLogin(carlos.email, carlos.password)
    CP.shouldBe('mensaje al intentar ingresar', { CP.textOf(CP.LOGIN_ERROR) },
        'Tu cuenta ha sido suspendida. Motivo: Spam')
}

CP.scenario('Un cliente reactivado puede volver a iniciar sesión') {
    Map carlos = api.register(Api.newCustomer('Carlos'))
    api.ban(carlos, 'Spam')
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.unbanUser(carlos.email)
    CP.shouldBe('estado del cliente', { CP.textOf(CP.statusOf(carlos.email)) }, 'Activo')
    CP.shouldBe('ya no muestra motivo de baneo', { CP.isPresent(CP.banReasonOf(carlos.email)) }, false)

    CP.switchBrowser()
    CP.login(carlos.email, carlos.password)
    CP.shouldBe('saludo de Mi cuenta', { CP.textOf(CP.GREETING) }, 'Hola, Carlos')
}

CP.finish()
