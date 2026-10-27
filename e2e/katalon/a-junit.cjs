#!/usr/bin/env node
// Convierte evidencia/resultados.json (de ejecutar-selenese.cjs) a JUnit XML,
// el formato que ReportPortal importa (reportportal/importar-junit.mjs).
//
//   node e2e/katalon/a-junit.cjs [entrada.json] [salida.xml]
//
// TC99 falla A PROPÓSITO (demuestra que las aserciones detectan fallos): en
// JUnit se reporta como lo que realmente pasó en el navegador (failure), con
// la propiedad esperadoFallar=true, para que en ReportPortal se clasifique
// como "No Defect" y no ensucie el análisis de errores reales.

const fs = require('node:fs')
const path = require('node:path')

const entrada = process.argv[2] || path.join(__dirname, 'evidencia', 'resultados.json')
const salida = process.argv[3] || path.join(__dirname, 'evidencia', 'junit-katalon.xml')

const escapar = (t) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

if (!fs.existsSync(entrada)) {
  console.error(`No existe ${entrada}. Ejecuta primero: node e2e/katalon/ejecutar-selenese.cjs`)
  process.exit(1)
}
const { fecha, resultados } = JSON.parse(fs.readFileSync(entrada, 'utf8'))
const fallidos = resultados.filter((r) => !r.ok).length
const total = resultados.reduce((s, r) => s + (r.segundos || 0), 0)

const casos = resultados.map((r) => {
  const props = [
    `<property name="pasos" value="${r.pasos}"/>`,
    `<property name="captura" value="${escapar(r.captura)}"/>`,
    `<property name="esperadoFallar" value="${r.esperadoFallar}"/>`,
  ].join('')
  const fallo = r.ok ? '' : `<failure message="${escapar((r.error || 'Falló').split('\n')[0])}" type="SeleneseError">${escapar(r.error)}</failure>`
  return `    <testcase classname="katalon.${escapar(r.nombre.split('_')[0])}" name="${escapar(r.nombre)}" time="${r.segundos || 0}"><properties>${props}</properties>${fallo}</testcase>`
})

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Katalon (Selenese) — CelularPro" tests="${resultados.length}" failures="${fallidos}" time="${total}">
  <testsuite name="Suite_CelularPro_Completa" tests="${resultados.length}" failures="${fallidos}" errors="0" skipped="0" time="${total}" timestamp="${escapar(fecha)}">
${casos.join('\n')}
  </testsuite>
</testsuites>
`
fs.writeFileSync(salida, xml)
console.log(`JUnit de Katalon: ${salida} (${resultados.length} casos, ${fallidos} fallidos)`)
