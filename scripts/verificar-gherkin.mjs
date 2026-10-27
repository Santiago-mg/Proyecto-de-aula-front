#!/usr/bin/env node
// Verifica, sin navegador, que cada paso de cypress/gherkin/features tenga
// EXACTAMENTE una definición en cypress/gherkin/pasos (ni indefinidos ni ambiguos).
// Expande los "Esquema del escenario" con sus Ejemplos, igual que Cucumber.
//
//   node scripts/verificar-gherkin.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { AstBuilder, GherkinClassicTokenMatcher, Parser, compile } from '@cucumber/gherkin'
import { IdGenerator } from '@cucumber/messages'
import { CucumberExpression, ParameterTypeRegistry } from '@cucumber/cucumber-expressions'

const RAIZ = 'cypress/gherkin'
const archivos = (dir, ext) => readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => join(dir, f))

// Definiciones: Given/When/Then('expresión', ...)
const registro = new ParameterTypeRegistry()
const definiciones = archivos(`${RAIZ}/pasos`, '.ts').flatMap((f) =>
  [...readFileSync(f, 'utf8').matchAll(/\b(?:Given|When|Then)\(\s*'((?:\\'|[^'])*)'/g)].map((m) => ({
    texto: m[1],
    expr: new CucumberExpression(m[1], registro),
  })),
)

let pasos = 0
let escenarios = 0
const problemas = []
const usadas = new Set()
const caracteristicas = archivos(`${RAIZ}/features`, '.feature')
for (const archivo of caracteristicas) {
  const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher('es'))
  const documento = parser.parse(readFileSync(archivo, 'utf8'))
  for (const pickle of compile(documento, archivo, IdGenerator.uuid())) {
    escenarios++
    for (const paso of pickle.steps) {
      pasos++
      const coinciden = definiciones.filter((d) => d.expr.match(paso.text))
      coinciden.forEach((d) => usadas.add(d.texto))
      if (coinciden.length !== 1) {
        problemas.push(`${coinciden.length === 0 ? 'SIN DEFINICIÓN' : 'AMBIGUO'} · ${archivo} · "${pickle.name}" · ${paso.text}`)
      }
    }
  }
}

console.log(`Características: ${caracteristicas.length} · escenarios ejecutables: ${escenarios} · pasos: ${pasos} · definiciones: ${definiciones.length}`)
const sinUso = definiciones.filter((d) => !usadas.has(d.texto)).map((d) => d.texto)
if (sinUso.length) console.log(`Definiciones sin usar (${sinUso.length}): ${sinUso.join(' | ')}`)
if (problemas.length) {
  console.error(problemas.join('\n'))
  process.exit(1)
}
console.log('✔ Cada paso tiene exactamente una definición.')
