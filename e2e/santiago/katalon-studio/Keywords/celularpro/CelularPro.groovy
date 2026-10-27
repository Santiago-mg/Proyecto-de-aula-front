package celularpro

import com.kms.katalon.core.model.FailureHandling
import com.kms.katalon.core.testobject.ConditionType
import com.kms.katalon.core.testobject.TestObject
import com.kms.katalon.core.util.KeywordUtil
import com.kms.katalon.core.webui.keyword.WebUiBuiltInKeywords as WebUI

/**
 * Pasos reutilizables de la interfaz de CelularPro. Los selectores son los
 * mismos de la suite de ScreenPy; aquí no hace falta grabar nada ni usar el
 * Object Repository: cada selector se convierte en un TestObject al vuelo.
 */
class CelularPro {

    static final String FRONT_URL = System.getenv('E2E_FRONT_URL') ?: 'http://localhost:8081'
    static final String ADMIN_EMAIL = CelularProApi.ADMIN_EMAIL
    static final String ADMIN_PASSWORD = CelularProApi.ADMIN_PASSWORD
    static final int WAIT = 10

    // ── Selectores ──
    static final String LOGIN_EMAIL = '#email'
    static final String LOGIN_PASSWORD = '#password'
    static final String SUBMIT = 'form button[type="submit"]'
    static final String LOGIN_ERROR = 'form > p:not(.cp-field-error), form [role="alert"] .cp-error-msg'
    static final String GREETING = "//h1[starts-with(normalize-space(), 'Hola,')]"
    static final String HEADING = 'h1'

    static final String ROWS = "//table[contains(@class, 'cp-admin-table')]/tbody/tr"
    static final String ADMIN_TABLE = 'table.cp-admin-table'
    // Sin coincidencias la tabla desaparece y la página muestra este aviso.
    static final String NO_USERS_FOUND = "//p[contains(normalize-space(), 'Ningún usuario coincide')]"
    static final String USER_SEARCH = 'input[placeholder="Buscar por nombre o email..."]'
    static final String USERS_TOTAL = "//div[contains(normalize-space(),'usuarios registrados') and not(*)]"
    static final String USER_EMAILS = ROWS + '/td[1]/div/div[2]/div[2]'
    static final String BAN_REASON_FIELD = '#motivo-baneo'
    static final String BAN_CONFIRM = "//div[contains(@class, 'cp-modal')]//button[normalize-space()='Confirmar baneo']"

    static final String DETAIL_NAME = 'h1.cp-detail-name'
    static final String DETAIL_PRICE = '.cp-detail-price'
    static final String RECOMMENDATIONS = "//section[@aria-labelledby='titulo-similares']"
    static final String RECOMMENDED_NAMES = RECOMMENDATIONS + "//h3[contains(@class, 'cp-phone-card-name')]"

    static final String PHONE_NAME = '#name'
    static final String PHONE_SLUG = '#slug'
    static final String PHONE_BRAND = '#brand'
    static final String PHONE_CATEGORY = '#categoryId'
    static final String PHONE_PRICE = '#price'
    static final String PHONE_STOCK = '#stock'

    static String userRow(String email) { return "${ROWS}[td[1]//div[normalize-space()='${email}']]" }
    static String statusOf(String email) { return userRow(email) + "/td[5]//span[contains(@class, 'cp-badge')]" }
    static String roleOf(String email) { return userRow(email) + '/td[2]/span' }
    static String banReasonOf(String email) { return userRow(email) + '/td[5]/div/div' }
    static String ownAccountMark(String email) { return userRow(email) + "//span[normalize-space()='(tú)']" }
    static String banButtonOf(String email) { return userRow(email) + "//button[normalize-space()='Banear']" }
    static String unbanButtonOf(String email) { return userRow(email) + "//button[normalize-space()='Desbanear']" }

    static String recommendation(String name) { return RECOMMENDATIONS + "//a[.//h3[normalize-space()='${name}']]" }
    static String notice(String text) { return "//*[self::h1 or self::h2][normalize-space()='${text}']" }

    static String phoneRow(String name) { return "${ROWS}[td[1]//span[normalize-space()='${name}']]" }
    static String editButtonOf(String name) { return phoneRow(name) + "//a[@title='Editar']" }
    static String deleteButtonOf(String name) { return phoneRow(name) + "//button[@title='Eliminar']" }

    static String indicator(String label) {
        return "//div[contains(@class, 'cp-kpi-card')][div[contains(@class, 'cp-kpi-label')][normalize-space()='${label}']]" +
            "/div[contains(@class, 'cp-kpi-value')]"
    }
    static String statistic(String label) {
        return "//div[contains(@class, 'cp-stats-detail-row')][*[normalize-space()='${label}']]" +
            "/*[contains(@class, 'cp-stats-detail-value')]"
    }

