// Conecta Cypress con ReportPortal en UN solo launch por corrida.
//
// Cypress ejecuta cada spec por separado y, por defecto, el agente abriría un
// launch por archivo. Se sigue el método que recomienda el agente
// ("Report a single launch"): se abre el launch antes de la corrida con
// @reportportal/client-javascript, se pasa su launchId al reporter de cada
// spec y se cierra en 'after:run'. (autoMerge está marcado como inestable con
// --spec, que es justo como corren los scripts cy:api y cy:e2e.)

const RPClient = require('@reportportal/client-javascript')
const registerReportPortalPlugin = require('@reportportal/agent-js-cypress/lib/plugin')
const rp = require('./config.cjs')

/**
 * @param {Function} on      el `on` de setupNodeEvents
 * @param {object}   config  el `config` de setupNodeEvents
 * @param {object}   opciones  rp.opciones(...) ya armadas
 * @returns {Promise<object>} lo que setupNodeEvents debe devolver
 */
async function conectarCypress(on, config, opciones) {
  if (!rp.activo()) return config

  const cliente = new RPClient({ ...opciones, autoMerge: false })
  const { tempId, promise } = cliente.startLaunch({
    name: opciones.launch,
    description: opciones.description,
    attributes: opciones.attributes,
  })
  const { id: launchId } = await promise

  on('after:run', async () => {
    await cliente.finishLaunch(tempId, {}).promise
  })

  registerReportPortalPlugin(on, config)

  return { ...config, reporterOptions: { ...config.reporterOptions, launchId } }
}

module.exports = { conectarCypress }
