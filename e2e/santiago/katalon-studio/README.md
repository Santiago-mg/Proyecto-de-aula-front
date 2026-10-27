# Katalon Studio con StudioAssist (Santiago)

Proyecto de Katalon Studio 11 con las funcionalidades 13, 26, 27, 28, 29 y 30 de CelularPro.

## Cómo abrirlo

1. Katalon Studio → File → Open Project → esta carpeta (`e2e/santiago/katalon-studio`).
2. Levanta la app: front en <http://localhost:8081> y API en <http://localhost:3001/api/v1>
   (con Docker: `docker compose -p celularpro up -d` en la raíz del front).
3. Si Chrome falla con "Webdriver is not up to date": Tools → Update WebDrivers → Chrome.

## Qué trae

| Qué | Dónde |
|---|---|
| Pasos reutilizables de la interfaz (login, usuarios, estadísticas, catálogo) | `Keywords/celularpro/CelularPro.groovy` |
| Llamadas a la API para preparar datos (registrar, banear, desbanear, publicar) | `Keywords/celularpro/CelularProApi.groovy` |
| Casos escritos a mano | `Test Cases/E2E_ESC13_Recomendacion`, `E2E_ESC26_BanearUsuario`, `E2E_ESC27_DesbanearUsuario`, `E2E_ESC28_ConsultarUsuarios`, `E2E_ESC29_PanelEstadisticas`, `E2E_ESC30_AdministracionCatalogo` |
| Casos generados con StudioAssist (herramienta de IA de Katalon) | Los mismos nombres con el sufijo `_IA` |
| Suite | `Test Suites/TS_CelularPro_E2E` |

## Cómo se generaron los casos `_IA`

En cada caso `_IA`, el script lleva como comentario el prompt que se le dio a StudioAssist
(Katalon AI Assistant → Generate Code). El prompt describe la historia, los métodos que puede
usar (solo `CP` y `Api`) y los escenarios. El código que salió se revisó y se corrió contra la
app; el prompt queda al final del script como evidencia.

Lo que se corrigió a mano después de generar:

- Katalon borra los dos `import` del inicio al generar; se vuelven a poner.
- La IA llamó a `api.unban(...)`, que no existía; se agregó a `CelularProApi`.