    // ── Navegador ──

    static void startBrowser() {
        WebUI.openBrowser('')
        WebUI.setViewPortSize(1440, 1000)
    }

    /** Cambia de persona: cierra el navegador y abre otro sin sesión. */
    static void switchBrowser() {
        WebUI.closeBrowser()
        startBrowser()
    }

    static void open(String path) {
        WebUI.navigateToUrl(FRONT_URL + path)
    }

    // ── Lectura de la página (con JavaScript, sin excepciones si no está) ──

    private static final String FIND_JS = '''
function cpFind(sel) {
  if (sel.charAt(0) === '/' || sel.charAt(0) === '(') {
    var out = [];
    var r = document.evaluate(sel, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (var i = 0; i < r.snapshotLength; i++) { out.push(r.snapshotItem(i)); }
    return out;
  }
  return Array.prototype.slice.call(document.querySelectorAll(sel));
}
'''

    private static List run(String body, String selector) {
        def result = WebUI.executeJavaScript(FIND_JS + body, [selector.toString()])
        return (result ?: []) as List
    }

    /** Los textos tal como están escritos (el CSS pone algunos en mayúsculas). */
    static List<String> textsOf(String selector) {
        return run('return cpFind(arguments[0]).map(function (e) { return e.textContent; });', selector)
            .collect { it == null ? '' : it.toString().replaceAll(/\s+/, ' ').trim() }
    }

    static String textOf(String selector) {
        List<String> texts = textsOf(selector)
        return texts.isEmpty() ? null : texts[0]
    }

    static String valueOf(String selector) {
        List values = run('return cpFind(arguments[0]).map(function (e) { return e.value; });', selector)
        return values.isEmpty() ? null : values[0]?.toString()
    }

    static int count(String selector) {
        return run('return cpFind(arguments[0]).map(function (e) { return 1; });', selector).size()
    }

    static boolean isPresent(String selector) {
        return count(selector) > 0
    }

    static boolean isDisabled(String selector) {
        List flags = run('return cpFind(arguments[0]).map(function (e) { return !!e.disabled; });', selector)
        return !flags.isEmpty() && flags[0] == true
    }

    /** "$199.000 COP" -> 199000 */
    static int numberOf(String selector) {
        String text = textOf(selector)
        return text == null ? -1 : text.replaceAll(/\D/, '') as int
    }

    // ── Esperas ──

    static boolean waitUntilPresent(String selector, int seconds = WAIT) {
        long end = System.currentTimeMillis() + seconds * 1000L
        while (System.currentTimeMillis() < end) {
            if (isPresent(selector)) { return true }
            Thread.sleep(250)
        }
        return isPresent(selector)
    }

    static boolean waitUntilGone(String selector, int seconds = WAIT) {
        long end = System.currentTimeMillis() + seconds * 1000L
        while (System.currentTimeMillis() < end) {
            if (!isPresent(selector)) { return true }
            Thread.sleep(250)
        }
        return !isPresent(selector)
    }

    static void mustAppear(String selector) {
        if (!waitUntilPresent(selector)) {
            throw new AssertionError("No apareció en ${WAIT} segundos: ${selector}".toString())
        }
    }

    // ── Acciones ──

    static TestObject by(String selector) {
        TestObject object = new TestObject(selector)
        boolean isXpath = selector.startsWith('/') || selector.startsWith('(')
        object.addProperty(isXpath ? 'xpath' : 'css', ConditionType.EQUALS, selector)
        return object
    }

    /** Baja hasta el elemento de golpe (la página tiene scroll suave y eso estorba al hacer clic). */
    static void scrollTo(String selector) {
        mustAppear(selector)
        WebUI.executeJavaScript(
            "arguments[0].scrollIntoView({block: 'center', behavior: 'instant'})",
            [WebUI.findWebElement(by(selector), WAIT)])
    }

    static void click(String selector) {
        scrollTo(selector)
        WebUI.click(by(selector))
    }

    static void type(String selector, String text) {
        mustAppear(selector)
        WebUI.setText(by(selector), text)
    }

    static void selectByLabel(String selector, String label) {
        mustAppear(selector)
        WebUI.selectOptionByLabel(by(selector), label, false)
    }

    // ── Verificaciones ──

    /**
     * Espera a que el valor llegue (la app carga cosas por la API) y entonces
     * lo compara. Si no llega, la verificación falla pero la prueba sigue.
     */
    static void shouldBe(String description, Closure actual, Object expected, int seconds = WAIT) {
        Object value = null
        long end = System.currentTimeMillis() + seconds * 1000L
        while (true) {
            try { value = actual.call() } catch (Throwable ignored) { value = null }
            if (value == expected || System.currentTimeMillis() > end) { break }
            Thread.sleep(300)
        }
        WebUI.comment("Verifica: ${description}".toString())
        WebUI.verifyEqual(value, expected, FailureHandling.CONTINUE_ON_FAILURE)
    }

