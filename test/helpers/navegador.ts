// Lo que jsdom no trae y la app usa. Se deja la versión más simple que
// mantiene el comportamiento del navegador real.

// framer-motion (whileInView) observa la visibilidad de los elementos:
// en pruebas todo cuenta como visible desde el primer momento.
class IntersectionObserverDePrueba {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = [0]
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    const entrada = { isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry
    this.callback([entrada], this)
  }
  unobserve() {
    // no hay nada que dejar de observar
  }
  disconnect() {
    // no hay nada que desconectar
  }
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

globalThis.IntersectionObserver ??= IntersectionObserverDePrueba as unknown as typeof IntersectionObserver

// jsdom no tiene WebGL: getContext devuelve null, como un navegador sin
// aceleración gráfica. ShaderBackground ya contempla ese caso.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
