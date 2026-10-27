import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

CP.begin()

CP.scenario('Banear a un cliente con motivo') {
    def api = Api.loginAsAdministrator()
    def customer = api.register(Api.newCustomer('Carlos'))
    def email = customer.email
    def password = customer.password

    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openUsers()

    CP.banUser(email, 'Incumplimiento de las políticas de uso')

    CP.shouldBe(
        'El usuario aparece como baneado',
        { CP.isPresent(CP.unbanButtonOf(email)) },
        true
    )
}

CP.scenario('Sin motivo, el botón de confirmar está deshabilitado') {
    def api = Api.loginAsAdministrator()
    def customer = api.register(Api.newCustomer('Carlos'))
    def email = customer.email

    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.openUsers()
    CP.searchUsers(email)

    CP.startBanning(email, '')

    CP.shouldBe(
        'El botón de confirmar baneo está deshabilitado',
        { CP.isDisabled(CP.BAN_CONFIRM) },
        true
    )
}

CP.scenario('Un cliente normal no puede acceder a la administración de usuarios') {
    def api = Api.loginAsAdministrator()
    def customer = api.register(Api.newCustomer('Carlos'))
    def email = customer.email
    def password = customer.password

    CP.startBrowser()
    CP.login(email, password)
    CP.open('/admin/users')

    CP.shouldBe(
        'Se muestra el encabezado de acceso no autorizado',
        { CP.textOf(CP.HEADING) },
        'Acceso no autorizado'
    )
}

CP.finish()
