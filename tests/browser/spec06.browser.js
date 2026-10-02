// Run with Playwright browser_run_code_unsafe filename, against the local preview on 5174.
// The supplied page is never navigated or modified. No installed test dependency required.
async (page) => {
  const results = []
  const browser = page.context().browser()
  const origin = 'http://127.0.0.1:5174'
  const assert = (value, message) => { if (!value) throw new Error(message) }
  const fixture = (id) => ({ id, usuarioId: `user-${id}`, nombreCompleto: `Prueba ${id}`,
    telefono: '00000000', cedulaIdentidad: 'MOCK', estado: 'pendiente',
    estadoJornada: 'activa', estadoDisponibilidad: 'disponible', creadoEn: '2026-01-02T12:00:00Z',
    vehiculo: { id: `vehicle-${id}`, placa: 'MOCK-ONLY', marca: 'Marca', modelo: 'Modelo', color: 'Blanco', capacidadPasajeros: 4 } })
  async function scenario(name, test) {
    const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 } })
    const p = await context.newPage()
    const state = { rows: { a: fixture('a'), b: fixture('b') }, getStatus: 200, patchStatus: 200,
      locationStatus: 200, report: null, patches: [], calls: [], holdPatch: null, holdGet: null, unknown: [], accept: true }
    p.on('dialog', (dialog) => state.accept ? dialog.accept() : dialog.dismiss())
    await context.route('**/*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const path = url.pathname
      const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      if (path.startsWith('/api/')) {
        state.calls.push(`${request.method()} ${path}`)
        if (path === '/api/auth/admin/login') return json(200, { token: 'mock-only', tokenType: 'Bearer', expiresIn: 3600 })
        if (path === '/api/configuracion') return json(200, { id: 1, nombreEmpresa: 'Prueba', radioMaximoBusquedaKm: 5, telefonoCentroAtencion: null, actualizadoEn: '2026-01-01' })
        if (path === '/api/dashboard/indicadores') return json(200, { conductoresDisponibles: 0, conductoresEnServicio: 0, solicitudesActivas: 0, solicitudesCompletadasHoy: 0 })
        if (path === '/api/dashboard/conductores-mapa') return json(state.locationStatus, state.locationStatus === 200
          ? Object.values(state.rows).map((row) => ({ ...row, ubicacion: null, ultimaUbicacionRegistradaEn: state.report })) : { message: 'Ubicacion mock no disponible' })
        if (path === '/api/conductores') return json(200, Object.values(state.rows).filter((row) => row.estado === url.searchParams.get('estado')))
        const match = path.match(/^\/api\/conductores\/([^/]+)(?:\/(.*))?$/)
        if (match) {
          const [, id, action] = match
          if (request.method() === 'PATCH') {
            const body = request.postDataJSON()
            state.patches.push({ id, action, body })
            const status = state.patchStatus
            if (state.holdPatch) await state.holdPatch
            if (status !== 200) return json(status, { message: `PATCH mock ${status}` })
            if (action === 'vehiculo') Object.assign(state.rows[id].vehiculo, body)
            else state.rows[id].estado = { aprobar: 'aprobado', rechazar: 'rechazado', suspender: 'suspendido', reactivar: 'aprobado' }[action]
            return json(200, state.rows[id])
          }
          const status = state.getStatus
          const data = structuredClone(state.rows[id])
          if (state.holdGet) await state.holdGet
          return json(data ? status : 404, status === 200 && data ? data : { message: `GET mock ${data ? status : 404}` })
        }
        state.unknown.push(path)
        return json(503, { message: 'Unexpected mock API' })
      }
      if (url.origin !== origin || ['fetch', 'xhr'].includes(request.resourceType())) return route.abort('blockedbyclient')
      return route.continue()
    })
    const until = async (condition, message) => {
      for (let i = 0; i < 200; i++) { if (await condition()) return; await p.waitForTimeout(25) }
      throw new Error(message)
    }
    const navigate = async (path) => {
      await p.evaluate((path) => { history.pushState(null, '', path); dispatchEvent(new PopStateEvent('popstate')) }, path)
    }
    const login = async () => {
      await p.locator('#correo').fill('mock@example.invalid')
      await p.locator('#contrasena').fill('mock-only')
      await p.getByRole('button', { name: 'Ingresar', exact: true }).click()
      await until(() => p.locator('#correo').count().then((n) => n === 0), 'login')
    }
    const edit = () => p.getByRole('button', { name: 'Editar vehiculo', exact: true })
    const save = () => p.getByRole('button', { name: 'Guardar vehiculo', exact: true })
    const update = async () => {
      const response = p.waitForResponse((r) => new URL(r.url()).pathname === '/api/conductores/a' && r.request().method() === 'GET')
      const location = state.getStatus === 200 ? p.waitForResponse((r) => new URL(r.url()).pathname === '/api/dashboard/conductores-mapa') : null
      await p.getByRole('button', { name: 'Actualizar', exact: true }).click()
      await (await response).finished()
      if (location) await (await location).finished()
      await p.waitForTimeout(50)
      await until(() => p.getByText('Actualizando...', { exact: true }).count().then((n) => n === 0), 'refresh settled')
      await until(() => p.getByText('Consultando...', { exact: true }).count().then((n) => n === 0), 'location refresh settled')
    }
    try {
      await p.goto(`${origin}/login`)
      await login()
      await navigate('/conductores/a')
      await edit().waitFor()
      await p.waitForLoadState('networkidle')
      await p.getByText('Sin reportes', { exact: true }).waitFor()
      await until(() => p.getByText('Consultando...', { exact: true }).count().then((n) => n === 0), 'location settled')
      await test({ p, state, until, navigate, login, edit, save, update, assert, context })
      assert(state.unknown.length === 0, `Unexpected APIs: ${state.unknown}`)
      results.push({ name, result: 'PASS', patches: state.patches.length })
    } catch (error) {
      results.push({ name, result: 'FAIL', error: String(error), calls: state.calls, text: await p.locator('body').innerText() })
    } finally { await context.close() }
  }

  await scenario('account404 -> GET500 -> GET200; restriction and location', async ({ p, state, until, edit, update }) => {
    state.patchStatus = 404; state.getStatus = 500
    await p.getByRole('button', { name: 'Aprobar', exact: true }).click()
    await until(() => p.getByText('Procesando transicion...', { exact: true }).count().then((n) => n === 0), 'transition settled')
    assert(await edit().isDisabled(), '404 must block edits after GET500')
    assert(await p.getByRole('button', { name: 'Aprobar', exact: true }).isDisabled(), '404 must block transition')
    await update()
    assert(await edit().isDisabled(), 'failed explicit refresh must not unlock')
    state.getStatus = 200
    await update()
    assert(await edit().isEnabled(), 'explicit GET200 recovers 404')
    state.getStatus = 403
    const before = state.calls.filter((s) => s.endsWith('/conductores-mapa')).length
    await update()
    await p.getByRole('heading', { name: 'Permiso denegado', exact: true }).waitFor()
    assert(state.calls.filter((s) => s.endsWith('/conductores-mapa')).length === before, 'GET403 must not request location')
  })

  await scenario('list -> profile and profile -> list pending coordination', async ({ p, state, until, navigate, edit }) => {
    await navigate('/conductores')
    let release
    state.holdPatch = new Promise((resolve) => { release = resolve })
    await p.getByRole('button', { name: 'Aprobar a Prueba a', exact: true }).click()
    await until(() => state.patches.length === 1, 'list patch started')
    await p.getByRole('link', { name: 'Prueba a', exact: true }).click()
    await edit().waitFor()
    assert(await edit().isDisabled(), 'profile edits during list write')
    assert(await p.getByRole('button', { name: 'Aprobar', exact: true }).isDisabled(), 'profile transitions during list write')
    release(); state.holdPatch = null
    await p.getByRole('button', { name: 'Suspender', exact: true }).waitFor()
    await until(() => edit().isEnabled(), 'list reconciliation finished')
    state.holdPatch = new Promise((resolve) => { release = resolve })
    await p.getByRole('button', { name: 'Suspender', exact: true }).click()
    await until(() => state.patches.length === 2, 'profile patch started')
    await p.getByRole('link', { name: 'Volver a conductores' }).click()
    await p.getByRole('button', { name: 'Aprobados', exact: true }).click()
    await p.getByRole('button', { name: 'Suspender a Prueba a' }).waitFor()
    assert(await p.getByRole('button', { name: 'Suspender a Prueba a' }).isDisabled(), 'list write during profile write')
    await p.getByRole('button', { name: 'Pendientes', exact: true }).click()
    assert(await p.getByRole('button', { name: 'Aprobar a Prueba b' }).isEnabled(), 'unrelated row must remain available')
    release(); state.holdPatch = null
    await until(() => p.getByText('Procesando transicion...', { exact: true }).count().then((n) => n === 0), 'profile reconciliation finished')
    await p.getByRole('button', { name: 'Suspendidos', exact: true }).click()
    await p.getByRole('link', { name: 'Prueba a', exact: true }).waitFor()
  })

  await scenario('manual GET/PATCH race; confirmed DTO survives GET failure; duplicate submit and all local closures', async ({ p, state, until, edit, save }) => {
    await edit().click()
    await p.locator('#vehiculo-color').fill('Azul')
    let releaseGet, releasePatch
    state.holdGet = new Promise((resolve) => { releaseGet = resolve })
    await p.getByRole('button', { name: 'Actualizar ficha', exact: true }).click()
    state.holdPatch = new Promise((resolve) => { releasePatch = resolve })
    await save().evaluate((button) => { button.click(); button.click(); button.form.requestSubmit() })
    await until(() => state.patches.length === 1, 'single patch started')
    const locationBefore = state.calls.filter((s) => s.endsWith('/conductores-mapa')).length
    releaseGet(); state.holdGet = null
    await p.waitForTimeout(80)
    assert(state.calls.filter((s) => s.endsWith('/conductores-mapa')).length === locationBefore, 'manual GET continuation during PATCH')
    assert(await p.getByRole('button', { name: 'Cerrar edicion' }).isDisabled(), 'X disabled')
    assert(await p.getByRole('button', { name: 'Cancelar', exact: true }).isDisabled(), 'cancel disabled')
    await p.getByRole('button', { name: 'Cerrar edicion' }).evaluate((button) => button.click())
    await p.getByRole('button', { name: 'Cancelar', exact: true }).evaluate((button) => button.click())
    await p.keyboard.press('Escape')
    await p.locator('.vehiculo-overlay').click({ position: { x: 2, y: 2 }, force: true })
    assert(await p.getByRole('dialog').count() === 1, 'pending modal closed')
    state.getStatus = 500
    releasePatch(); state.holdPatch = null
    await p.getByText('Vehiculo guardado.', { exact: true }).waitFor()
    await until(() => edit().isEnabled(), 'PATCH reconciliation finished')
    assert(await p.getByText('Azul', { exact: true }).count() === 1, 'confirmed DTO lost')
    assert(await p.getByText('Los datos mostrados pueden estar desactualizados.').count() === 1, 'GET fail separate warning')
    assert(state.patches.length === 1 && JSON.stringify(state.patches[0].body) === '{"color":"Azul"}', 'partial payload or duplicate')
  })

  await scenario('PATCH403 reopened focus; dirty discard all closures; beforeunload cleanup and missing Editar return', async ({ p, state, until, edit, save }) => {
    const unload = () => p.evaluate(() => !dispatchEvent(new Event('beforeunload', { cancelable: true })))
    await edit().click()
    assert(await p.locator('#vehiculo-placa').evaluate((input) => input === document.activeElement), 'initial focus')
    await p.locator('#vehiculo-color').fill('')
    await until(unload, 'invalid dirty beforeunload')
    state.accept = false
    for (const close of [() => p.getByRole('button', { name: 'Cancelar', exact: true }).click(),
      () => p.getByRole('button', { name: 'Cerrar edicion' }).click(), () => p.keyboard.press('Escape'),
      () => p.locator('.vehiculo-overlay').click({ position: { x: 2, y: 2 }, force: true })]) {
      await close(); assert(await p.getByRole('dialog').count() === 1, 'discard rejected must preserve modal')
    }
    state.accept = true
    await p.keyboard.press('Escape')
    await until(async () => !(await unload()), 'discard cleanup')
    await edit().click(); await p.locator('#vehiculo-color').fill('Azul')
    state.patchStatus = 403
    await save().click()
    await p.getByText('PATCH mock 403', { exact: true }).waitFor()
    await until(() => p.getByRole('button', { name: 'Cancelar', exact: true }).isEnabled(), 'patch403 settled')
    await p.getByRole('button', { name: 'Actualizar ficha', exact: true }).click()
    assert(await save().isDisabled(), 'GET200 cannot establish PATCH permission')
    await p.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await edit().click()
    assert(await p.getByRole('button', { name: 'Cerrar edicion' }).evaluate((button) => button === document.activeElement), 'reopened restricted focus')
    for (let i = 0; i < 12; i++) {
      await p.keyboard.press('Tab')
      assert(await p.getByRole('dialog').evaluate((dialog) => dialog.contains(document.activeElement)), 'focus escaped modal')
    }
    state.rows.a.vehiculo = null
    await p.getByRole('button', { name: 'Actualizar ficha', exact: true }).click()
    await until(() => edit().count().then((n) => n === 0), 'vehicle removed')
    await p.getByRole('button', { name: 'Cancelar', exact: true }).click()
    assert(await p.getByRole('link', { name: 'Volver a conductores' }).evaluate((link) => link === document.activeElement), 'fallback return focus')
  })

  await scenario('location null/invalid/empty/stale/hour/day and deduplicated retries', async ({ p, state, until, update }) => {
    await p.getByText('Sin reportes', { exact: true }).waitFor()
    for (const [report, text] of [['invalid', 'Fecha no disponible'], ['', 'Fecha no disponible'],
      [new Date(Date.now() - 3600000).toISOString(), 'Hace 1 h'], [new Date(Date.now() - 86400000).toISOString(), 'Hace 1 d']]) {
      state.report = report
      await update()
      assert((await p.locator('.detalle-operativo').innerText()).includes(text), `location ${report}`)
    }
    assert(await p.getByText('Mas de 5 minutos sin actualizar.', { exact: false }).count() === 1, 'stale notice')
    state.locationStatus = 503; await update()
    await p.getByRole('button', { name: 'Reintentar ubicacion' }).waitFor()
    const before = state.calls.filter((s) => s.endsWith('/conductores-mapa')).length
    await p.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')]
      buttons.find((b) => b.textContent === 'Reintentar ubicacion').click()
      buttons.find((b) => b.textContent === 'Actualizar').click()
      buttons.find((b) => b.textContent === 'Reintentar ubicacion').click()
    })
    await until(() => state.calls.filter((s) => s.endsWith('/conductores-mapa')).length > before, 'retry')
    await p.waitForTimeout(100)
    assert(state.calls.filter((s) => s.endsWith('/conductores-mapa')).length === before + 1, 'deduplicated manual reads')
  })

  await scenario('late PATCH across resources and sessions; logout stays available', async ({ p, state, until, navigate, login, edit, save }) => {
    for (const status of [200, 403, 401]) {
      await navigate('/conductores/a'); await edit().click()
      await p.locator('#vehiculo-color').fill(`Color-${status}`)
      let release
      state.patchStatus = status
      state.holdPatch = new Promise((resolve) => { release = resolve })
      const before = state.patches.length
      await save().click(); await until(() => state.patches.length > before, 'late patch started')
      await p.getByRole('button', { name: 'Cerrar sesion', exact: true }).click()
      await p.locator('#correo').waitFor(); await login()
      await navigate('/conductores/b'); await edit().waitFor()
      release(); state.holdPatch = null
      await p.waitForTimeout(180)
      assert(await p.getByRole('heading', { name: 'Prueba b', exact: true }).count() === 1, 'old session changed B')
      assert(await p.getByRole('dialog').count() === 0, 'old modal reached B')
      assert(await p.getByText('Vehiculo guardado.', { exact: true }).count() === 0, 'old success reached B')
    }
  })

  await scenario('late GET across profiles/sessions; dirty refetch and unmount cleanup; GET404/401', async ({ p, state, until, navigate, login, edit }) => {
    await edit().click()
    await p.locator('#vehiculo-color').fill('')
    state.rows.a.vehiculo.color = 'Externo'
    await p.getByRole('button', { name: 'Actualizar ficha', exact: true }).click()
    await until(() => p.getByRole('button', { name: 'Actualizar ficha', exact: true }).isEnabled(), 'dirty refetch')
    assert(await p.locator('#vehiculo-color').inputValue() === '', 'refetch erased invalid draft')
    await navigate('/conductores/b'); await edit().waitFor()
    assert(await p.evaluate(() => dispatchEvent(new Event('beforeunload', { cancelable: true }))), 'unmount beforeunload cleanup')
    for (const status of [200, 403, 401]) {
      let release
      state.getStatus = status
      state.holdGet = new Promise((resolve) => { release = resolve })
      const before = state.calls.length
      await navigate('/conductores/a')
      await until(() => state.calls.slice(before).includes('GET /api/conductores/a'), 'deferred GET started')
      state.getStatus = 200; state.holdGet = null
      await navigate('/conductores/b'); await edit().waitFor()
      release()
      await p.waitForLoadState('networkidle')
      assert(await p.getByRole('heading', { name: 'Prueba b', exact: true }).count() === 1, 'late GET affected profile B')
    }
    for (const status of [200, 403, 401]) {
      let release
      state.getStatus = status
      state.holdGet = new Promise((resolve) => { release = resolve })
      const before = state.calls.length
      await p.getByRole('button', { name: 'Actualizar', exact: true }).click()
      await until(() => state.calls.length > before, 'session GET started')
      await edit().click()
      await p.getByRole('button', { name: 'Cerrar sesion', exact: true }).click()
      await p.locator('#correo').waitFor()
      state.getStatus = 200; state.holdGet = null
      await login(); await navigate('/conductores/b'); await edit().waitFor()
      release(); await p.waitForLoadState('networkidle')
      assert(await p.getByRole('heading', { name: 'Prueba b', exact: true }).count() === 1, 'late GET affected session B')
    }
    await navigate('/conductores/missing')
    await p.getByRole('heading', { name: 'Conductor no encontrado' }).waitFor()
    await p.getByRole('link', { name: 'Volver a conductores' }).click()
    await p.getByRole('link', { name: 'Prueba b', exact: true }).click()
    await p.waitForLoadState('networkidle')
    state.getStatus = 401
    await p.getByRole('button', { name: 'Actualizar', exact: true }).click()
    await p.locator('#correo').waitFor()
  })

  await scenario('list transition regression, confirmation cancel, 409 and vehicle pending -> list', async ({ p, state, until, navigate, edit, save }) => {
    await navigate('/conductores')
    state.accept = false
    await p.getByRole('button', { name: 'Aprobar a Prueba a', exact: true }).click()
    assert(state.patches.length === 0, 'cancelled confirmation wrote')
    state.accept = true
    for (const [tab, action, resultTab] of [['Pendientes', 'Aprobar', 'Aprobados'], ['Aprobados', 'Suspender', 'Suspendidos'], ['Suspendidos', 'Reactivar', 'Aprobados']]) {
      await p.getByRole('button', { name: tab, exact: true }).click()
      await p.getByRole('button', { name: `${action} a Prueba a`, exact: true }).click()
      await until(() => p.getByText('Procesando transicion...', { exact: true }).count().then((n) => n === 0), 'list transition')
      await p.getByRole('button', { name: resultTab, exact: true }).click()
      await p.getByRole('link', { name: 'Prueba a', exact: true }).waitFor()
    }
    await p.getByRole('button', { name: 'Pendientes', exact: true }).click()
    state.patchStatus = 409
    await p.getByRole('button', { name: 'Rechazar a Prueba b', exact: true }).click()
    await p.getByText('PATCH mock 409', { exact: true }).waitFor()
    await until(() => p.getByRole('button', { name: 'Rechazar a Prueba b', exact: true }).isEnabled(), '409 recovery')
    state.patchStatus = 200
    await p.getByRole('button', { name: 'Rechazar a Prueba b', exact: true }).click()
    await until(() => p.getByText('Procesando transicion...', { exact: true }).count().then((n) => n === 0), 'reject settled')
    await p.getByRole('button', { name: 'Rechazados', exact: true }).click()
    await p.getByText('No admite transiciones', { exact: true }).waitFor()
    await navigate('/conductores/a'); await edit().click()
    await p.locator('#vehiculo-color').fill('Azul')
    let release
    state.holdPatch = new Promise((resolve) => { release = resolve })
    const before = state.patches.length
    await save().click(); await until(() => state.patches.length > before, 'vehicle PATCH started')
    await navigate('/conductores')
    await p.getByRole('button', { name: 'Aprobados', exact: true }).click()
    await p.getByRole('button', { name: 'Suspender a Prueba a', exact: true }).waitFor()
    assert(await p.getByRole('button', { name: 'Suspender a Prueba a', exact: true }).isDisabled(), 'vehicle PATCH must block list transition')
    release(); state.holdPatch = null
    await until(() => p.getByRole('button', { name: 'Suspender a Prueba a', exact: true }).isEnabled(), 'vehicle reconciliation')
  })

  await scenario('short/mobile viewport scroll restoration and keyboard; listing tabs/filter/links', async ({ p, state, until, navigate, edit }) => {
    state.rows.a.nombreCompleto = 'N'.repeat(100)
    for (const key of ['placa', 'marca', 'modelo', 'color']) state.rows.a.vehiculo[key] = 'V'.repeat(30)
    for (const width of [1280, 1024, 1023, 320]) {
      await p.setViewportSize({ width, height: 480 })
      await navigate('/conductores')
      await p.getByRole('link', { name: state.rows.a.nombreCompleto, exact: true }).waitFor()
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `list overflow ${width}`)
      await p.getByRole('link', { name: `Ver detalle de ${state.rows.a.nombreCompleto}`, exact: true }).click()
      await edit().waitFor()
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `detail overflow ${width}`)
      await edit().scrollIntoViewIfNeeded()
      const scroll = await p.evaluate(() => ({ window: scrollY, main: document.querySelector('main').scrollTop }))
      await edit().click()
      assert(await p.evaluate(() => getComputedStyle(document.body).overflow === 'hidden'), 'background scroll unlocked')
      assert(await p.getByRole('dialog').evaluate((d) => d.scrollWidth <= d.clientWidth), `modal overflow ${width}`)
      await p.locator('#vehiculo-color').fill('Azul')
      await p.getByRole('button', { name: 'Cancelar', exact: true }).focus()
      await p.keyboard.press('Enter')
      await until(() => p.getByRole('dialog').count().then((n) => n === 0), 'keyboard close')
      assert(await p.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'), 'scroll cleanup')
      const after = await p.evaluate(() => ({ window: scrollY, main: document.querySelector('main').scrollTop }))
      assert(Math.abs(after.window - scroll.window) <= 1 && Math.abs(after.main - scroll.main) <= 1, `scroll restoration ${width}`)
    }
    await navigate('/conductores')
    await p.getByLabel('Buscar conductores', { exact: true }).fill('no-match')
    await p.getByRole('button', { name: 'Limpiar busqueda' }).click()
    for (const tab of ['Aprobados', 'Suspendidos', 'Rechazados', 'Pendientes']) await p.getByRole('button', { name: tab, exact: true }).click()
    await p.getByRole('link', { name: 'Prueba b', exact: true }).waitFor()
  })
  return results
}
