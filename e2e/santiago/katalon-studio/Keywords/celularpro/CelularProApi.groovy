package celularpro

import groovy.json.JsonOutput
import groovy.json.JsonSlurper

/**
 * Prepara y limpia datos llamando directamente a la API de CelularPro.
 * Las pruebas actúan por la interfaz, pero para banear a Carlos primero tiene
 * que existir Carlos, y para borrar un celular primero hay que publicarlo.
 */
class CelularProApi {

    static final String API_URL = System.getenv('E2E_API_URL') ?: 'http://localhost:3001/api/v1'
    static final String ADMIN_EMAIL = System.getenv('E2E_ADMIN_EMAIL') ?: 'admin@celularpro.co'
    static final String ADMIN_PASSWORD = System.getenv('E2E_ADMIN_PASSWORD') ?: 'admin1234'

    private static int sequence = 0

    String token = null

    // ── Datos de prueba (correos y slugs únicos en cada corrida) ──

    static String uniqueSuffix() {
        return Long.toHexString(System.currentTimeMillis()) + Integer.toHexString(sequence++)
    }

    static Map newCustomer(String firstName) {
        String suffix = uniqueSuffix()
        return [
            firstName: firstName,
            name     : "${firstName} Prueba".toString(),
            email    : "${firstName.toLowerCase()}.e2e.${suffix}@gmail.com".toString(),
            password : 'ClaveSegura123',
            id       : null
        ]
    }

    /** Un Nokia barato que no se parece a ningún celular del seed. */
    static Map newPhone() {
        String suffix = uniqueSuffix()
        return [
            name: "Nokia E2E ${suffix}".toString(), slug: "nokia-e2e-${suffix}".toString(),
            brand: 'Nokia', categoryId: 'motorola', categoryLabel: 'Motorola',
            price: 199000, stock: 4, id: null
        ]
    }

    /** ESC-13: se parece al iPhone 15 Pro Max (misma marca, categoría y precio ±25 %). */
    static Map newPhoneSimilarToIphone15ProMax(int stock) {
        String suffix = uniqueSuffix()
        return [
            name: "iPhone E2E ${suffix}".toString(), slug: "iphone-e2e-${suffix}".toString(),
            brand: 'Apple', categoryId: 'apple', categoryLabel: 'iPhone (Apple)',
            price: 1250000, stock: stock, id: null
        ]
    }

    // ── Acceso ──

    static CelularProApi loginAsAdministrator() {
        CelularProApi api = new CelularProApi()
        Map response = api.call('POST', '/auth/login', [email: ADMIN_EMAIL, password: ADMIN_PASSWORD])
        api.token = response.body.data.token
        return api
    }

    // ── Usuarios ──

    Map register(Map customer) {
        Map response = call('POST', '/auth/register',
            [name: customer.name, email: customer.email, password: customer.password])
        customer.id = response.body.data.user.id
        return customer
    }

    void ban(Map customer, String reason) {
        call('PUT', "/admin/users/${customer.id}/ban".toString(), [reason: reason])
    }

    /** Reactiva a un cliente (por el Map que devolvió register). Si ya estaba activo no pasa nada. */
    void unban(Map customer) {
        call('PUT', "/admin/users/${customer.id}/unban".toString(), [:], true)
    }

    /** Lo mismo, pero buscando al cliente por su correo. */
    void unban(String email) {
        Map found = call('GET', "/admin/users?search=${URLEncoder.encode(email, 'UTF-8')}&limit=5".toString())
        Map user = (found.body.data as List).find { it.email == email }
        if (user != null) {
            call('PUT', "/admin/users/${user.id}/unban".toString(), [:], true)
        }
    }

    int totalUsers() {
        return call('GET', '/admin/users?limit=1').body.meta.total as int
    }

    Map statistics() {
        return call('GET', '/admin/stats').body.data
    }

    // ── Catálogo ──

    Map publish(Map phone) {
        Map response = call('POST', '/phones', [
            name: phone.name, slug: phone.slug, brand: phone.brand,
            categoryId: phone.categoryId, price: phone.price, stock: phone.stock,
            condition: 'NEW'
        ])
        phone.id = response.body.data.id
        return phone
    }

    void deleteIfExists(Map phone) {
        Map found = call('GET', "/phones/${phone.slug}".toString(), null, true)
        if (found.status == 200) {
            call('DELETE', "/phones/${found.body.data.id}".toString())
        }
    }

    // ── HTTP ──

    Map call(String method, String path, Map body = null, boolean allowError = false) {
        HttpURLConnection connection = (HttpURLConnection) new URL(API_URL + path).openConnection()
        connection.requestMethod = method
        connection.connectTimeout = 10000
        connection.readTimeout = 10000
        connection.setRequestProperty('Accept', 'application/json')
        if (token) {
            connection.setRequestProperty('Authorization', "Bearer ${token}".toString())
        }
        if (body != null) {
            connection.doOutput = true
            connection.setRequestProperty('Content-Type', 'application/json')
            connection.outputStream.withWriter('UTF-8') { it << JsonOutput.toJson(body) }
        }
        int status = connection.responseCode
        InputStream stream = status >= 400 ? connection.errorStream : connection.inputStream
        String text = stream ? stream.getText('UTF-8') : ''
        if (status >= 400 && !allowError) {
            throw new AssertionError("La API respondió ${status} en ${method} ${path}: ${text}".toString())
        }
        return [status: status, body: text ? new JsonSlurper().parseText(text) : null]
    }
}
