// Tipos mínimos para los módulos CommonJS de reportportal/ usados desde TypeScript.
declare module '*/reportportal/config.cjs' {
  interface Atributo { key?: string; value: string }
  interface OpcionesRP {
    apiKey: string; endpoint: string; project: string; launch: string; description: string
    attributes: Atributo[]; skippedIssue: boolean; debug: boolean
  }
  const rp: {
    activo(): boolean
    base(): string
    opciones(suite: string, descripcion: string): OpcionesRP
    atributosComunes(): Atributo[]
  }
  export default rp
}
declare module '*/reportportal/cypress.cjs' {
  export function conectarCypress(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
    opciones: Record<string, unknown>,
  ): Promise<Cypress.PluginConfigOptions>
}
