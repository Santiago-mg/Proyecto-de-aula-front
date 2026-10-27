# Escenarios exportados desde Autify Nexus

Guarda aquí cada escenario exportado con **Export → Export to Playwright Code** (archivo `.js`).
`npm run test:exportados` los ejecuta con la misma configuración, y en CI quedan en ReportPortal.

- No edites a mano un exportado que se vaya a volver a importar: corrígelo en Nexus y exporta otra vez.
- Si el escenario tiene el paso *Assert page visual change*, la primera ejecución necesita `--update-snapshots`.
