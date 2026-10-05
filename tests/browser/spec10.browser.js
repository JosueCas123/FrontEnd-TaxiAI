// Run with browser_run_code_unsafe filename against Vite on 5199.
// Synthetic API only; interception precedes navigation, including login and shell.
async (page) => {
  const origin = 'http://127.0.0.1:5199', results = []
  const assert = (value, message) => { if (!value) throw new Error(message) }
  const row = (id, descripcion = 'Tarifa ficticia') => ({ id, descripcion, monto: '15.00', vigenciaDesde: '2026-01-01' })
  async function scenario(name, test) {
    const context = await page.context().browser().newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } })
    const p = await context.newPage()
    await p.clock.install()
    p.setDefaultTimeout(6000)
    const s = { rows: [row('a'), row('b'), row('c', 'DescripcionFicticiaLarga'.repeat(10))], status: 200, writeStatus: 200,
      calls: 0, writes: [], unknown: [], errors: [], network: false, hold: null, writeHold: null }
    p.on('pageerror', (error) => s.errors.push(String(error)))
    await context.route('**/*', async (route) => {
      const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method()
      const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
      const message = (status) => ({ error: { message: ({ 400: 'Entrada invalida', 401: 'Credenciales invalidas', 403: 'Permiso denegado', 404: 'Tarifa no encontrada', 500: 'Error interno del servidor' })[status] } })
      if (path.startsWith('/api/')) {
        if (path === '/api/auth/admin/login' && method === 'POST') return json(200, { token: 'fictitious-only', tokenType: 'Bearer', expiresIn: 3600 })
        if (path === '/api/configuracion' && method === 'GET') return json(200, { id: 1, nombreEmpresa: 'Empresa ficticia', radioMaximoBusquedaKm: 5, telefonoCentroAtencion: null, actualizadoEn: '2026-10-05T00:00:00Z' })
        if (path === '/api/dashboard/indicadores' && method === 'GET') return json(200, { conductoresDisponibles: 0, conductoresEnServicio: 0, solicitudesActivas: 0, solicitudesCompletadasHoy: 0 })
        if (path === '/api/tarifas' && method === 'GET' && !url.search) {
          s.calls++
          const status = s.status, rows = s.rows, network = s.network
          if (s.hold) await s.hold
          if (network) return route.abort('failed')
          return json(status, status === 200 ? rows : message(status))
        }
        if ((path === '/api/tarifas' && method === 'POST') || (path.startsWith('/api/tarifas/') && method === 'PATCH')) {
          const body = request.postDataJSON()
          s.writes.push({ method, path, body })
          if (s.writeHold) await s.writeHold
          if (s.writeStatus !== 200) return json(s.writeStatus, message(s.writeStatus))
          const result = method === 'POST' ? { id: 'new', ...body } : { ...s.rows.find((r) => r.id === path.split('/').pop()), ...body }
          s.rows = method === 'POST' ? [result, ...s.rows] : s.rows.map((r) => r.id === result.id ? result : r)
          return json(method === 'POST' ? 201 : 200, result)
        }
        s.unknown.push(`${method} ${path}${url.search}`)
        return route.abort('blockedbyclient')
      }
      if (url.origin !== origin) return route.abort('blockedbyclient')
      return route.continue()
    })
    const until = async (condition, message) => {
      for (let i = 0; i < 240; i++) { if (await condition()) return; await p.waitForTimeout(25) }
      throw new Error(message)
    }
    const navigate = () => p.evaluate(() => { history.pushState(null, '', '/tarifas'); dispatchEvent(new PopStateEvent('popstate')) })
    const login = async () => {
      await p.locator('#correo').fill('test@example.invalid')
      await p.locator('#contrasena').fill('fictitious-only')
      await p.getByRole('button', { name: 'Ingresar', exact: true }).click()
      await until(async () => await p.locator('#correo').count() === 0, 'login')
    }
    const ready = () => p.getByRole('region', { name: 'Resultados de tarifas' }).waitFor()
    const open = async (edit = false) => {
      await (edit ? p.getByRole('button', { name: 'Editar Tarifa ficticia', exact: true }).first() : p.getByRole('button', { name: 'Nueva tarifa', exact: true })).click()
      await p.getByRole('dialog').waitFor()
    }
    const fill = async () => {
      await p.getByLabel('Descripcion', { exact: true }).fill('Alta ficticia')
      await p.getByLabel('Monto en bolivianos').fill('0.01')
      await p.getByLabel('Vigencia desde', { exact: true }).fill('2026-01-01')
    }
    const poll = async () => { const before = s.calls; await p.clock.runFor(15100); await until(() => s.calls > before, 'poll'); await p.waitForTimeout(100) }
    try {
      await p.goto(`${origin}/login`)
      await login()
      await test({ p, context, s, until, navigate, login, ready, open, fill, poll })
      assert(s.unknown.length === 0, `unexpected APIs ${s.unknown}`)
      assert(s.errors.length === 0, `page errors ${s.errors}`)
      results.push({ name, result: 'PASS' })
    } catch (error) {
      results.push({ name, result: 'FAIL', error: String(error), text: (await p.locator('body').innerText()).slice(0, 3500) })
    } finally { await context.close() }
  }

  await scenario('literal texts, server order, fallback, responsive, focus, keyboard and CSS 200%', async ({ p, s, navigate, ready, open }) => {
    s.rows[1].monto = '05.00'
    await navigate(); await ready()
    for (const text of ['Administra los valores oficiales que se informan a los pasajeros.', 'Tarifario de la empresa', '3 tarifas vigentes · Montos en bolivianos (Bs)', 'Valores fijos',
      'El asistente consulta este tarifario para responder a los pasajeros. Las tarifas son fijas; no se calculan automaticamente por kilometro.',
      'El monto informado es aproximado y no es un precio garantizado. El asistente solo cita estos valores del tarifario oficial.']) await p.getByText(text, { exact: true }).waitFor()
    assert(await p.getByRole('heading', { level: 1, name: 'Tarifas', exact: true }).count() === 1, 'h1')
    assert(JSON.stringify(await p.getByRole('columnheader').allTextContents()) === JSON.stringify(['Descripcion', 'Monto', 'Vigencia desde', 'Acciones']), 'columns')
    assert(JSON.stringify(await p.locator('tbody td:first-child').allTextContents()) === JSON.stringify(s.rows.map((r) => r.descripcion)), 'server order')
    assert(await p.getByRole('table').getByText('15.00 Bs', { exact: true }).count() === 2, 'amount')
    assert(await p.getByRole('table').getByText('Monto no disponible', { exact: true }).count() === 1, 'fallback')
    assert(await p.getByRole('table').getByText('01/01/2026', { exact: true }).count() === 3, 'calendar')
    for (const width of [320, 768, 1024, 1280]) {
      await p.setViewportSize({ width, height: 900 })
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${width}`)
      assert(await p.getByRole('table').count() === (width >= 1024 ? 1 : 0), 'table breakpoint')
      assert(await p.getByRole('article').count() === (width < 1024 ? 3 : 0), 'card breakpoint')
      if (width < 1024) assert(await p.getByRole('article').first().locator('dt').count() === 3, 'card fields')
      await open()
      assert(await p.getByLabel('Descripcion', { exact: true }).evaluate((e) => e === document.activeElement), 'initial focus')
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'dialog overflow')
      await p.getByRole('button', { name: 'Cancelar', exact: true }).click()
    }
    await open()
    for (const text of ['Define un valor fijo del tarifario oficial.', 'Entre 1 y 255 caracteres.', 'Dos decimales exactos, sin comas ni signo. El minimo es 0.01 y el maximo 99999999.99.']) await p.getByText(text, { exact: true }).waitFor()
    assert(await p.getByLabel('Monto en bolivianos').getAttribute('type') === 'text', 'text input')
    assert(await p.getByLabel('Monto en bolivianos').getAttribute('inputmode') === 'decimal', 'decimal mode')
    assert(await p.getByLabel('Monto en bolivianos').getAttribute('placeholder') === '0.00', 'amount placeholder')
    assert(await p.getByLabel('Descripcion', { exact: true }).getAttribute('placeholder') === 'Ej. Tarifa base diurna', 'description placeholder')
    const today = await p.evaluate(() => {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
      const value = (type) => parts.find((part) => part.type === type).value
      return `${value('year')}-${value('month')}-${value('day')}`
    })
    assert(await p.getByLabel('Vigencia desde', { exact: true }).inputValue() === today, 'default today in La Paz')
    await p.keyboard.press('Tab')
    assert(await p.getByLabel('Monto en bolivianos').evaluate((e) => e === document.activeElement && e.matches(':focus-visible') && getComputedStyle(e).boxShadow !== 'none'), 'visible keyboard focus ring')
    for (let i = 0; i < 10; i++) {
      await p.keyboard.press('Tab')
      assert(await p.getByRole('dialog').evaluate((e) => e.contains(document.activeElement)), 'focus escaped modal')
    }
    await p.evaluate(() => { document.documentElement.style.zoom = '2' })
    await p.getByRole('button', { name: 'Agregar tarifa' }).scrollIntoViewIfNeeded()
    const box = await p.getByRole('button', { name: 'Agregar tarifa' }).boundingBox()
    assert(box && box.y >= 0 && box.y + box.height <= 900, '2x actions clipped')
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '2x overflow')
    await p.evaluate(() => { document.documentElement.style.zoom = '' })
    await p.keyboard.press('Escape')
    assert(await p.getByRole('button', { name: 'Nueva tarifa', exact: true }).evaluate((e) => e === document.activeElement), 'return focus')
    assert(await p.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'), 'scroll lock remains')
    assert(s.writes.length === 0, 'reading wrote')
  })

  await scenario('empty, validation, POST 201, one write for three clicks and repeated Enter, invalidation', async ({ p, s, until, navigate, ready, open, fill }) => {
    s.rows = []; await navigate(); await ready()
    await p.getByText('No hay tarifas vigentes', { exact: true }).waitFor()
    await p.getByText('Registra la primera tarifa con el boton Nueva tarifa.', { exact: true }).waitFor()
    assert(await p.getByRole('button', { name: 'Reintentar' }).count() === 0, 'empty retry')
    await open()
    await p.getByRole('button', { name: 'Agregar tarifa' }).click()
    await p.getByText('Ingresa una descripcion.', { exact: true }).waitFor()
    assert(await p.getByLabel('Descripcion', { exact: true }).getAttribute('aria-invalid') === 'true', 'aria invalid')
    assert((await p.getByLabel('Descripcion', { exact: true }).getAttribute('aria-describedby')).includes('error-descripcion'), 'error association')
    await fill()
    let release; s.writeHold = new Promise((resolve) => { release = resolve })
    const reads = s.calls
    await p.getByRole('button', { name: 'Agregar tarifa' }).evaluate((b) => { b.click(); b.click(); b.click() })
    await until(() => s.writes.length === 1, 'POST')
    await p.keyboard.press('Enter'); await p.keyboard.press('Enter')
    await p.getByRole('dialog').locator('form').evaluate((f) => { f.requestSubmit(); f.requestSubmit() })
    assert(await p.getByRole('dialog').locator('fieldset').evaluate((e) => e.disabled), 'fieldset')
    assert(await p.getByLabel('Monto en bolivianos').isDisabled(), 'disabled input inherited from fieldset')
    await p.clock.runFor(31000)
    assert(s.writes.length === 1 && s.calls === reads, 'duplicate/poll while saving')
    assert(JSON.stringify(s.writes[0].body) === JSON.stringify({ descripcion: 'Alta ficticia', monto: '0.01', vigenciaDesde: '2026-01-01' }), 'POST payload')
    release(); s.writeHold = null
    await p.getByText('Tarifa agregada.', { exact: true }).waitFor()
    await until(() => s.calls > reads, 'invalidation')
    await p.getByRole('table').getByText('Alta ficticia', { exact: true }).waitFor()
    assert(await p.getByRole('button', { name: 'Nueva tarifa', exact: true }).evaluate((e) => e === document.activeElement), 'POST return focus')
    assert(await p.evaluate(() => localStorage.length === 0 && sessionStorage.length === 0), 'persisted')
  })

  await scenario('PATCH minimal, readonly date, no-op, slow write guard and both fields', async ({ p, s, until, navigate, ready, open }) => {
    await navigate(); await ready(); await open(true)
    await p.getByRole('heading', { name: 'Editar tarifa', exact: true }).waitFor()
    await p.getByText('La vigencia no se puede cambiar desde aqui.', { exact: true }).waitFor()
    assert(await p.getByLabel('Vigencia desde', { exact: true }).getAttribute('readonly') !== null, 'readonly')
    await p.getByLabel('Vigencia desde', { exact: true }).focus()
    await p.keyboard.press('ArrowUp')
    assert(await p.getByLabel('Vigencia desde', { exact: true }).inputValue() === '2026-01-01', 'keyboard changed readonly date')
    assert(await p.getByRole('button', { name: 'Guardar cambios', exact: true }).isDisabled(), 'no-op enabled')
    await p.getByRole('dialog').locator('form').evaluate((f) => f.requestSubmit())
    await p.waitForTimeout(100); assert(s.writes.length === 0, 'no-op write')
    await p.getByLabel('Descripcion', { exact: true }).fill(' Tarifa ficticia ')
    assert(await p.getByRole('button', { name: 'Guardar cambios', exact: true }).isDisabled(), 'trim no-op')
    await p.getByLabel('Monto en bolivianos').fill('99999999.99')
    let release; s.writeHold = new Promise((resolve) => { release = resolve })
    await p.getByRole('button', { name: 'Guardar cambios', exact: true }).evaluate((b) => { b.click(); b.click(); b.click() })
    await until(() => s.writes.length === 1, 'PATCH')
    await p.getByRole('dialog').locator('form').evaluate((f) => { f.requestSubmit(); f.requestSubmit() })
    await p.keyboard.press('Enter'); await p.keyboard.press('Enter')
    await p.waitForTimeout(100)
    assert(s.writes.length === 1 && JSON.stringify(s.writes[0].body) === '{"monto":"99999999.99"}', 'minimal/duplicate PATCH')
    release(); s.writeHold = null
    await p.getByText('Cambios guardados.', { exact: true }).waitFor()
    await p.getByRole('table').getByText('99999999.99 Bs', { exact: true }).waitFor()
    assert(await p.getByRole('button', { name: 'Editar Tarifa ficticia', exact: true }).first().evaluate((e) => e === document.activeElement), 'PATCH return focus')
    await open(true)
    await p.getByLabel('Descripcion', { exact: true }).fill('Otra ficticia')
    await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
    await until(() => s.writes.length === 2, 'description PATCH')
    assert(JSON.stringify(s.writes[1].body) === '{"descripcion":"Otra ficticia"}', 'description only')
    await p.getByRole('table').getByText('Otra ficticia', { exact: true }).waitFor()
    await p.getByRole('button', { name: 'Editar Otra ficticia', exact: true }).click()
    await p.getByLabel('Descripcion', { exact: true }).fill('Ambos ficticios')
    await p.getByLabel('Monto en bolivianos').fill('0.01')
    await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
    await until(() => s.writes.length === 3, 'both PATCH')
    assert(JSON.stringify(s.writes[2].body) === '{"descripcion":"Ambos ficticios","monto":"0.01"}', 'both keys')
  })

  await scenario('15s polling, dialog pause, visibility pause, replacement, held refetch', async ({ p, s, until, navigate, ready, open, poll }) => {
    await navigate(); await ready()
    await p.getByRole('button', { name: 'Nueva tarifa', exact: true }).focus()
    await poll()
    assert(await p.getByRole('button', { name: 'Nueva tarifa', exact: true }).evaluate((e) => e === document.activeElement), 'poll moved focus')
    assert(await p.getByRole('table').evaluate((e) => e.closest('[aria-live], [role="status"]') === null), 'table live region')
    await open(); await p.getByLabel('Descripcion', { exact: true }).fill('Borrador ficticio')
    const before = s.calls; await p.clock.runFor(31000)
    assert(s.calls === before && await p.getByLabel('Descripcion', { exact: true }).inputValue() === 'Borrador ficticio', 'dialog pause')
    await p.keyboard.press('Escape'); await poll()
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')) })
    const hidden = s.calls; await p.clock.runFor(31000); assert(s.calls === hidden, 'hidden poll')
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); document.dispatchEvent(new Event('visibilitychange')) })
    let release; s.hold = new Promise((resolve) => { release = resolve })
    await poll(); const held = s.calls
    await p.clock.runFor(31000); assert(s.calls === held, 'overlapping reads')
    assert(await p.locator('tbody tr').count() === 3 && await p.getByText('Cargando tarifas...', { exact: true }).count() === 0, 'refetch skeleton')
    release(); s.hold = null; await p.waitForTimeout(100)
    s.rows = [row('only', 'Reemplazo ficticio')]; await poll()
    await until(async () => await p.locator('tbody tr').count() === 1, 'replacement')
    assert(s.writes.length === 0, 'poll wrote')
  })

  for (const status of [400, 403, 404, 500]) await scenario(`write ${status} retains dialog, message and manual recovery`, async ({ p, s, until, navigate, ready, open }) => {
    await navigate(); await ready(); await open(true)
    await p.getByLabel('Monto en bolivianos').fill('0.01')
    s.writeStatus = status
    await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
    const alert = p.getByRole('dialog').getByRole('alert')
    await alert.waitFor()
    assert((await alert.innerText()).includes(({ 400: 'Entrada invalida', 403: 'Permiso denegado', 404: 'Tarifa no encontrada', 500: 'Error interno del servidor' })[status]), 'backend message')
    assert(await p.getByLabel('Monto en bolivianos').inputValue() === '0.01' && !p.url().endsWith('/login'), 'lost draft/session')
    await p.clock.runFor(2000); assert(s.writes.length === 1, 'automatic write retry')
    if (status === 404) {
      assert((await alert.innerText()).includes('La tarifa ya no existe.'), '404 explanation')
      assert(await p.getByRole('button', { name: 'Guardar cambios', exact: true }).isDisabled(), '404 not blocked')
      const reads = s.calls
      await p.getByRole('button', { name: 'Recargar lista' }).click()
      await until(() => s.calls > reads, '404 reload')
      await until(async () => await p.getByRole('region', { name: 'Resultados de tarifas' }).evaluate((e) => e === document.activeElement), 'reload focus')
    } else {
      s.writeStatus = 200
      await p.getByRole('button', { name: 'Guardar cambios', exact: true }).click()
      await p.getByText('Cambios guardados.', { exact: true }).waitFor()
    }
  })

  for (const cached of [false, true]) for (const kind of ['network', 500]) await scenario(`read ${kind} cached=${cached}, one retry, triple manual click`, async ({ p, s, until, navigate, ready, poll }) => {
    if (cached) { await navigate(); await ready() }
    s.network = kind === 'network'; s.status = kind === 'network' ? 200 : kind
    if (cached) await poll(); else await navigate()
    await p.waitForTimeout(100); await p.clock.runFor(2000)
    await p.getByRole('button', { name: 'Reintentar', exact: true }).waitFor()
    const after = s.calls; await p.clock.runFor(5000); assert(s.calls === after, 'extra retry')
    const notice = p.getByRole(cached ? 'status' : 'alert').filter({ hasText: 'No se pudieron' })
    await notice.waitFor()
    if (cached) {
      assert((await notice.innerText()).includes('No se pudieron actualizar las tarifas. Se muestran los ultimos datos cargados.'), 'stale literal')
      assert(await p.locator('tbody tr').count() === 3, 'cache lost')
    } else assert(await p.getByText('No hay tarifas vigentes', { exact: true }).count() === 0, 'false empty')
    s.network = false; s.status = 200
    let release; s.hold = new Promise((resolve) => { release = resolve })
    await p.getByRole('button', { name: 'Reintentar', exact: true }).evaluate((b) => { b.click(); b.click(); b.click() })
    await until(() => s.calls > after, 'manual retry')
    assert(s.calls === after + 1, 'manual overlap')
    release(); s.hold = null; await ready()
    await until(async () => await p.getByRole('button', { name: 'Reintentar' }).count() === 0, 'recovery')
  })

  for (const status of [400, 403]) await scenario(`read ${status} no automatic retry, backend message, session retained`, async ({ p, s, navigate }) => {
    s.status = status; await navigate(); await p.getByRole('alert').waitFor()
    const before = s.calls; await p.clock.runFor(2000); assert(s.calls === before, '4xx retry')
    await p.getByText(status === 403 ? 'Permiso denegado' : 'Entrada invalida', { exact: true }).waitFor()
    if (status === 403) {
      await p.getByText('Tu usuario no tiene permiso para consultar las tarifas.', { exact: true }).waitFor()
      assert(await p.getByRole('button', { name: 'Reintentar' }).count() === 0, '403 recoverable')
    }
    assert(!p.url().endsWith('/login'), '4xx logout')
  })

  for (const cached of [false, true]) await scenario(`offline cached=${cached} and reconnect`, async ({ p, context, s, until, navigate, ready }) => {
    if (cached) { await navigate(); await ready() }
    await context.setOffline(true); await until(() => p.evaluate(() => !navigator.onLine), 'offline')
    if (!cached) await navigate()
    await p.getByRole('status').filter({ hasText: 'Sin conexion.' }).waitFor()
    const before = s.calls; await p.clock.runFor(31000); assert(s.calls === before, 'offline poll')
    assert(await p.locator('tbody tr').count() === (cached ? 3 : 0), 'offline data')
    await context.setOffline(false); await ready(); await until(() => s.calls > before, 'reconnect')
  })

  for (const status of [400, 403, 500, 401]) await scenario(`POST error ${status}`, async ({ p, s, navigate, ready, open, fill }) => {
    await navigate(); await ready(); await open(); await fill()
    s.writeStatus = status
    await p.getByRole('button', { name: 'Agregar tarifa', exact: true }).click()
    if (status === 401) {
      await p.locator('#correo').waitFor()
      assert(p.url().endsWith('/login'), 'POST 401 redirect')
    } else {
      await p.getByRole('dialog').getByRole('alert').waitFor()
      await p.getByText(({ 400: 'Entrada invalida', 403: 'Permiso denegado', 500: 'Error interno del servidor' })[status], { exact: true }).waitFor()
      assert(await p.getByLabel('Descripcion', { exact: true }).inputValue() === 'Alta ficticia', 'POST draft lost')
      s.writeStatus = 200
      await p.getByRole('button', { name: 'Agregar tarifa', exact: true }).click()
      await p.getByText('Tarifa agregada.', { exact: true }).waitFor()
    }
  })

  await scenario('401 global logout and late session response discarded', async ({ p, s, until, navigate, ready, login }) => {
    s.status = 401; await navigate(); await p.locator('#correo').waitFor()
    assert(p.url().endsWith('/login'), '401 redirect')
    s.status = 200; await login()
    let release; s.hold = new Promise((resolve) => { release = resolve })
    s.rows = [row('a', 'SESION_A_FICTICIA')]
    const before = s.calls; await navigate(); await until(() => s.calls > before, 'held GET')
    await p.getByText('Cargando tarifas...', { exact: true }).waitFor()
    assert(!/0 tarifas vigentes|No hay tarifas vigentes/.test(await p.locator('main').innerText()), 'pending fake zero/empty')
    await p.getByRole('button', { name: /Cerrar sesi/ }).click(); await p.locator('#correo').waitFor()
    s.hold = null; s.rows = [row('b', 'SESION_B_FICTICIA')]
    await login(); await navigate(); await ready()
    release(); await p.waitForTimeout(100)
    assert((await p.locator('main').innerText()).includes('SESION_B_FICTICIA'), 'B absent')
    assert(!/SESION_A_FICTICIA|AbortError|CancelledError/.test(await p.locator('body').innerText()), 'late session leak')
  })
  return results
}