    // ── Escenarios ──

    private static List<String> failures = []

    static void begin() {
        failures = []
    }

    /** Corre un escenario; si algo se rompe, lo anota y sigue con el siguiente. */
    static void scenario(String name, Closure body) {
        WebUI.comment("Escenario: ${name}".toString())
        try {
            body.call()
        } catch (Throwable error) {
            failures << "${name} -> ${error.message}".toString()
            try { WebUI.takeScreenshot() } catch (Throwable ignored) { }
        } finally {
            try { WebUI.closeBrowser() } catch (Throwable ignored) { }
        }
    }

    static void finish() {
        if (!failures.isEmpty()) {
            KeywordUtil.markFailed(failures.join(' | '))
        }
    }

    // ── Pasos de CelularPro ──

    static void tryLogin(String email, String password) {
        open('/login')
        type(LOGIN_EMAIL, email)
        type(LOGIN_PASSWORD, password)
        click(SUBMIT)
    }

    static void login(String email, String password) {
        tryLogin(email, password)
        mustAppear(GREETING)
    }

    static void loginAsAdministrator() {
        login(ADMIN_EMAIL, ADMIN_PASSWORD)
    }

    static void openPhone(String slug) { open("/phones/${slug}".toString()) }

    static void openUsers() {
        open('/admin/users')
        mustAppear(USER_SEARCH)
    }

    static void openDashboard() {
        open('/admin')
        mustAppear(indicator('Usuarios'))
    }

    static void openStatistics() {
        open('/admin/stats')
        mustAppear(statistic('Baneados'))
    }

    static void openCatalog() {
        open('/admin/phones')
        mustAppear(ADMIN_TABLE)
    }

    static void searchUsers(String term) {
        type(USER_SEARCH, term)
        // El buscador espera 400 ms a que se deje de escribir y luego repinta la tabla
        // (o, si nadie coincide, la reemplaza por el aviso "Ningún usuario coincide...").
        Thread.sleep(600)
        mustAppear("//table[contains(@class, 'cp-admin-table')] | ${NO_USERS_FOUND}".toString())
    }

    static void startBanning(String email, String reason) {
        openUsers()
        searchUsers(email)
        click(banButtonOf(email))
        type(BAN_REASON_FIELD, reason)
    }

    static void banUser(String email, String reason) {
        startBanning(email, reason)
        click(BAN_CONFIRM)
        // Al quedar baneado, el botón de su fila pasa a decir "Desbanear".
        mustAppear(unbanButtonOf(email))
    }

    static void unbanUser(String email) {
        openUsers()
        searchUsers(email)
        click(unbanButtonOf(email))
        mustAppear(banButtonOf(email))
    }

    static List<String> recommendedNames() { return textsOf(RECOMMENDED_NAMES) }

    static int registeredUsersShown() {
        String text = textOf(USERS_TOTAL)
        return text == null ? -1 : text.split(' ')[0] as int
    }

    static void fillPhoneForm(Map phone) {
        open('/admin/phones/new')
        mustAppear(PHONE_NAME)
        type(PHONE_NAME, phone.name)
        type(PHONE_SLUG, phone.slug)
        type(PHONE_BRAND, phone.brand)
        selectByLabel(PHONE_CATEGORY, phone.categoryLabel)
        type(PHONE_PRICE, phone.price.toString())
        type(PHONE_STOCK, phone.stock.toString())
        click(SUBMIT)
    }

    static void publishPhone(Map phone) {
        fillPhoneForm(phone)
        // Si se guardó, el formulario la devuelve a la tabla del catálogo.
        mustAppear(phoneRow(phone.name))
    }

    static void changePrice(Map phone, int newPrice) {
        openCatalog()
        click(editButtonOf(phone.name))
        // El formulario de edición carga los datos del celular por la API.
        shouldBe('el formulario cargó el celular', { valueOf(PHONE_NAME) }, phone.name)
        type(PHONE_PRICE, newPrice.toString())
        click(SUBMIT)
        mustAppear(ADMIN_TABLE)
    }

    static void deletePhone(Map phone) {
        openCatalog()
        click(deleteButtonOf(phone.name))
        // La tabla pide confirmar con un diálogo del navegador: se acepta.
        if (WebUI.waitForAlert(5)) {
            WebUI.acceptAlert()
        }
        if (!waitUntilGone(phoneRow(phone.name))) {
            throw new AssertionError("El celular sigue en la tabla: ${phone.name}".toString())
        }
    }
}
