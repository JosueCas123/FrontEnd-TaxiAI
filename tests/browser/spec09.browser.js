// Run with browser_run_code_unsafe filename, against Vite dev on 5199.
// Every API is intercepted before navigation; unknown APIs and external hosts are blocked.
async (page) => {
  const origin = 'http://127.0.0.1:5199'
  const results = []
  const assert = (value, message) => { if (!value) throw new Error(message) }
  const states = ['creada', 'buscando', 'conductor_seleccionado', 'esperando_respuesta', 'aceptada', 'en_servicio']
  const labels = ['Creada', 'Buscando conductor', 'Conductor seleccionado', 'Esperando respuesta', 'Aceptada', 'En servicio']
  const row = (i) => ({ id: `aaaaaaaa-0000-4000-8000-${String(i).padStart(12, '0')}`, estado: states[i % 6],
    pasajero: i % 3 === 0 ? null : { id: `p${i}`, nombre: `Pasajero Prueba ${i}` },
    conductorAsignado: i % 2 === 0 ? null : { id: `c${i}`, nombreCompleto: `Conductor Prueba ${i}` },
    destino: i === 0 ? null : 'DestinoFicticioExtenso'.repeat(8), latitudRecogida: -16.123456, longitudRecogida: -68.123456,
    creadoEn: '2026-10-05T02:03:04Z', expiraEn: i === 0 ? null : '2020-01-01T02:03:04Z' })
  async function scenario(name, test) {
    const context = await page.context().browser().newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } })
    const p = await context.newPage()
    await p.clock.install()
    p.setDefaultTimeout(7000)
    const s = { rows: Array.from({ length: 30 }, (_, i) => row(29 - i)), status: 200, calls: 0, hold: null,
      network: false, unknown: [], errors: [], aborted: 0, drivers: [] }
    p.on('pageerror', (error) => s.errors.push(String(error)))
    p.on('requestfailed', (request) => { if (request.url().includes('/solicitudes-activas')) s.aborted++ })
    await context.route('**/*', async (route) => {
      const request = route.request(), url = new URL(request.url()), path = url.pathname
      const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      if (path.startsWith('/api/')) {
        if (path === '/api/auth/admin/login' && request.method() === 'POST') return json(200, { token: 'fictitious-only', tokenType: 'Bearer', expiresIn: 3600 })
        if (path === '/api/configuracion' && request.method() === 'GET') return json(200, { id: 1, nombreEmpresa: 'Empresa ficticia', radioMaximoBusquedaKm: 5, telefonoCentroAtencion: null, actualizadoEn: '2026-10-05T00:00:00Z' })
        if (path === '/api/dashboard/indicadores' && request.method() === 'GET') return json(200, { conductoresDisponibles: 0, conductoresEnServicio: 0, solicitudesActivas: 0, solicitudesCompletadasHoy: 0 })
        if (path === '/api/dashboard/solicitudes-activas' && request.method() === 'GET' && !url.search) {
          s.calls++
          const status = s.status, rows = s.rows, network = s.network
          if (s.hold) await s.hold
          if (network) return route.abort('failed')
          return json(status, status === 200 ? rows : { error: { message: `Fallo ficticio ${status}` } })
        }
        if (path === '/api/conductores' && request.method() === 'GET') return json(200, s.drivers.filter((d) => d.estado === url.searchParams.get('estado')))
        if (path.startsWith('/api/conductores/') && request.method() === 'GET') return json(200, s.drivers.find((d) => d.id === path.split('/').pop()))
        if (path === '/api/dashboard/conductores-mapa' && request.method() === 'GET') return json(200, [])
        s.unknown.push(`${request.method()} ${path}${url.search}`)
        return route.abort('blockedbyclient')
      }
      if (url.origin !== origin) return route.abort('blockedbyclient')
      return route.continue()
    })
    const until = async (condition, message) => {
      for (let i = 0; i < 240; i++) { if (await condition()) return; await p.waitForTimeout(25) }
      throw new Error(message)
    }
    const navigate = (path = '/solicitudes') => p.evaluate((path) => { history.pushState(null, '', path); dispatchEvent(new PopStateEvent('popstate')) }, path)
    const login = async () => {
      await p.locator('#correo').fill('test@example.invalid')
      await p.locator('#contrasena').fill('fictitious-only')
      await p.getByRole('button', { name: 'Ingresar', exact: true }).click()
      await until(async () => await p.locator('#correo').count() === 0, 'login did not finish')
    }
    const settled = () => until(async () => {
      // The Inicio screen has a refresh button with the same label, so anchor on this screen's own control.
      if (await p.getByLabel('Buscar solicitudes').count() !== 1) return false
      const enCurso = await p.getByRole('button', { name: 'Actualizar', exact: true }).isEnabled()
      return enCurso && await p.getByText('Cargando solicitudes...').count() === 0
    }, 'refresh did not settle')
    const update = async () => {
      const before = s.calls
      await p.getByRole('button', { name: 'Actualizar', exact: true }).click()
      await until(() => s.calls > before, 'missing manual GET')
      await settled()
    }
    try {
      await p.goto(`${origin}/login`, { timeout: 30000 })
      await login()
      await test({ p, context, s, until, navigate, login, settled, update })
      assert(s.unknown.length === 0, `unexpected APIs: ${s.unknown}`)
      assert(s.errors.length === 0, `page errors: ${s.errors}`)
      results.push({ name, result: 'PASS' })
    } catch (error) {
      results.push({ name, result: 'FAIL', error: String(error), text: (await p.locator('body').innerText()).slice(0, 3000) })
    } finally { await context.close() }
  }

  await scenario('reading, filters, replacement, responsive, selection and keyboard', async ({ p, s, navigate, settled, update }) => {
    await navigate(); await settled()
    assert(await p.getByRole('heading', { level: 1 }).count() === 1, 'h1')
    assert(await p.getByRole('columnheader').count() === 7, 'seven columns')
    assert(await p.locator('tbody tr').count() === 30, 'truncated rows')
    assert(JSON.stringify(await p.locator('tbody tr td:first-child').allTextContents()) === JSON.stringify(s.rows.map((r) => r.id)), 'server order changed')
    for (const label of labels) assert(await p.getByRole('table').getByText(label, { exact: true }).count() === 5, `badge ${label}`)
    assert((await p.locator('main').innerText()).includes('04/10/2026, 22:03'), 'creation timezone')
    assert((await p.locator('main').innerText()).includes('31/12/2019, 22:03:04'), 'expiration timezone/seconds')
    assert(!((await p.locator('main').innerText()).includes('-16.123456')), 'coordinates exposed')
    const select = p.getByLabel('Estado', { exact: true }), search = p.getByLabel('Buscar solicitudes')
    assert(JSON.stringify(await select.locator('option').evaluateAll((options) => options.map((o) => o.value))) === JSON.stringify(['todos', ...states]), 'selector')
    const before = s.calls
    await search.fill('  CONDUCTOR PRUEBA 29  '); await select.selectOption('en_servicio')
    assert(await p.locator('tbody tr').count() === 1, 'combined filters')
    assert(s.calls === before, 'filter requested API')
    await update()
    assert(await search.inputValue() === '  CONDUCTOR PRUEBA 29  ' && await select.inputValue() === 'en_servicio', 'filters lost')
    await search.fill('absent')
    await p.getByText('No hay solicitudes que coincidan con los filtros.').waitFor()
    await p.getByRole('button', { name: 'Limpiar filtros' }).click()
    await search.fill(s.rows[0].id); assert(await p.locator('tbody tr').count() === 1, 'UUID search')
    await search.fill('pasajero prueba 29'); assert(await p.locator('tbody tr').count() === 1, 'passenger search')
    await search.fill('')
    for (const width of [320, 768, 1024, 1280]) {
      await p.setViewportSize({ width, height: 900 })
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${width}`)
      assert(await p.getByRole('table').count() === (width >= 1024 ? 1 : 0), `table breakpoint ${width}`)
      assert(await p.getByRole('article').count() === (width < 1024 ? 30 : 0), `card breakpoint ${width}`)
      const container = width < 1024 ? p.getByRole('article').first() : p.getByRole('row').nth(1)
      if (width < 1024) assert(await container.locator('dt').count() === 7, 'card fields')
      const id = container.locator('.select-text')
      const selected = await id.evaluate((element) => {
        const range = document.createRange(); range.selectNodeContents(element)
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range)
        return { text: selection.toString(), selectable: getComputedStyle(element).userSelect }
      })
      assert(selected.text === s.rows[0].id && selected.selectable === 'text', `UUID selection ${width}`)
    }
    // CSS zoom exercises 2x layout; native browser zoom is not automated here.
    await p.evaluate(() => { document.documentElement.style.zoom = '2' })
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '2x zoom overflow')
    await p.evaluate(() => { document.documentElement.style.zoom = '' })
    await search.focus(); await p.keyboard.press('Tab')
    assert(await select.evaluate((e) => e === document.activeElement && getComputedStyle(e).outlineStyle !== 'none'), 'keyboard focus')
    const firstId = s.rows[0].id
    s.rows = [{ ...s.rows[1], estado: 'aceptada' }]
    await update()
    assert(await p.locator('tbody tr').count() === 1 && !(await p.locator('main').innerText()).includes(firstId), 'replacement')
    s.rows = []; await update()
    await p.getByText('No hay solicitudes activas', { exact: true }).waitFor()
    assert(await p.getByRole('button', { name: 'Limpiar filtros' }).count() === 0, 'global empty offers filter reset')
    assert(await p.evaluate(() => localStorage.length === 0 && sessionStorage.length === 0), 'persisted state')
  })

  await scenario('polling, visibility, manual concurrency and cached refetch', async ({ p, s, until, navigate, settled }) => {
    await navigate(); await settled()
    for (let cycle = 0; cycle < 2; cycle++) {
      const before = s.calls
      await p.clock.runFor(15100)
      await until(() => s.calls === before + 1, '15s polling'); await settled()
    }
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) })
    const hidden = s.calls
    await p.clock.runFor(31000); assert(s.calls === hidden, 'hidden polling')
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); document.dispatchEvent(new Event('visibilitychange')) })
    await p.clock.runFor(15100); await until(() => s.calls === hidden + 1, 'visible polling resumes'); await settled()
    let release
    s.hold = new Promise((resolve) => { release = resolve })
    const before = s.calls
    await p.getByRole('button', { name: 'Actualizar', exact: true }).evaluate((b) => { b.click(); b.click(); b.click() })
    await until(() => s.calls === before + 1, 'manual request')
    assert(await p.locator('tbody tr').count() === 30, 'refetch removed data')
    assert(await p.getByText('Cargando solicitudes...').count() === 0, 'refetch skeleton')
    await p.clock.runFor(31000); assert(s.calls === before + 1, 'overlap while held')
    release(); s.hold = null; await settled()
  })

  for (const cached of [false, true]) await scenario(`offline ${cached ? 'cached' : 'initial'} and reconnect`, async ({ p, context, s, until, navigate, settled, update }) => {
    if (cached) { await navigate(); await settled() }
    await context.setOffline(true)
    await until(() => p.evaluate(() => !navigator.onLine), 'navigator offline')
    if (!cached) await navigate()
    await p.getByText('Sin conexion. La consulta se reanudara al recuperar la conexion.').waitFor()
    const before = s.calls
    const button = p.getByRole('button', { name: 'Actualizar', exact: true })
    assert(await button.isDisabled(), 'offline action enabled')
    await button.evaluate((b) => { b.click(); b.click(); b.click() })
    await p.clock.runFor(31000)
    assert(s.calls === before, 'offline request')
    assert(await p.locator('tbody tr').count() === (cached ? 30 : 0), 'offline cached data')
    assert(!/Cargando solicitudes|Actualizando|Total: 0/.test(await p.locator('main').innerText()), 'offline false activity/zero')
    await context.setOffline(false); await settled()
    await until(() => s.calls > before, 'reconnect request')
    await update()
  })

  for (const kind of ['network', 500]) for (const cached of [false, true]) await scenario(`${kind} ${cached ? 'cached' : 'initial'} retry and recovery`, async ({ p, s, until, navigate, settled, update }) => {
    if (cached) { await navigate(); await settled(); await p.getByLabel('Buscar solicitudes').fill('Prueba 29') }
    s.network = kind === 'network'; s.status = kind === 'network' ? 200 : kind
    const before = s.calls
    if (cached) await p.getByRole('button', { name: 'Actualizar', exact: true }).click()
    else await navigate()
    await p.getByRole('button', { name: 'Reintentar', exact: true }).waitFor()
    // React Query schedules the single automatic retry with a timer, so the fake clock must advance.
    // Counts stay relative: StrictMode may issue more than one request per mount in development.
    await p.clock.runFor(1500)
    await until(() => s.calls > before, 'automatic retry never happened')
    await p.clock.runFor(5000); await p.waitForTimeout(300)
    const trasReintento = s.calls
    await p.clock.runFor(5000); await p.waitForTimeout(300)
    assert(s.calls === trasReintento, 'retried more than once')
    const notice = p.getByRole(cached ? 'status' : 'alert').filter({ hasText: 'No se pudieron' })
    assert(await notice.count() === 1, 'wrong error role')
    if (cached) assert(await p.locator('tbody tr').count() === 1 && (await notice.innerText()).includes('desactualizados'), 'cached error lost data/filter')
    else assert(!/Total: 0|No hay solicitudes activas/.test(await p.locator('main').innerText()), 'error mistaken for empty')
    s.network = false; s.status = 200
    await p.getByRole('button', { name: 'Reintentar' }).evaluate((b) => { b.click(); b.click(); b.click() })
    await until(() => s.calls > trasReintento, 'retry concurrency')
    await settled()
    assert(await p.locator('tbody tr').count() === (cached ? 1 : 30), 'recovery lost data/filter')
    assert(await p.getByRole('button', { name: 'Reintentar' }).count() === 0, 'error not cleared')
    await update()
  })

  for (const status of [400, 403, 404]) await scenario(`${status} no retry, initial and cached`, async ({ p, s, navigate, settled, update }) => {
    // StrictMode issues two requests per mount in dev, so no-retry is measured over a window
    // longer than the retry delay but shorter than the 15 s polling interval.
    const sinReintento = async () => {
      const antes = s.calls
      await p.clock.runFor(2000); await p.waitForTimeout(300)
      assert(s.calls === antes, `${status} retried automatically`)
    }
    s.status = status
    await navigate(); await p.getByRole('alert').waitFor()
    await sinReintento()
    assert(await p.getByRole('button', { name: 'Reintentar' }).count() === 0, '4xx offers retry')
    assert((await p.getByRole('alert').innerText()).includes(`Fallo ficticio ${status}`), 'backend message missing')
    s.status = 200; await update(); await settled()
    s.status = status; await update()
    assert(await p.getByRole('status').filter({ hasText: 'No se pudieron actualizar' }).count() === 1, '4xx cached warning')
    assert(await p.locator('tbody tr').count() === 30, '4xx discarded data')
    await sinReintento()
    assert(!p.url().endsWith('/login'), '4xx logged out')
  })

  await scenario('401 global logout', async ({ p, s, navigate }) => {
    s.status = 401; await navigate()
    await p.locator('#correo').waitFor()
    assert(p.url().endsWith('/login'), '401 did not redirect')
  })

  await scenario('cancellation, logout and late session A response cannot enter B', async ({ p, s, until, navigate, settled, login }) => {
    let release
    s.rows = [{ ...row(0), pasajero: { id: 'a', nombre: 'SESION_A_FICTICIA' } }]
    s.hold = new Promise((resolve) => { release = resolve })
    await navigate(); await until(() => s.calls > 0, 'held request')
    await p.getByText('Cargando solicitudes...', { exact: true }).waitFor()
    assert(!(await p.locator('main').innerText()).includes('Total:'), 'pending total')
    await p.getByRole('button', { name: /Cerrar sesi/ }).click()
    await p.locator('#correo').waitFor()
    await until(() => s.aborted > 0, 'transport not cancelled')
    s.hold = null; s.rows = [{ ...row(1), pasajero: { id: 'b', nombre: 'SESION_B_FICTICIA' } }]
    await login(); await navigate(); await settled()
    release(); await p.waitForTimeout(100)
    assert((await p.locator('main').innerText()).includes('SESION_B_FICTICIA'), 'B missing')
    assert(!/SESION_A_FICTICIA|AbortError|CancelledError/.test(await p.locator('body').innerText()), 'A leaked/error announced')
  })

  await scenario('shared badges in Lista table/cards, Detalle, active badges and fallback', async ({ p, s, navigate }) => {
    const accounts = ['pendiente', 'aprobado', 'rechazado', 'suspendido']
    const journeys = ['no_iniciada', 'activa', 'finalizada']
    const availability = ['disponible', 'no_disponible', 'solicitud_pendiente', 'en_servicio']
    const expected = {
      pendiente: ['Pendiente', 'bg-[#fff5db] text-[#a17614]'], aprobado: ['Aprobado', 'bg-[#eaf7f1] text-[#198363]'],
      rechazado: ['Rechazado', 'bg-red-50 text-red-700'], suspendido: ['Suspendido', 'bg-gris/15 text-gris'],
      no_iniciada: ['No iniciada', 'bg-gris/15 text-gris'], activa: ['En jornada', 'bg-[#eaf7f1] text-[#198363]'], finalizada: ['Finalizada', 'bg-verde/10 text-verde'],
      disponible: ['Disponible', 'bg-verde/10 text-verde'], no_disponible: ['No disponible', 'bg-gris/15 text-gris'],
      solicitud_pendiente: ['Solicitud pendiente', 'bg-ambar/10 text-ambar'], en_servicio: ['En servicio', 'bg-azul/10 text-azul'],
    }
    s.drivers = accounts.map((estado, i) => ({ id: `driver-${i}`, usuarioId: `user-${i}`, estado,
      estadoJornada: journeys[i % 3], estadoDisponibilidad: availability[i], nombreCompleto: `Conductor Ficticio ${i}`,
      telefono: '00000000', cedulaIdentidad: 'FICTICIO', creadoEn: '2026-10-05T00:00:00Z', vehiculo: null }))
    const verify = async (root, keys) => {
      for (const key of keys) {
        const [label, classes] = expected[key]
        const badges = root.locator('span').filter({ has: p.locator('i[aria-hidden="true"]') }).filter({ hasText: new RegExp(`^${label}$`) })
        assert(await badges.count() > 0, `missing ${key}`)
        assert(await badges.first().evaluate((e, classes) => classes.split(' ').every((c) => e.classList.contains(c)), classes), `changed ${key}`)
      }
    }
    for (const width of [1280, 768]) {
      await p.setViewportSize({ width, height: 900 }); await navigate('/conductores')
      for (let i = 0; i < accounts.length; i++) {
        await p.getByRole('button', { name: ['Pendientes', 'Aprobados', 'Rechazados', 'Suspendidos'][i], exact: true }).click()
        await p.getByRole('link', { name: `Conductor Ficticio ${i}`, exact: true }).waitFor()
        await verify(p.locator('main'), [accounts[i], journeys[i % 3], availability[i]])
      }
    }
    for (let i = 0; i < accounts.length; i++) {
      await navigate(`/conductores/driver-${i}`)
      await p.getByRole('heading', { name: `Conductor Ficticio ${i}`, exact: true }).waitFor()
      await verify(p.locator('main'), [accounts[i], journeys[i % 3], availability[i]])
    }
    // Invoke the real shared component directly to inspect its fallback without a test renderer.
    const rendered = await p.evaluate(async () => {
      const { default: Badge } = await import('/src/components/EstadoBadge.tsx')
      const element = Badge({ estado: 'desconocido' })
      return { clase: String(element.props.className), contenido: JSON.stringify(element.props.children) }
    })
    assert(rendered.clase.includes('bg-gris/15 text-gris') && rendered.contenido.includes('desconocido'), 'fallback changed')
    await p.setViewportSize({ width: 1280, height: 900 }); await navigate()
    await p.getByRole('table').waitFor()
    for (let i = 0; i < states.length; i++) {
      const badge = p.getByRole('table').getByText(labels[i], { exact: true }).first()
      const color = i < 4 ? 'ambar' : i === 4 ? 'verde' : 'azul'
      assert(await badge.evaluate((e, color) => e.classList.contains(`bg-${color}/10`) && e.classList.contains(`text-${color}`), color), `active badge ${states[i]}`)
    }
  })
  return results
}
