// Run with browser_run_code_unsafe filename against Vite on 5199.
// All APIs are mocked and external traffic is blocked. No real credentials or writes.
// The browser tool evaluates this file as a function expression.
// eslint-disable-next-line no-unused-expressions
async (page) => {
  const origin = 'http://127.0.0.1:5199'
  const results = []
  const assert = (value, message) => { if (!value) throw new Error(message) }
  const driver = (i) => ({ id: `driver-${i}`, nombreCompleto: `Conductor Prueba ${i}`, telefono: '00000000',
    cedulaIdentidad: 'prueba', estado: 'pendiente', estadoJornada: 'activa', estadoDisponibilidad: 'disponible',
    creadoEn: '2026-10-05T12:00:00Z', vehiculo: i === 1 ? null : { id: `v${i}`, placa: `TEST-${i}`,
      marca: 'Marca prueba', modelo: 'Modelo prueba', color: 'Blanco', capacidadPasajeros: 4 } })
  const paths = ['/api/dashboard/indicadores', '/api/dashboard/conductores-mapa', '/api/conductores', '/api/dashboard/solicitudes-activas']
  async function scenario(name, test) {
    const context = await page.context().browser().newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } })
    const p = await context.newPage()
    p.setDefaultTimeout(10000)
    await p.clock.install()
    const s = { calls: Object.fromEntries(paths.map((path) => [path, 0])), statuses: {}, holds: {}, unknown: [], errors: [],
      aborted: [], tileFailure: false,
      data: {
        [paths[0]]: { conductoresDisponibles: 2, conductoresEnServicio: 1, solicitudesActivas: 6, solicitudesCompletadasHoy: 12 },
        [paths[1]]: [0, 1, 2, 3].map((i) => ({ ...driver(i), estado: 'aprobado',
          estadoDisponibilidad: i === 1 ? 'en_servicio' : 'disponible',
          ubicacion: i < 2 ? { latitud: -16.4897 + i * 0.003, longitud: -68.1193 + i * 0.003, horaRegistro: '2026-10-05T12:00:00Z' } : null,
          ultimaUbicacionRegistradaEn: i === 3 ? null : '2026-10-05T11:00:00Z' })),
        [paths[2]]: [0, 1, 2, 3, 4].map(driver),
        [paths[3]]: [5, 4, 3, 2, 1, 0].map((i) => ({ id: `solicitud-prueba-${i}`, estado: i % 2 ? 'creada' : 'en_servicio',
          pasajero: i === 4 ? null : { id: `p${i}`, nombre: `Pasajero Prueba ${i}` },
          conductorAsignado: i % 2 ? null : { id: `c${i}`, nombreCompleto: `Conductor Prueba ${i}` },
          latitudRecogida: -16.4, longitudRecogida: -68.1, destino: null, expiraEn: null, creadoEn: '2026-10-05T12:00:00Z' })),
      } }
    p.on('pageerror', (error) => s.errors.push(String(error)))
    p.on('requestfailed', (request) => { if (new URL(request.url()).pathname.startsWith('/api/')) s.aborted.push(new URL(request.url()).pathname) })
    await context.route('**/*', async (route) => {
      const request = route.request(), url = new URL(request.url()), path = url.pathname
      const json = (status, data) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
      if (path.startsWith('/api/')) {
        if (path === '/api/auth/admin/login' && request.method() === 'POST') return json(200, { token: 'fictitious-only', tokenType: 'Bearer', expiresIn: 3600 })
        if (path === '/api/configuracion' && request.method() === 'GET') return json(200, { id: 1, nombreEmpresa: 'Empresa prueba', radioMaximoBusquedaKm: 5, telefonoCentroAtencion: null, actualizadoEn: '2026-10-05T12:00:00Z' })
        if (paths.includes(path) && request.method() === 'GET') {
          assert(path !== '/api/conductores' || url.search === '?estado=pendiente', 'pending contract changed')
          s.calls[path]++
          const status = s.statuses[path] ?? 200, data = s.data[path]
          if (s.holds[path]) await s.holds[path]
          return json(status, status === 200 ? data : { error: { message: `Fallo de prueba ${status}` } })
        }
        s.unknown.push(`${request.method()} ${path}`)
        return route.abort('blockedbyclient')
      }
      if (url.hostname === 'tile.openstreetmap.org') {
        if (s.tileFailure) return route.abort('failed')
        return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e8edeb"/></svg>' })
      }
      if (url.origin !== origin) return route.abort('blockedbyclient')
      return route.continue()
    })
    const until = async (condition, message) => {
      for (let i = 0; i < 250; i++) { if (await condition()) return; await p.waitForTimeout(20) }
      throw new Error(message)
    }
    const navigate = (path = '/') => p.evaluate((path) => { history.pushState(null, '', path); dispatchEvent(new PopStateEvent('popstate')) }, path)
    const settled = () => until(async () => await p.getByRole('button', { name: 'Actualizar', exact: true }).isEnabled(), 'refresh did not settle')
    const update = async () => { await settled(); await p.getByRole('button', { name: 'Actualizar', exact: true }).click(); await settled() }
    const login = async () => {
      await p.goto(`${origin}/login`)
      await p.locator('#correo').fill('test@example.invalid')
      await p.locator('#contrasena').fill('fictitious-only')
      await p.getByRole('button', { name: 'Ingresar', exact: true }).click()
      await p.getByRole('heading', { name: 'Resumen de la operacion' }).waitFor()
    }
    try {
      await test({ p, context, s, until, navigate, settled, update, login })
      assert(s.unknown.length === 0, `unexpected APIs: ${s.unknown}`)
      assert(s.errors.length === 0, `page errors: ${s.errors}`)
      results.push({ name, result: 'PASS' })
    } catch (error) {
      results.push({ name, result: 'FAIL', error: String(error), text: (await p.locator('body').innerText()).slice(0, 2000) })
    } finally { await context.close() }
  }

  await scenario('desktop/mobile composition, real fields, links and map reuse', async ({ p, s, login, settled, navigate }) => {
    await login(); await settled()
    assert(await p.locator('.leaflet-container').count() === 1, 'map missing')
    assert(await p.locator('.mapa-marcador').count() === 2, 'invented or missing coordinates')
    assert(await p.locator('tbody tr').count() === 4, 'not four requests')
    assert(JSON.stringify(await p.locator('tbody tr td:first-child').allTextContents()) === JSON.stringify(s.data[paths[3]].slice(0, 4).map((r) => r.id)), 'server order or IDs changed')
    assert(await p.getByText('1 ubicacion desactualizada.', { exact: true }).count() === 1, 'stale count includes no reports')
    const review = p.getByRole('region', { name: 'Por revisar', exact: true })
    assert(await review.locator('a').count() === 4, 'three pending plus list link')
    assert(await review.getByText('Sin vehiculo registrado').count() === 1, 'missing vehicle invented')
    assert(await p.getByText('Mostrando 4 de 6 solicitudes', { exact: true }).count() === 1, 'footer count')
    const map = await p.getByRole('region', { name: 'Tu flota en el mapa', exact: true }).boundingBox()
    const pending = await review.boundingBox()
    assert(map.x < pending.x && Math.abs(map.y - pending.y) < 2, 'desktop columns')
    assert(await p.locator('.leaflet-container').evaluate((e) => e.clientHeight) === 324, 'compact height')
    await p.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/opencode/home-desktop.png', fullPage: true })
    for (const width of [768, 390, 320]) {
      await p.setViewportSize({ width, height: 844 })
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `page overflow ${width}`)
      assert(await review.isVisible(), `review hidden ${width}`)
      assert(await p.locator('.leaflet-container').evaluate((e) => e.clientWidth > 0), `map collapsed ${width}`)
      await p.clock.runFor(400)
      assert(await p.locator('.mapa-marcador').evaluateAll((markers) => markers.every((marker) => {
        const box = marker.getBoundingClientRect(), map = marker.closest('.leaflet-container').getBoundingClientRect()
        return box.left >= map.left && box.right <= map.right && box.top >= map.top && box.bottom <= map.bottom
      })), `markers outside compact map ${width}`)
    }
    await p.screenshot({ path: 'C:/Users/HP/AppData/Local/Temp/opencode/home-mobile.png', fullPage: true })
    await p.getByRole('link', { name: 'Ver en el mapa' }).click()
    await p.getByRole('button', { name: /Desactualizados/ }).waitFor()
    assert(await p.getByRole('button', { name: /Desactualizados/ }).getAttribute('aria-pressed') === 'true', 'stale link filter')
    assert(await p.locator('.mapa-marcador').count() === 0, 'stale coordinates invented in full map')
    await p.getByRole('button', { name: /^Todos/ }).click()
    assert(await p.locator('.mapa-marcador').count() === 2, 'shared map regression')
    await navigate(); await settled()
    await p.getByRole('link', { name: 'Revisar pendientes' }).click()
    await p.getByRole('button', { name: 'Pendientes', exact: true }).waitFor()
    assert(await p.getByRole('button', { name: 'Pendientes', exact: true }).getAttribute('aria-pressed') === 'true', 'pending link')
    await navigate(); await settled()
    await p.getByRole('link', { name: 'Ver todas' }).click()
    await p.getByRole('heading', { name: 'Solicitudes activas', exact: true, level: 1 }).waitFor()
  })

  await scenario('15s visible polling, refresh deduplication, empty data and cancellation', async ({ p, s, login, settled, update, until, navigate }) => {
    await login(); await settled()
    const before = { ...s.calls }
    await p.clock.runFor(15010); await settled()
    paths.forEach((path) => assert(s.calls[path] === before[path] + 1, `15s polling ${path}`))
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) })
    const hidden = { ...s.calls }
    await p.clock.runFor(45000)
    paths.forEach((path) => assert(s.calls[path] === hidden[path], `hidden polling ${path}`))
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); document.dispatchEvent(new Event('visibilitychange')) })
    await settled()
    s.data[paths[1]] = []; s.data[paths[2]] = []; s.data[paths[3]] = []
    await update()
    assert(await p.getByText('No hay registros pendientes.').count() === 1, 'pending empty')
    assert(await p.getByText('No hay solicitudes activas.').count() === 1, 'requests empty')
    assert(await p.getByText('Sin conductores', { exact: true }).count() === 1, 'map empty')
    assert(await p.getByRole('link', { name: 'Ver en el mapa' }).count() === 0, 'stale notice on empty')
    assert(await p.getByText('Mostrando 0 de 0 solicitudes').count() === 1, 'empty footer')
    let release
    const hold = new Promise((resolve) => { release = resolve })
    paths.forEach((path) => { s.holds[path] = hold })
    const start = { ...s.calls }
    await p.getByRole('button', { name: 'Actualizar', exact: true }).click()
    await until(() => paths.every((path) => s.calls[path] > start[path]), 'missing manual reads')
    assert(await p.getByRole('button', { name: 'Actualizando...', exact: true }).isDisabled(), 'manual refresh enabled in flight')
    await p.clock.runFor(30000)
    paths.forEach((path) => assert(s.calls[path] === start[path] + 1, `overlapping polling ${path}`))
    await navigate('/configuracion')
    release()
    await until(() => s.aborted.length >= 4, 'reads not aborted on unmount')
  })

  await scenario('partial errors preserve data, recover, offline and 401 logout', async ({ p, context, s, login, settled, update, until }) => {
    await login(); await settled()
    s.statuses[paths[1]] = 403; s.statuses[paths[2]] = 403; s.statuses[paths[3]] = 403
    await update()
    assert(await p.getByText(/No se pudieron actualizar/).count() === 3, 'partial errors missing')
    assert(await p.locator('tbody tr').count() === 4 && await p.locator('.mapa-marcador').count() === 2, 'cached data discarded')
    s.statuses = {}
    await update()
    assert(await p.getByText(/No se pudieron actualizar/).count() === 0, 'errors not cleared')
    await context.setOffline(true)
    await until(async () => await p.getByText(/Sin conexion. La consulta se reanudara/).count() === 1, 'offline banner')
    assert(await p.getByRole('button', { name: 'Actualizar', exact: true }).isDisabled(), 'offline refresh')
    await context.setOffline(false); await settled()
    s.statuses[paths[2]] = 401
    await p.getByRole('button', { name: 'Actualizar', exact: true }).click()
    await p.locator('#correo').waitFor()
    assert(await p.locator('.leaflet-container').count() === 0, 'home retained after logout')
  })

  await scenario('initial loading, initial errors and tile failure', async ({ p, s, login, until }) => {
    let release
    s.holds[paths[2]] = new Promise((resolve) => { release = resolve })
    s.statuses[paths[1]] = 403; s.statuses[paths[3]] = 403; s.tileFailure = true
    await login()
    await p.getByText('Cargando los registros pendientes...').waitFor()
    release()
    await until(async () => await p.getByText(/No se pudieron cargar/).count() === 2, 'initial errors')
    assert(await p.getByText('No hay solicitudes activas.').count() === 0, 'error shown as empty')
    assert(await p.getByText(/No se pudo cargar el mapa base/).count() === 1, 'tile failure missing')
  })
  return results
}
