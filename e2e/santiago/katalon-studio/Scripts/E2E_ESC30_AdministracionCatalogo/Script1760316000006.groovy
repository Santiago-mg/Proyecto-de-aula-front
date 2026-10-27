import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

/*
 * ESC-30 — Administración del catálogo.
 * Como administradora de CelularPro, quiero publicar, editar y retirar
 * celulares, para que la tienda muestre siempre el inventario real.
 */
Api api = Api.loginAsAdministrator()
CP.begin()

CP.scenario('Un celular publicado aparece en la tienda') {
    Map phone = Api.newPhone()
    try {
        CP.startBrowser()
        CP.loginAsAdministrator()
        CP.publishPhone(phone)
        CP.openCatalog()
        CP.shouldBe('el celular está en la tabla', { CP.isPresent(CP.phoneRow(phone.name)) }, true)

        CP.switchBrowser()
        CP.openPhone(phone.slug)
        CP.shouldBe('nombre en la ficha', { CP.textOf(CP.DETAIL_NAME) }, phone.name)
        CP.shouldBe('precio en la ficha', { CP.textOf(CP.DETAIL_PRICE) }, '$199.000 COP')
    } finally {
        api.deleteIfExists(phone)
    }
}

CP.scenario('Cambiar el precio de un celular') {
    Map phone = api.publish(Api.newPhone())
    try {
        CP.startBrowser()
        CP.loginAsAdministrator()
        CP.changePrice(phone, 179000)

        CP.switchBrowser()
        CP.openPhone(phone.slug)
        CP.shouldBe('precio en la ficha', { CP.textOf(CP.DETAIL_PRICE) }, '$179.000 COP')
    } finally {
        api.deleteIfExists(phone)
    }
}

CP.scenario('Retirar un celular del catálogo') {
    Map phone = api.publish(Api.newPhone())
    try {
        CP.startBrowser()
        CP.loginAsAdministrator()
        CP.deletePhone(phone)
        CP.openCatalog()
        CP.shouldBe('el celular ya no está en la tabla', { CP.isPresent(CP.phoneRow(phone.name)) }, false)

        CP.switchBrowser()
        CP.openPhone(phone.slug)
        CP.shouldBe('aviso en la ficha', { CP.isPresent(CP.notice('Celular no encontrado')) }, true)
    } finally {
        api.deleteIfExists(phone)
    }
}

CP.scenario('El slug de otro celular no se puede reutilizar') {
    // No se publica nada: el slug ya es del iPhone 14 del seed, así que no hay nada que limpiar.
    Map phone = Api.newPhone()
    phone.slug = 'iphone-14'
    CP.startBrowser()
    CP.loginAsAdministrator()
    CP.fillPhoneForm(phone)
    CP.shouldBe('error del formulario', { CP.textOf(CP.LOGIN_ERROR) }, 'Ya existe un celular con ese slug')
}

CP.finish()
