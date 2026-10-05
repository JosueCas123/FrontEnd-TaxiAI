// Execute with Playwright browser_run_code_unsafe filename against Vite dev on 5188.
// Isolated contexts; all APIs and external resources intercepted. No real backend.
async (page) => {
  const origin = 'http://127.0.0.1:5188'
  const results = []
  const assert = (condition, message) => { if (!condition) throw new Error(message) }
  const row = (id, latitud = -16.49, longitud = -68.12) => ({ id, nombreCompleto: `Prueba ${id}`,
    estado: 'aprobado', estadoJornada: 'activa', estadoDisponibilidad: 'disponible',
    vehiculo: { placa: 'MOCK', marca: 'Marca', modelo: 'Modelo', color: 'Blanco' },
    ubicacion: { latitud, longitud, horaRegistro: '2026-01-01T00:00:00Z' }, ultimaUbicacionRegistradaEn: '2026-01-01T00:00:00Z' })
  async function scenario(name, test) {
    const context = await page.context().browser().newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 } })
    const p = await context.newPage()
    await p.clock.install()
    p.setDefaultTimeout(7000)
    const state = { rows: [row('a'), { ...row('b', -17.8, -63.2), estadoDisponibilidad: 'en_servicio' }], status: 200,
      calls: 0, tilesFail: false, unknown: [], errors: [], hold: null }
    p.on('pageerror', (error) => state.errors.push(String(error)))
    await context.route('**/*', async (route) => {
      const request = route.request(), url = new URL(request.url()), path = url.pathname
      const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      if (path.startsWith('/api/')) {
        if (path === '/api/auth/admin/login') return json(200, { token: 'mock-only', tokenType: 'Bearer', expiresIn: 3600 })
        if (path === '/api/configuracion') return json(200, { id: 1, nombreEmpresa: 'Prueba', radioMaximoBusquedaKm: 5 })
        if (path === '/api/dashboard/indicadores') return json(200, { conductoresDisponibles: 0, conductoresEnServicio: 0, solicitudesActivas: 0, solicitudesCompletadasHoy: 0 })
        if (path === '/api/dashboard/conductores-mapa' && request.method() === 'GET' && !url.search) {
          state.calls++
          if (state.hold) await state.hold
          return json(state.status, state.status === 200 ? state.rows : { error: { message: 'Error mock inicial', code: 'MOCK' } })
        }
        state.unknown.push(`${request.method()} ${path}`)
        return json(503, {})
      }
      if (url.hostname === 'tile.openstreetmap.org') return state.tilesFail ? route.abort('failed') : route.fulfill({
        contentType: 'image/png', headers: { 'cache-control': 'no-store' }, body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') })
      if (url.origin !== origin) return route.abort('blockedbyclient')
      return route.continue()
    })
    const until = async (condition, message) => {
      for (let i = 0; i < 240; i++) { if (await condition()) return; await p.waitForTimeout(25) }
      throw new Error(message)
    }
    const navigate = () => p.evaluate(() => { history.pushState(null, '', '/mapa'); dispatchEvent(new PopStateEvent('popstate')) })
    const update = async () => {
      const before = state.calls
      await p.getByRole('button', { name: 'Actualizar', exact: true }).click()
      await until(() => state.calls > before, 'manual request')
      await until(() => p.getByRole('button', { name: 'Actualizar', exact: true }).isEnabled(), 'manual settled')
    }
    try {
      await p.goto(`${origin}/login`, { timeout: 30000 })
      await p.locator('#correo').fill('mock@example.invalid')
      await p.locator('#contrasena').fill('mock-only')
      await p.getByRole('button', { name: 'Ingresar', exact: true }).click()
      await until(async () => await p.locator('#correo').count() === 0, 'login')
      // Observe the real Leaflet instance without adding test hooks to production.
      await p.evaluate(async () => {
        const { default: L } = await import('/node_modules/.vite/deps/leaflet.js')
        window.__spec08 = { fits: [], map: null, L }
        const original = L.Map.prototype.fitBounds
        L.Map.prototype.fitBounds = function (...args) {
          window.__spec08.map = this
          window.__spec08.fits.push(args[1])
          return original.apply(this, args)
        }
      })
      await test({ p, context, state, until, navigate, update })
      assert(state.unknown.length === 0, `Unexpected API: ${state.unknown}`)
      assert(state.errors.length === 0, `Browser errors: ${state.errors}`)
      results.push({ name, result: 'PASS' })
    } catch (error) { results.push({ name, result: 'FAIL', error: String(error), text: await p.locator('body').innerText() }) }
    finally { await context.close() }
  }

  for (const cached of [false, true]) await scenario(`real offline ${cached ? 'with' : 'without'} previous data`, async ({ p, context, state, until, navigate }) => {
    if (cached) { await navigate(); await p.locator('.mapa-persona').first().waitFor() }
    await context.setOffline(true)
    await until(() => p.evaluate(() => !navigator.onLine), 'browser offline')
    if (!cached) await navigate()
    await p.getByText('Sin conexion. La consulta se reanudara al recuperar la conexion.', { exact: true }).waitFor()
    const before = state.calls
    await p.getByRole('button', { name: 'Actualizar', exact: true }).evaluate((button) => { button.click(); button.click(); button.click() })
    await p.waitForTimeout(100)
    assert(state.calls === before, 'offline issued requests')
    assert(await p.getByRole('button', { name: 'Actualizar', exact: true }).isEnabled(), 'paused control stuck')
    assert(!((await p.locator('.mapa-pagina').innerText()).includes('Actualizando')), 'false updating')
    assert(!((await p.locator('.mapa-directorio').innerText()).includes('Cargando')), 'false initial loading')
    assert(await p.locator('.mapa-persona').count() === (cached ? 2 : 0), 'cached rows lost')
    if (!cached) assert((await p.locator('.mapa-chip-conteo').allTextContents()).every((n) => n === '\u2013'), 'unconfirmed zero')
    await context.setOffline(false)
    await p.locator('.mapa-persona').first().waitFor()
    await until(async () => await p.getByText('Sin conexion. La consulta se reanudara al recuperar la conexion.', { exact: true }).count() === 0, 'offline warning cleared')
    await until(() => p.getByRole('button', { name: 'Actualizar', exact: true }).isEnabled(), 'reconnected control')
    assert(state.calls > before, 'paused query not resumed')
  })

  await scenario('initial 500 -> confirmed empty; mobile sheet stacking', async ({ p, state, until, navigate, update }) => {
    state.status = 500
    await navigate()
    await p.getByRole('alert').waitFor()
    assert((await p.locator('.mapa-chip-conteo').allTextContents()).every((n) => n === '\u2013'), 'error invented zeros')
    assert((await p.locator('.mapa-directorio').innerText()).includes('No se pudieron cargar'), 'error says loading')
    assert(await p.locator('.mapa-vacio').count() === 0, 'error presented as empty/loading')
    state.status = 200; state.rows = []
    await update()
    await until(async () => (await p.locator('.mapa-chip-conteo').allTextContents()).every((n) => n === '0'), 'confirmed zeros')
    for (const width of [768, 320]) {
      await p.setViewportSize({ width, height: 800 })
      await p.getByRole('button', { name: /Abrir/ }).click()
      const dialog = p.getByRole('dialog')
      await dialog.waitFor()
      assert(await dialog.evaluate((d) => {
        const r = d.getBoundingClientRect()
        return d.contains(document.elementFromPoint(r.left + r.width / 2, Math.min(r.bottom - 20, 450)))
      }), 'map overlay above sheet')
      await p.getByRole('button', { name: 'Cerrar men\u00fa' }).click()
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `horizontal overflow ${width}`)
    }
  })

  await scenario('initial empty -> first fit; chip and populated-empty-populated polling; concurrent refresh', async ({ p, state, until, navigate, update }) => {
    const rows = state.rows
    state.rows = []
    await navigate()
    await p.locator('.mapa-directorio-vacio').waitFor()
    assert(await p.evaluate(() => window.__spec08.fits.length) === 0, 'empty consumed fit')
    state.rows = rows
    await update()
    await until(() => p.evaluate(() => window.__spec08.fits.length === 1), 'first fit')
    await p.getByRole('button', { name: 'Disponibles 1', exact: true }).click()
    await until(() => p.evaluate(() => window.__spec08.fits.length === 2), 'chip fit')
    await p.waitForTimeout(500)
    await p.evaluate(() => { window.__spec08.map.panBy([90, 45], { animate: false }) })
    const center = await p.evaluate(() => window.__spec08.map.getCenter())
    for (const next of [[], [row('a', -15, -65)]]) {
      state.rows = next
      const before = state.calls
      await p.clock.runFor(15100)
      await until(() => state.calls > before, 'poll request')
      await until(async () => await p.locator('.mapa-persona').count() === next.length, 'poll rendered')
      assert(await p.evaluate(() => window.__spec08.fits.length) === 2, 'poll fitted after chip/empty')
      assert(JSON.stringify(await p.evaluate(() => window.__spec08.map.getCenter())) === JSON.stringify(center), 'poll moved view')
    }
    await p.getByRole('button', { name: 'En servicio 0', exact: true }).click()
    state.rows = rows
    await update()
    assert(await p.evaluate(() => window.__spec08.fits.length) === 2, 'empty chip deferred fit to data')
    await p.getByRole('button', { name: 'Todos 2', exact: true }).click()
    assert(await p.evaluate(() => window.__spec08.fits.length) === 3, 'explicit chip did not fit')
    assert(await p.evaluate(() => window.__spec08.fits.every((o) => o.maxZoom === 14 && o.padding.join() === '75,75')), 'fit options changed')
    let release
    state.hold = new Promise((resolve) => { release = resolve })
    const before = state.calls
    await p.getByRole('button', { name: 'Actualizar', exact: true }).evaluate((b) => { b.click(); b.click(); b.click() })
    await until(() => state.calls > before, 'concurrent request')
    assert(state.calls === before + 1, 'duplicate requests')
    release(); state.hold = null
  })

  await scenario('tiles fail -> dismiss -> recover -> fail in SAME mount; isolated failures', async ({ p, state, until, navigate }) => {
    state.tilesFail = true
    await navigate()
    const notice = p.locator('.mapa-nota-teselas')
    await notice.waitFor()
    await until(() => p.evaluate(() => !!window.__spec08.map), 'map captured')
    await p.waitForTimeout(1000)
    let batch = 0
    const redraw = () => p.evaluate((batch) => { window.__spec08.map.eachLayer((layer) => {
      if (layer instanceof window.__spec08.L.TileLayer) layer.setUrl(`https://tile.openstreetmap.org/{z}/{x}/{y}.png?testBatch=${batch}`)
    }) }, ++batch)
    await p.getByRole('button', { name: 'Cerrar aviso del mapa base' }).click()
    await redraw(); await p.waitForTimeout(300)
    assert(await notice.count() === 0, 'dismissed notice reopened during outage')
    state.tilesFail = false
    await redraw()
    await until(() => p.evaluate(() => [...document.querySelectorAll('.leaflet-tile')].some((t) => t.complete && t.naturalWidth)), 'real image recovered')
    await p.waitForTimeout(500)
    // Inject isolated events after actual image recovery to fix the threshold contract.
    await p.evaluate(() => { window.__spec08.map.eachLayer((layer) => {
      if (!(layer instanceof window.__spec08.L.TileLayer)) return
      for (let i = 0; i < 6; i++) { layer.fire('tileerror'); layer.fire('tileload') }
    }) })
    assert(await notice.count() === 0, 'isolated failures accumulated')
    state.tilesFail = true
    await redraw(); await until(() => notice.isVisible(), 'second outage in same mount')
    assert(await notice.getAttribute('role') === 'status', 'tile role')
    state.tilesFail = false
    await redraw()
    await until(async () => await notice.count() === 0, 'visible notice recovery')
    await p.waitForTimeout(500)
    state.tilesFail = true
    await redraw(); await until(() => notice.isVisible(), 'third outage in same mount')
    assert(await p.locator('.mapa-icono').count() === 2, 'tile failures removed markers')
  })
  return results
}
