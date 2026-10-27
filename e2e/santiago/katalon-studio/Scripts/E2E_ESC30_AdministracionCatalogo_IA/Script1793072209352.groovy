import celularpro.CelularPro as CP
import celularpro.CelularProApi as Api

Api api = Api.loginAsAdministrator()

CP.begin()

CP.scenario('Publicar un celular lo muestra en la tienda') {
    CP.startBrowser()
    CP.loginAsAdministrator()

    Map phone = Api.newPhone()

    try {
        CP.publishPhone(phone)
        CP.switchBrowser()
        CP.openPhone(phone.slug)

        CP.shouldBe('el nombre del celular publicado', {
            CP.textOf(CP.DETAIL_NAME)
        }, phone.name)

        CP.shouldBe('el precio del celular publicado', {
            CP.numberOf(CP.DETAIL_PRICE)
        }, 199000)
    } finally {
        api.deleteIfExists(phone)
    }
}

CP.scenario('El formulario vacío muestra los errores de validación') {
    CP.startBrowser()
    CP.loginAsAdministrator()

    CP.open('/admin/phones/new')
    CP.mustAppear(CP.PHONE_NAME)
    CP.click(CP.SUBMIT)

    CP.shouldBe('los errores de validación del formulario vacío', {
        CP.textsOf('.cp-field-error')
    }, [
        'Mínimo 3 caracteres',
        'Mínimo 3 caracteres',
        'Requerido',
        'Requerido',
        'Debe ser positivo'
    ])
}

CP.scenario('Cambiar el precio de un celular') {
    CP.startBrowser()

    Map phone = Api.newPhone()

    try {
        api.publish(phone)
        CP.loginAsAdministrator()
        CP.changePrice(phone, 179000)

        CP.switchBrowser()
        CP.openPhone(phone.slug)

        CP.shouldBe('el precio actualizado del celular', {
            CP.numberOf(CP.DETAIL_PRICE)
        }, 179000)
    } finally {
        api.deleteIfExists(phone)
    }
}

CP.scenario('Retirar un celular del catálogo') {
    CP.startBrowser()

    Map phone = Api.newPhone()

    try {
        api.publish(phone)
        CP.loginAsAdministrator()
        CP.deletePhone(phone)

        CP.openCatalog()

        CP.shouldBe('el celular retirado no aparece en el catálogo', {
            CP.isPresent(CP.phoneRow(phone.name))
        }, false)

        CP.switchBrowser()
        CP.openPhone(phone.slug)

        CP.shouldBe('el aviso de celular no encontrado', {
            CP.isPresent(CP.notice('Celular no encontrado'))
        }, true)
    } finally {
        api.deleteIfExists(phone)
    }
}

CP.scenario('El slug de otro celular no se puede reutilizar') {
    CP.startBrowser()
    CP.loginAsAdministrator()

    Map phone = Api.newPhone()
    phone.slug = 'iphone-14'

    CP.open('/admin/phones/new')
    CP.mustAppear(CP.PHONE_NAME)
    CP.fillPhoneForm(phone)

    CP.shouldBe('el mensaje de slug duplicado', {
        CP.textOf(CP.LOGIN_ERROR)
    }, 'Ya existe un celular con ese slug')
}

CP.finish()