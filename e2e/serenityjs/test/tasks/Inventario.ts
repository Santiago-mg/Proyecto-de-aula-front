import { Task, Wait } from '@serenity-js/core';
import { Clear, Click, Enter, Scroll, Select } from '@serenity-js/web';
import { isPresent } from '@serenity-js/assertions';
import { equals } from '@serenity-js/assertions';

import { Currently } from '../questions/Preguntas';
import { AdminAlertsPage, PhoneForm } from '../ui/Pages';
import { Visit } from './Sesion';

/** Crea un celular desde el panel con el stock y el umbral indicados. */
export const CreatePhone = {
  named: (nombre: string) => ({
    withStock: (stock: number) => ({
      andMinimum: (minimo: number) => Task.where(
        `#actor crea "${ nombre }" con stock ${ stock } y mínimo ${ minimo }`,
        Visit.path('/admin/phones/new'),
        Wait.until(PhoneForm.nombre(), isPresent()),
        Scroll.to(PhoneForm.nombre()),
        Enter.theValue(nombre).into(PhoneForm.nombre()),
        Enter.theValue(nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')).into(PhoneForm.slug()),
        Enter.theValue('Samsung').into(PhoneForm.marca()),
        Select.value('samsung').from(PhoneForm.categoria()),
        Enter.theValue('2500000').into(PhoneForm.precio()),
        Enter.theValue(String(stock)).into(PhoneForm.stock()),
        Clear.theValueOf(PhoneForm.stockMinimo()),
        Enter.theValue(String(minimo)).into(PhoneForm.stockMinimo()),
        Click.on(PhoneForm.crear()),
        Wait.until(Currently.path(), equals('/admin/phones')),
      ),
    }),
  }),
};

/** Repone inventario desde el enlace "Reponer" de la alerta: abre el celular y cambia su stock. */
export const RestockFromAlert = {
  of: (nombre: string, nuevoStock: number) => Task.where(
    `#actor repone "${ nombre }" a ${ nuevoStock } unidades`,
    Visit.path('/admin/alerts'),
    Click.on(AdminAlertsPage.reponer(nombre)),
    Wait.until(PhoneForm.stock(), isPresent()),
        Scroll.to(PhoneForm.stock()),
    Clear.theValueOf(PhoneForm.stock()),
    Enter.theValue(String(nuevoStock)).into(PhoneForm.stock()),
    Click.on(PhoneForm.guardar()),
    Wait.until(Currently.path(), equals('/admin/phones')),
  ),
};
