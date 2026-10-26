// Aplica las preferencias de pantalla (tema, tamaño de texto, movimiento) antes
// de que el navegador pinte nada. Si esto esperara a que cargue React, quien
// eligió el tema claro vería un destello oscuro en cada visita.
// La misma lógica vive en src/context/PreferencesContext.tsx; si se cambia una,
// hay que cambiar la otra.
(function () {
  try {
    var guardado = JSON.parse(localStorage.getItem('cp_prefs') || '{}');
    var raiz = document.documentElement;
    var consulta = function (q) {
      return typeof matchMedia === 'function' && matchMedia(q).matches;
    };
    var tema = guardado.tema;
    if (tema !== 'oscuro' && tema !== 'claro' && tema !== 'contraste') {
      tema = consulta('(prefers-contrast: more)')
        ? 'contraste'
        : consulta('(prefers-color-scheme: light)')
          ? 'claro'
          : 'oscuro';
    }
    raiz.setAttribute('data-tema', tema);
    raiz.setAttribute('data-tamano', guardado.tamano === 115 || guardado.tamano === 130 ? String(guardado.tamano) : '100');
    raiz.setAttribute(
      'data-movimiento',
      guardado.movimiento === 'reducido' || consulta('(prefers-reduced-motion: reduce)') ? 'reducido' : 'completo',
    );
  } catch (e) {
    /* sin almacenamiento: se queda el tema por defecto */
  }
})();
