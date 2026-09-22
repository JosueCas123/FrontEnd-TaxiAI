'use strict';

// Prototipo de presentación: datos ficticios y cambios únicamente en memoria.
// La API de producción sigue siendo la fuente de verdad operativa.
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  car:'M5 17H3v-6l2-6h14l2 6v6h-2M5 17h14M5 17v3M19 17v3M3 11h18M7 14h.01M17 14h.01M9 2h6',
  home:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  map:'m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
  pin:'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  requests:'M8 3H5a2 2 0 0 0-2 2v15a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V5a2 2 0 0 0-2-2h-3M8 2h8v4H8zM7 11h10M7 16h6',
  wallet:'M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6M20 12h-5v5h5M16 14.5h.01',
  settings:'m12 2 2 3 3-.5 2 3-1 3 1 3-2 3-3-.5-2 3-2-3-3 .5-2-3 1-3-1-3 2-3 3 .5zM15 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  logout:'M9 3H4v18h5M14 8l5 4-5 4M8 12h11',
  chevron:'m9 5 7 7-7 7', arrow:'M4 12h16M14 6l6 6-6 6', back:'M20 12H4M10 6l-6 6 6 6',
  check:'m5 12 4 4L19 6', checkCircle:'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4l-10 10-3-3',
  clock:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 2',
  refresh:'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2l1 4M18 18a8 8 0 0 1-13-2l-1-4',
  calendar:'M4 5h16v16H4zM4 10h16M8 2v6M16 2v6',
  alert:'m12 3 10 18H2zM12 9v4M12 17h.01',
  info:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 11v6M12 7h.01',
  search:'M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0M15 15l6 6',
  close:'m6 6 12 12M18 6 6 18', plus:'M12 5v14M5 12h14',
  edit:'m16 3 5 5-12 12-6 1 1-6zM13 6l5 5',
  eye:'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  lock:'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4M12 14v3',
  shield:'m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6zM8 12l3 3 5-6',
  menu:'M4 6h16M4 12h16M4 18h16', target:'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0M12 11v2',
  phone:'M4 3h4l2 5-3 2a15 15 0 0 0 7 7l2-3 5 2v4a2 2 0 0 1-2 2C9 22 2 15 2 5a2 2 0 0 1 2-2',
  sun:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',
  moon:'M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10',
  inbox:'M4 3h16l2 13v5H2v-5zM2 16h6l2 3h4l2-3h6',
  building:'M4 22V3h12v19M16 10h5v12M1 22h22M8 7h4M8 11h4M8 15h4M8 22v-3h4v3'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.info}"/></svg>`;
const initials = name => name.split(' ').filter(Boolean).slice(0,2).map(n => n[0]).join('');
const avatar = (name, i = 0) => `<span class="avatar ${['','blue-avatar','amber-avatar','purple-avatar'][i%4]}">${esc(initials(name))}</span>`;
const labels = {pendiente:'Pendiente',aprobado:'Aprobado',rechazado:'Rechazado',suspendido:'Suspendido',disponible:'Disponible',en_servicio:'En servicio',no_disponible:'No disponible',solicitud_pendiente:'Solicitud pendiente',activa:'En jornada',no_iniciada:'No iniciada',finalizada:'Finalizada',creada:'Creada',buscando:'Buscando conductor',conductor_seleccionado:'Conductor seleccionado',esperando_respuesta:'Esperando respuesta',aceptada:'Aceptada',sin_conductor:'Sin conductor'};
const statusColor = s => ({aprobado:'green',disponible:'green',activa:'green',aceptada:'green',en_servicio:'blue',pendiente:'amber',buscando:'amber',creada:'amber',esperando_respuesta:'amber',conductor_seleccionado:'amber',solicitud_pendiente:'amber',suspendido:'red',rechazado:'red',sin_conductor:'red'}[s] || 'gray');
const badge = s => `<span class="badge ${statusColor(s)}"><i class="dot"></i>${labels[s] || esc(s)}</span>`;

const names = ['Javier Méndez','Rodrigo Flores','Miguel Vargas','Óscar Ríos','Gabriel Torres','Pablo Serrano','Andrés Molina','René Castro','Fernando Ruiz','Hugo Salazar','Diego Rojas','Ernesto Vega','Carlos Arce','Luis Romero','Daniel Aguilar','Mario Mendoza','Víctor Campos','Roberto López','Alberto Suárez','Ricardo Paz','Sergio Roca','Julio Navarro','José Villanueva','Marcos Ávila','Eduardo Vargas','Rubén Ortiz','Pascual Medina'];
const coords = [[-.006,-.010],[.001,-.002],[-.009,.002],[.009,.002],[.006,-.006],[-.002,.008],[.012,-.005],[-.012,-.009],[.003,-.014],[-.007,.012],[.011,.010],[.003,.004],[-.002,-.009],[.007,.013],[-.013,.005],[.008,-.012],[-.006,-.003],[.014,.004],[.001,.012],[-.014,-.004],[.005,-.001],[-.004,-.014]];
const state = {
  session: true, route: 'inicio', driverTab: 'aprobado', driverSearch: '', driverPage: 1, mapFilter: 'todos', selectedMapDriver: null, requestFilter: 'todos', requestSearch: '',
  config: {nombre_empresa:'TaxiSur',radio_maximo_busqueda_km:5,telefono_centro_atencion:'+591 4 664 2020'},
  drivers:names.map((name,i) => ({id:i+1,name,phone:`+591 7${String(3100000+i*13257)}`,ci:`${5872000+i*139} TJ`,status:i<22?'aprobado':i<25?'pendiente':i===25?'suspendido':'rechazado',shift:i<20?'activa':'no_iniciada',availability:i<12?'disponible':i<18?'en_servicio':i<20?'disponible':'no_disponible',stale:i===18||i===19,minutes:i>=18&&i<20?7+i-18:i%3+1,unit:String(i+1).padStart(2,'0'),lat:-21.5335+(coords[i]?.[0]||0),lng:-64.7305+(coords[i]?.[1]||0),vehicle:{placa:`${4100+i*13}-${['TXA','RBP','KDN','YSA'][i%4]}`,marca:['Toyota','Suzuki','Nissan','Toyota'][i%4],modelo:['Corolla','Swift','Tiida','Vitz'][i%4],color:['Blanco','Plata','Blanco','Azul'][i%4],capacidad_pasajeros:4}})),
  requests:[
    {id:'0849',passenger:'Valeria Gutiérrez',driver:13,status:'en_servicio',time:'10:42'},
    {id:'0848',passenger:'Pedro Ramírez',driver:null,status:'buscando',time:'10:41'},
    {id:'0847',passenger:'Camila Fernández',driver:14,status:'en_servicio',time:'10:39'},
    {id:'0846',passenger:'Sofía Cabrera',driver:15,status:'en_servicio',time:'10:38'},
    {id:'0845',passenger:'María Beltrán',driver:16,status:'en_servicio',time:'10:37'},
    {id:'0844',passenger:'Bruno Núñez',driver:null,status:'buscando',time:'10:35'},
    {id:'0843',passenger:'Lucía Paredes',driver:17,status:'en_servicio',time:'10:34'},
    {id:'0842',passenger:'Arturo Rivero',driver:18,status:'en_servicio',time:'10:33'},
    {id:'0841',passenger:'Elena Valdez',driver:null,status:'creada',time:'10:32'}
  ],
  rates:[{id:1,descripcion:'Tarifa base diurna',monto:'10.00',vigencia_desde:'2026-09-01'},{id:2,descripcion:'Tarifa base nocturna',monto:'15.00',vigencia_desde:'2026-09-01'},{id:3,descripcion:'Servicio al aeropuerto',monto:'30.00',vigencia_desde:'2026-09-01'}],
  completed:28, refreshedAt: new Date(), refreshing:false
};
const today = '2026-09-10';
const pendingCount = () => state.drivers.filter(d=>d.status==='pendiente').length;
const getDriver = id => state.drivers.find(d=>d.id===Number(id));
const mapColor = d => d.stale?'amber':d.status!=='aprobado'||d.shift!=='activa'?'gray':d.availability==='en_servicio'?'blue':d.availability==='disponible'?'green':'gray';
let mapInstance = null;
let mapMarkers = {};
let toastTimer;
let renderTime = 0;

function shell(content) {
  const nav = [['inicio','home','Inicio'],['conductores','users','Conductores'],['mapa','map','Mapa'],['solicitudes','requests','Solicitudes'],['tarifas','wallet','Tarifas'],['configuracion','settings','Configuración']];
  const route = state.route.split('/')[0];
  const title = nav.find(n=>n[0]===route)?.[2]||'Inicio';
  return `<aside class="sidebar" id="sidebar" aria-label="Menú principal">
    <a href="#inicio" class="brand"><span class="brand-mark">${icon('car')}</span><span>Taxi<em>Sur</em></span></a>
    <div class="brand-note">Panel administrativo</div><div class="nav-section">Operación</div>
    <nav class="nav-list">${nav.map(([key,ic,label],i)=>`${i===4?'<div class="nav-separator"></div>':''}<a href="#${key}" class="nav-link ${route===key?'active':''}" ${route===key?'aria-current="page"':''}>${icon(ic)}<span>${label}</span>${key==='conductores'&&pendingCount()?`<span class="nav-count">${pendingCount()}</span>`:''}${key==='solicitudes'?`<span class="nav-count">${state.requests.length}</span>`:''}</a>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="demo-note"><strong>${icon('info')}Espacio de demostración</strong><p>Explora el panel con datos ficticios. Los cambios duran esta sesión.</p></div>
    <button class="nav-link logout" data-action="logout">${icon('logout')}<span>Cerrar sesión</span></button><div class="sidebar-foot">TaxiSur Admin <span style="float:right">MVP · 1.0</span></div></div>
  </aside><button class="mobile-scrim" data-action="close-menu" aria-label="Cerrar menú"></button>
  <div class="shell"><header class="topbar"><button class="icon-btn mobile-menu" data-action="menu" aria-label="Abrir menú" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button>
    <div class="breadcrumb"><span class="company-crumb">${esc(state.config.nombre_empresa)}</span>${icon('chevron','company-chevron')}<b>${title}</b>${state.route.includes('/')?`${icon('chevron')}<span>Detalle</span>`:''}</div>
    <div class="topbar-right"><span class="topbar-demo">Vista de demostración</span><div class="profile"><span class="avatar">AD</span><div class="profile-copy"><strong>Administrador</strong><span>${esc(state.config.nombre_empresa)}</span></div></div></div>
  </header><main class="main" id="main" tabindex="-1">${content}<footer class="page-foot"><span>© 2026 ${esc(state.config.nombre_empresa)} · Panel administrativo</span><span class="flex gap-8">${icon('shield')}Datos de ejemplo · Sin conexión a la operación</span></footer></main></div>`;
}
const pageHeading = (title,description,tools='') => `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div><div class="page-tools">${tools}</div></div>`;
const refreshButton = () => `<button class="btn ${state.refreshing?'refreshing':''}" data-action="refresh" ${state.refreshing?'disabled':''}>${icon('refresh')}<span class="btn-word">${state.refreshing?'Actualizando…':'Actualizar'}</span></button>`;
const readonly = () => `<span class="readonly-pill">${icon('eye')}Solo lectura</span>`;
function mapMarkup(full = false) {
  return `<div><div class="map-wrap"><div class="map-grid"></div><div id="map" class="map" aria-label="Mapa de conductores con ubicaciones ficticias en Tarija"></div><div class="map-location">${icon('pin')}Tarija, Bolivia <span class="muted">· Ejemplo</span></div></div><div class="map-legend"><span class="legend-item"><i class="dot green"></i>Disponible</span><span class="legend-item"><i class="dot blue"></i>En servicio</span><span class="legend-item"><i class="dot gray"></i>Fuera de servicio</span><span class="legend-item"><i class="dot amber"></i>Ubicación desactualizada</span></div></div>`;
}
function requestTable(requests) {
  if (!requests.length) return empty('Sin solicitudes para mostrar','Prueba con otro nombre o estado.','requests',true);
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th scope="col">Solicitud</th><th scope="col">Pasajero</th><th scope="col">Conductor asignado</th><th scope="col">Estado</th><th scope="col">Hora de creación</th></tr></thead><tbody>${requests.map(r=>`<tr><td><span class="request-id">#TS-${r.id}</span></td><td><span class="person-name">${esc(r.passenger)}</span></td><td>${r.driver?`<span>${esc(getDriver(r.driver).name)}</span>`:'<span class="muted" aria-label="Sin conductor asignado">—</span>'}</td><td>${badge(r.status)}</td><td class="mono muted">${r.time} <span class="small">h</span></td></tr>`).join('')}</tbody></table></div>`;
}
function homePage() {
  const available = state.drivers.filter(d=>mapColor(d)==='green').length;
  const service = state.drivers.filter(d=>d.availability==='en_servicio').length;
  const pending = state.drivers.filter(d=>d.status==='pendiente');
  return `<div class="page-heading"><div><div class="eyebrow">Centro de operaciones</div><h1>Resumen de la operación</h1><p>Todo lo que necesitas para supervisar tu flota, en un solo lugar.</p></div><div class="page-tools"><span class="date-label">${icon('calendar')}Jueves, 10 septiembre</span>${refreshButton()}</div></div>
    <section class="stats" aria-label="Indicadores del día">${[['Conductores disponibles',available,'car','Listos para recibir solicitudes','green'],['Conductores en servicio',service,'pin','Atendiendo un viaje','blue'],['Solicitudes activas',state.requests.length,'requests','En el flujo de atención','amber'],['Completadas hoy',state.completed,'checkCircle','Jueves, 10 de septiembre','gray']].map(([label,value,ic,foot,color])=>`<article class="stat"><div class="stat-top"><span class="stat-title">${label}</span><span class="stat-icon">${icon(ic)}</span></div><div class="stat-value">${value}</div><div class="stat-foot"><i class="dot ${color}"></i>${foot}</div></article>`).join('')}</section>
    <div class="home-middle"><section class="panel"><div class="panel-heading"><div><h2>Tu flota en el mapa</h2><p>Últimas ubicaciones de ${state.drivers.filter(d=>d.status==='aprobado').length} conductores aprobados</p></div><a class="btn btn-link" href="#mapa">Ver mapa completo ${icon('arrow')}</a></div>${mapMarkup()}</section>
    <section class="panel review-card"><div class="panel-heading"><div><div class="title-row"><h2>Por revisar</h2><span class="count-badge">${pending.length}</span></div><p>Registros de nuevos conductores</p></div></div><div class="review-list">${pending.length?pending.slice(0,3).map((d,i)=>`<a href="#conductores/${d.id}" class="review-person">${avatar(d.name,i+1)}<span class="grow"><strong class="person-name">${esc(d.name)}</strong><span class="person-meta">${esc(d.vehicle.marca)} ${esc(d.vehicle.modelo)} · ${esc(d.vehicle.placa)}</span></span>${icon('chevron','gray')}</a>`).join(''):empty('Todo al día','No hay registros pendientes.','checkCircle')}</div><button class="btn btn-primary" data-action="pending">Revisar pendientes ${icon('arrow')}</button><div class="review-hint">${icon('shield')}Revisa los datos antes de aprobar.</div></section></div>
    <div class="notice" style="margin-bottom:24px">${icon('alert')}<span><strong>2 ubicaciones desactualizadas.</strong> Estos conductores no reciben nuevas solicitudes.</span><a href="#mapa" data-map-filter="amber">Ver en el mapa ${icon('arrow')}</a></div>
    <section class="panel"><div class="panel-heading"><div class="title-row"><h2>Solicitudes activas</h2><span class="count-badge">${state.requests.length}</span></div><div class="flex gap-16">${readonly()}<a href="#solicitudes" class="btn btn-link">Ver todas ${icon('arrow')}</a></div></div>${requestTable(state.requests.slice(0,4))}<div class="table-footer"><span>Mostrando 4 de ${state.requests.length} solicitudes</span><span class="flex gap-8">${icon('refresh')}Vista de ejemplo · 10:43 h</span></div></section>`;
}
function empty(title,text,ic='search',clear=false) {
  return `<div class="empty">${icon(ic)}<h3>${title}</h3><p>${text}</p>${clear?'<button class="btn btn-sm" data-action="clear-filters">Limpiar filtros</button>':''}</div>`;
}
function driverActions(d) {
  if(d.status==='pendiente') return `<button class="btn btn-primary btn-sm" data-action="driver-action" data-id="${d.id}" data-next="aprobado">${icon('check')}Aprobar</button><button class="btn btn-sm btn-soft-danger" data-action="driver-action" data-id="${d.id}" data-next="rechazado">Rechazar</button>`;
  if(d.status==='aprobado') return `<button class="btn btn-sm" data-action="driver-action" data-id="${d.id}" data-next="suspendido">Suspender</button>`;
  if(d.status==='suspendido') return `<button class="btn btn-primary btn-sm" data-action="driver-action" data-id="${d.id}" data-next="aprobado">Reactivar</button>`;
  return '';
}
function filteredDrivers() {
  const query=state.driverSearch.trim().toLocaleLowerCase('es');
  return state.drivers.filter(d=>d.status===state.driverTab && `${d.name} ${d.phone} ${d.vehicle.placa}`.toLocaleLowerCase('es').includes(query));
}
function driversTable() {
  const rows=filteredDrivers();
  const pages=Math.max(1,Math.ceil(rows.length/7));
  state.driverPage=Math.min(state.driverPage,pages);
  const slice=rows.slice((state.driverPage-1)*7,state.driverPage*7);
  return `${rows.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Conductor</th><th>Teléfono</th><th>Estado</th><th>Jornada</th><th>Disponibilidad</th><th>Acciones</th></tr></thead><tbody>${slice.map(d=>`<tr data-driver-row="${d.id}"><td><a href="#conductores/${d.id}" class="row-link">${avatar(d.name,d.id)}<span><strong class="person-name">${esc(d.name)}</strong><span class="person-meta">${esc(d.vehicle.placa)} · Unidad ${d.unit}</span></span></a></td><td class="muted mono">${d.phone}</td><td>${badge(d.status)}</td><td><span class="availability ${d.shift==='activa'?'green':'muted'}">${d.shift==='activa'?'<i class="dot"></i>':''}${labels[d.shift]}</span></td><td><span class="availability ${statusColor(d.availability)}">${labels[d.availability]}</span>${d.stale?'<span class="person-meta amber">Ubicación desactualizada</span>':''}</td><td><div class="table-actions">${driverActions(d)}<a href="#conductores/${d.id}" class="icon-btn" aria-label="Ver detalle de ${esc(d.name)}">${icon('chevron')}</a></div></td></tr>`).join('')}</tbody></table></div>`:empty('No hay conductores en esta vista',state.driverSearch?'No encontramos coincidencias. Prueba con otro nombre, teléfono o placa.':'Los conductores con este estado aparecerán aquí.','users',!!state.driverSearch)}<div class="table-footer"><span>${rows.length?`Mostrando ${(state.driverPage-1)*7+1}–${Math.min(state.driverPage*7,rows.length)} de ${rows.length} conductores`:'0 conductores'}</span><div class="pagination"><button class="icon-btn" data-action="driver-page" data-page="${state.driverPage-1}" ${state.driverPage===1?'disabled':''} aria-label="Página anterior">${icon('back')}</button><span class="page-number">${state.driverPage}</span><span>de ${pages}</span><button class="icon-btn" data-action="driver-page" data-page="${state.driverPage+1}" ${state.driverPage===pages?'disabled':''} aria-label="Página siguiente">${icon('arrow')}</button></div></div>`;
}
function driversPage() {
  return `${pageHeading('Conductores','Revisa registros y administra las cuentas de tu flota.',refreshButton())}<section class="panel"><div class="tab-bar" role="tablist" aria-label="Estado de conductor">${[['pendiente','Pendientes'],['aprobado','Aprobados'],['rechazado','Rechazados'],['suspendido','Suspendidos']].map(([key,label])=>`<button role="tab" aria-selected="${state.driverTab===key}" aria-controls="driver-results" class="tab ${state.driverTab===key?'active':''}" data-action="driver-tab" data-tab="${key}">${label}<span class="tab-count">${state.drivers.filter(d=>d.status===key).length}</span></button>`).join('')}</div><div class="filter-row"><label class="search">${icon('search')}<input type="search" id="driver-search" value="${esc(state.driverSearch)}" placeholder="Buscar por nombre, teléfono o placa" aria-label="Buscar conductores"></label><span>Datos administrados por la empresa</span></div><div id="driver-results" role="tabpanel" aria-label="Lista de conductores">${driversTable()}</div></section><div class="notice notice-blue" style="margin-top:20px">${icon('info')}<span>La jornada y disponibilidad se gestionan desde la app del conductor. Aquí puedes revisar su cuenta y actualizar el vehículo.</span></div>`;
}
function detailPage(id) {
  const d=getDriver(id);
  if(!d)return `<a class="back-link" href="#conductores">${icon('back')}Volver a conductores</a>${empty('Conductor no encontrado','Vuelve al listado para seleccionar un conductor.','users')}`;
  const v=d.vehicle;
  return `<a class="back-link" href="#conductores">${icon('back')}Volver a conductores</a><div class="page-heading detail-page-heading"><div class="detail-heading">${avatar(d.name,d.id)}<div><h1>${esc(d.name)}</h1><p>Unidad ${d.unit} · Registrado el 8 sep. 2026</p></div></div>${badge(d.status)}</div><div class="detail-grid"><div class="stack"><section class="panel"><div class="panel-heading"><h2>Datos personales</h2>${readonly()}</div><div class="info-grid"><div class="info-item"><label>Nombre completo</label><p>${esc(d.name)}</p></div><div class="info-item"><label>Cédula de identidad</label><p>${esc(d.ci)}</p></div><div class="info-item"><label>Teléfono</label><p>${esc(d.phone)}</p></div><div class="info-item"><label>Estado de la cuenta</label>${badge(d.status)}</div></div><div class="card-note">${icon('lock')}Las correcciones de datos personales se atienden a través de soporte.</div></section><section class="panel"><div class="panel-heading"><h2>Vehículo asignado</h2><button class="btn btn-sm" data-action="edit-vehicle" data-id="${d.id}">${icon('edit')}Editar vehículo</button></div><div class="vehicle-visual"><div class="vehicle-icon">${icon('car')}</div><div><h3>${esc(v.marca)} ${esc(v.modelo)}</h3><span class="plate">${esc(v.placa)}</span></div></div><div class="info-grid"><div class="info-item"><label>Marca</label><p>${esc(v.marca)}</p></div><div class="info-item"><label>Modelo</label><p>${esc(v.modelo)}</p></div><div class="info-item"><label>Color</label><p>${esc(v.color)}</p></div><div class="info-item"><label>Capacidad</label><p>${v.capacidad_pasajeros} pasajeros</p></div></div><div class="card-note">${icon('info')}Estos datos se muestran al pasajero al seleccionar un conductor.</div></section></div><div class="stack"><section class="panel"><div class="panel-heading"><h2>Estado operativo</h2>${readonly()}</div><div class="operational-list"><div class="operational-item"><span>Jornada</span>${badge(d.shift)}</div><div class="operational-item"><span>Disponibilidad</span>${badge(d.availability)}</div><div class="operational-item"><span>Última ubicación</span><span class="${d.stale?'amber':'muted'} small">${d.status==='aprobado'?`Hace ${d.minutes} min`:'Sin reportes'}</span></div></div>${d.stale?'<div class="notice" style="margin:6px 20px 20px">'+icon('alert')+'Más de 5 minutos sin actualizar. No elegible para nuevas solicitudes.</div>':''}</section><section class="panel"><div class="panel-heading"><div><h2>Gestión de la cuenta</h2><p>${d.status==='pendiente'?'Revisa los datos del conductor y su vehículo.':d.status==='suspendido'?'La cuenta conserva sus datos.':d.status==='rechazado'?'Este registro no fue aprobado.':'La suspensión impide recibir nuevas solicitudes.'}</p></div></div>${driverActions(d)?`<div class="detail-actions">${driverActions(d)}</div>`:''}</section></div></div>`;
}
function mapPage() {
  const drivers=state.drivers.filter(d=>d.status==='aprobado'&&(state.mapFilter==='todos'||mapColor(d)===state.mapFilter));
  return `${pageHeading('Mapa de conductores','Consulta la última ubicación reportada por cada conductor.',refreshButton())}<div class="map-filters" aria-label="Filtrar conductores del mapa">${[['todos','Todos'],['green','Disponibles'],['blue','En servicio'],['gray','Fuera de servicio'],['amber','Desactualizados']].map(([key,label])=>`<button class="filter-chip ${state.mapFilter===key?'active':''}" aria-pressed="${state.mapFilter===key}" data-action="map-filter" data-filter="${key}">${key!=='todos'?`<i class="dot ${key}"></i>`:''}${label}<span class="small">${state.drivers.filter(d=>d.status==='aprobado'&&(key==='todos'||mapColor(d)===key)).length}</span></button>`).join('')}</div><section class="panel map-page">${mapMarkup(true)}<aside class="map-directory"><div class="map-directory-head"><h3>${drivers.length} conductores en el mapa</h3><p class="small muted" style="margin-top:5px">Selecciona una unidad para localizarla</p></div><div class="map-drivers">${drivers.length?drivers.map(d=>`<button class="map-person ${state.selectedMapDriver===d.id?'selected':''}" data-action="locate-driver" data-id="${d.id}">${avatar(d.name,d.id)}<span><strong class="person-name">${esc(d.name)}</strong><span class="person-meta">Unidad ${d.unit} · ${esc(d.vehicle.placa)}</span><span class="person-meta ${d.stale?'amber':''}">${d.stale?'Ubicación desactualizada':labels[d.availability]} · hace ${d.minutes} min</span></span><i class="dot ${mapColor(d)}"></i></button>`).join(''):empty('Sin conductores','No hay ubicaciones para este estado.','map')}</div><div class="card-note">${icon('eye')}Ubicaciones de ejemplo. Solo visualización.</div></aside></section><div class="notice" style="margin-top:20px">${icon('alert')}<span>Una ubicación con más de <strong>5 minutos</strong> de antigüedad se muestra en amarillo y deja de ser elegible para recibir nuevas solicitudes.</span></div>`;
}
function requestsPage() {
  const result=state.requests.filter(r=>(state.requestFilter==='todos'||r.status===state.requestFilter)&&`${r.id} ${r.passenger} ${r.driver?getDriver(r.driver).name:''}`.toLocaleLowerCase('es').includes(state.requestSearch.toLocaleLowerCase('es')));
  return `${pageHeading('Solicitudes activas','Supervisa la atención de pasajeros y el estado de cada solicitud.',refreshButton())}<div class="notice notice-blue" style="margin-bottom:22px">${icon('eye')}<span><strong>Vista de supervisión.</strong> La asignación y los cambios de estado los controla el sistema automáticamente.</span></div><section class="panel"><div class="filter-row"><label class="search">${icon('search')}<input id="request-search" type="search" placeholder="Buscar solicitud, pasajero o conductor" value="${esc(state.requestSearch)}" aria-label="Buscar solicitudes"></label><label class="field" style="margin:0"><select id="request-filter" aria-label="Filtrar solicitudes por estado">${[['todos','Todos los estados'],['creada','Creada'],['buscando','Buscando conductor'],['esperando_respuesta','Esperando respuesta'],['aceptada','Aceptada'],['en_servicio','En servicio'],['sin_conductor','Sin conductor']].map(([key,label])=>`<option value="${key}" ${key===state.requestFilter?'selected':''}>${label}</option>`).join('')}</select></label></div><div id="request-results">${requestTable(result)}<div class="table-footer"><span>${result.length} solicitudes activas</span><span class="flex gap-8">${icon('clock')}Datos de ejemplo · Sin actualización en vivo</span></div></div></section>`;
}
const dateLabel = date => new Date(date+'T12:00:00').toLocaleDateString('es-BO',{day:'2-digit',month:'short',year:'numeric'});
const money = amount => Number(amount).toLocaleString('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2});
function ratesPage() {
  return `${pageHeading('Tarifas','Administra los valores oficiales que se informan a los pasajeros.',`<button class="btn btn-primary" data-action="new-rate">${icon('plus')}Nueva tarifa</button>`)}<section class="panel"><div class="panel-heading"><div><h2>Tarifario de la empresa</h2><p>${state.rates.filter(r=>r.vigencia_desde<=today).length} tarifas vigentes · Montos en bolivianos (Bs)</p></div><span class="readonly-pill">Valores fijos</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Descripción</th><th>Monto</th><th>Vigencia desde</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${state.rates.map((r,i)=>`<tr><td><div class="flex gap-12"><span class="rate-symbol">${icon(i===0?'sun':i===1?'moon':'wallet')}</span><span class="person-name">${esc(r.descripcion)}</span></div></td><td><span class="rate-amount">${money(r.monto)} <small>Bs</small></span></td><td class="muted">${dateLabel(r.vigencia_desde)}</td><td><span class="badge ${r.vigencia_desde<=today?'green':'amber'}"><i class="dot"></i>${r.vigencia_desde<=today?'Vigente':'Programada'}</span></td><td><button class="btn btn-sm" data-action="edit-rate" data-id="${r.id}">${icon('edit')}Editar</button></td></tr>`).join('')}</tbody></table></div><div class="table-footer"><span>${state.rates.length} tarifas registradas</span><span>Tarifario de demostración</span></div></section><div class="notice notice-blue" style="margin-top:22px">${icon('info')}<span>El asistente consulta este tarifario para responder a los pasajeros. Las tarifas son fijas; no se calculan automáticamente por kilómetro.</span></div>`;
}
function configPage() {
  const c=state.config;
  return `${pageHeading('Configuración','Define la información de la empresa y los parámetros de búsqueda.')}<div class="config-grid"><form class="panel" id="config-form"><div class="form-section"><h3>Información de la empresa</h3><p>Datos de contacto que utiliza el centro de atención.</p><label class="field"><span>Nombre de la empresa</span><input name="nombre_empresa" value="${esc(c.nombre_empresa)}" required minlength="2" maxlength="70" autocomplete="organization"><small>Se muestra en el encabezado del panel.</small></label><label class="field"><span>Teléfono del centro de atención <span class="muted">· Opcional</span></span><input name="telefono_centro_atencion" type="tel" value="${esc(c.telefono_centro_atencion)}" maxlength="24" autocomplete="tel" placeholder="+591 4 664 2020"><small>Contacto que se ofrece cuando no hay conductores disponibles.</small></label></div><div class="form-section"><h3>Búsqueda de conductores</h3><p>Alcance de búsqueda desde el punto de recogida del pasajero.</p><label class="field"><span>Radio máximo de búsqueda</span><div class="input-unit" style="max-width:230px"><input type="number" name="radio_maximo_busqueda_km" value="${c.radio_maximo_busqueda_km}" required min="1" step="1" inputmode="numeric"><span>km</span></div><small>Introduce un número entero mayor que cero. Valor inicial: 5 km.</small></label></div><div class="form-footer"><button type="button" class="btn" data-action="reset-config">Restablecer</button><button class="btn btn-primary" type="submit">${icon('check')}Guardar cambios</button></div></form><aside class="panel config-aside">${icon('target')}<h3>Un alcance adecuado</h3><p>El sistema busca conductores elegibles dentro del radio configurado y presenta al pasajero los tres más cercanos.</p><div class="radio-meter"><span></span></div><div class="flex between small"><span class="muted">Radio actual</span><strong style="margin:0">${c.radio_maximo_busqueda_km} km</strong></div><hr><strong>Si no hay disponibilidad</strong><p>El pasajero recibe el teléfono del centro de atención para obtener ayuda.</p><hr><div class="flex gap-8 small muted">${icon('shield')}Cambios en esta demostración</div><p style="margin-top:9px">Puedes probar la configuración. No afecta una operación real y se restablece al recargar.</p></aside></div>`;
}
function loginPage() {
  return `<div class="login"><section class="login-brand"><a href="#login" class="brand"><span class="brand-mark">${icon('car')}</span><span>Taxi<em>Sur</em></span></a><div class="login-brand-body"><div class="eyebrow" style="color:#899bb3;margin-bottom:22px">Centro de operaciones</div><h1>Tu flota conectada.<br><span>Tu operación, clara.</span></h1><p>Supervisa los servicios y acompaña a tu equipo desde un solo lugar.</p><div class="login-feature">${icon('shield')}Acceso para la administración de TaxiSur</div></div><div class="login-brand-foot">TaxiSur Admin · Panel administrativo</div><div class="login-grid"></div></section><section class="login-form-side"><div class="login-content"><div class="eyebrow">Bienvenido a TaxiSur</div><h2>Ingresa a tu panel</h2><p>Usa tu correo y contraseña de administrador.</p><form id="login-form"><div id="login-error" role="alert"></div><label class="field"><span>Correo electrónico</span><input type="email" name="correo" value="admin@taxisur.demo" required autocomplete="username" placeholder="admin@empresa.com"></label><label class="field"><span>Contraseña</span><div class="password-wrap"><input type="password" name="contrasena" value="TaxiSur2026!" required autocomplete="current-password"><button type="button" class="icon-btn" data-action="toggle-password" aria-label="Mostrar contraseña">${icon('eye')}</button></div></label><button type="submit" class="btn btn-primary">Ingresar ${icon('arrow')}</button></form><div class="login-help"><strong>Credenciales de demostración</strong>Correo: admin@taxisur.demo<br>Contraseña: TaxiSur2026!<br>Utiliza estos datos ficticios para explorar el panel.</div><div class="login-note">${icon('lock')}Prototipo visual · Sin autenticación real</div></div></section></div>`;
}

function destroyMap() { if(mapInstance){mapInstance.remove();mapInstance=null;} mapMarkers={}; }
function render() {
  destroyMap();
  state.route=location.hash.replace(/^#/,'')||'inicio';
  if(!state.session && state.route!=='login'){location.replace('#login');return;}
  if(state.route==='login'){$('#app').innerHTML=loginPage();document.title='Ingresar · TaxiSur';return;}
  let content;
  if(state.route.startsWith('conductores/'))content=detailPage(state.route.split('/')[1]);
  else content=({inicio:homePage,conductores:driversPage,mapa:mapPage,solicitudes:requestsPage,tarifas:ratesPage,configuracion:configPage}[state.route]||homePage)();
  $('#app').innerHTML=shell(content);
  document.title=`${({inicio:'Inicio',conductores:'Conductores',mapa:'Mapa',solicitudes:'Solicitudes',tarifas:'Tarifas',configuracion:'Configuración'}[state.route.split('/')[0]]||'Inicio')} · TaxiSur`;
  renderTime++;
  if($('#map'))initMap();
}
function initMap() {
  if(!window.L){$('#map').innerHTML=`<div class="map-empty">${icon('map')}<strong>El mapa no está disponible</strong><p class="small">Puedes consultar los conductores en el listado.</p><a class="btn btn-sm" href="#conductores">Ver conductores</a></div>`;return;}
  const routeVersion=renderTime;
  const full=state.route==='mapa';
  mapInstance=L.map('map',{zoomControl:false,scrollWheelZoom:full,attributionControl:true}).setView([-21.5335,-64.7305],full?14:13);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(mapInstance);
  L.control.zoom({position:'bottomright'}).addTo(mapInstance);
  let loaded=0,failed=0;
  tiles.on('tileload',()=>{loaded++;});
  tiles.on('tileerror',()=>{failed++;if(failed>3&&!loaded&&routeVersion===renderTime&&!$('.map-network-note')){const note=document.createElement('div');note.className='map-network-note';note.style.cssText='position:absolute;bottom:35px;left:15px;right:55px;z-index:450;background:#fff;padding:10px 13px;border-radius:7px;font-size:12px;color:#7a8795;box-shadow:0 2px 8px #0001';note.textContent='No se pudo cargar el mapa base. Las unidades conservan sus coordenadas de ejemplo.';$('.map-wrap').append(note);}});
  const rows=state.drivers.filter(d=>d.status==='aprobado'&&(!full||state.mapFilter==='todos'||mapColor(d)===state.mapFilter));
  rows.forEach(d=>{
    const marker=L.marker([d.lat,d.lng],{draggable:false,keyboard:true,title:`Unidad ${d.unit}: ${d.name}, ${d.stale?'ubicación desactualizada':labels[d.availability]}`,icon:L.divIcon({className:'custom-unit-icon',html:`<span class="unit-marker ${mapColor(d)}">${icon('car')}${d.unit}</span>`,iconSize:[50,30],iconAnchor:[25,35]})}).addTo(mapInstance);
    marker.bindPopup(`<strong>${esc(d.name)}</strong>${badge(d.availability)}<p>Unidad ${d.unit} · ${esc(d.vehicle.placa)}<br>${esc(d.vehicle.marca)} ${esc(d.vehicle.modelo)} · ${esc(d.vehicle.color)}<br><span class="${d.stale?'amber':'muted'}">Ubicación de hace ${d.minutes} min${d.stale?' · Desactualizada':''}</span></p><a href="#conductores/${d.id}" class="btn btn-sm">Ver conductor ${icon('arrow')}</a>`);
    marker.on('click',()=>{state.selectedMapDriver=d.id;highlightMapPerson(d.id);});mapMarkers[d.id]=marker;
  });
  if(full&&state.mapFilter!=='todos'&&rows.length)mapInstance.fitBounds(rows.map(d=>[d.lat,d.lng]),{padding:[75,75],maxZoom:14});
}
function highlightMapPerson(id){$$('.map-person').forEach(el=>el.classList.toggle('selected',Number(el.dataset.id)===id));}
function toast(message){clearTimeout(toastTimer);$('#toast').innerHTML=icon('checkCircle')+`<span>${esc(message)}</span>`;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000);}
function openDialog(content){const d=$('#dialog');d.innerHTML=content;d.showModal();}
function closeDialog(){$('#dialog').close();}
const dialogHead=(title,description='')=>`<div class="dialog-head"><div><h2 id="dialog-title">${title}</h2>${description?`<p>${description}</p>`:''}</div><button class="icon-btn" data-action="close-dialog" aria-label="Cerrar diálogo">${icon('close')}</button></div>`;

function confirmDriver(id,next){
  const d=getDriver(id);if(!d)return;
  const reactivate=d.status==='suspendido';
  const verb=next==='aprobado'?(reactivate?'Reactivar':'Aprobar'):next==='rechazado'?'Rechazar':'Suspender';
  const text=next==='aprobado'?'Podrá iniciar jornada y recibir solicitudes cuando esté disponible y tenga una ubicación válida.':next==='rechazado'?'El registro quedará rechazado y el conductor no podrá operar.':'No podrá iniciar jornada ni recibir nuevas solicitudes. Su cuenta y los datos del vehículo se conservarán.';
  openDialog(`${dialogHead(`${verb} conductor`)}<div class="dialog-body"><div class="confirm-icon ${next==='aprobado'?'green':''}">${icon(next==='aprobado'?'checkCircle':'shield')}</div><p class="confirm-copy">${verb} la cuenta de <strong>${esc(d.name)}</strong>.<br><br>${text}</p><div class="notice notice-blue" style="margin-top:18px;font-size:12px">${icon('info')}Esta acción solo modifica los datos de la demostración.</div></div><div class="dialog-foot"><button class="btn" data-action="close-dialog">Cancelar</button><button class="btn ${next==='aprobado'?'btn-primary':'btn-danger'}" data-action="confirm-driver" data-id="${id}" data-next="${next}" data-from="${d.status}">${verb} conductor</button></div>`);
}
function vehicleDialog(id){
  const d=getDriver(id);if(!d)return;const v=d.vehicle;
  openDialog(`${dialogHead('Editar vehículo',d.name+' · Unidad '+d.unit)}<form id="vehicle-form" data-id="${id}"><div class="dialog-body"><div id="vehicle-error" role="alert"></div><label class="field"><span>Placa</span><input name="placa" required maxlength="16" value="${esc(v.placa)}" style="text-transform:uppercase"></label><div class="form-grid"><label class="field"><span>Marca</span><input name="marca" required maxlength="40" value="${esc(v.marca)}"></label><label class="field"><span>Modelo</span><input name="modelo" required maxlength="50" value="${esc(v.modelo)}"></label></div><label class="field"><span>Color</span><input name="color" required maxlength="40" value="${esc(v.color)}"></label><div class="notice notice-blue">${icon('info')}Capacidad registrada: ${v.capacidad_pasajeros} pasajeros. Este formulario actualiza placa, marca, modelo y color.</div></div><div class="dialog-foot"><button type="button" class="btn" data-action="close-dialog">Cancelar</button><button type="submit" class="btn btn-primary">Guardar vehículo</button></div></form>`);
}
function rateDialog(id){
  const r=state.rates.find(r=>r.id===Number(id));
  openDialog(`${dialogHead(r?'Editar tarifa':'Nueva tarifa','Define un valor fijo del tarifario oficial.')}<form id="rate-form" data-id="${r?.id||''}"><div class="dialog-body"><div id="rate-error" role="alert"></div><label class="field"><span>Descripción</span><input name="descripcion" required maxlength="100" value="${esc(r?.descripcion||'')}" placeholder="Ej. Tarifa base diurna"></label><div class="form-grid"><label class="field"><span>Monto en bolivianos</span><div class="input-unit"><input type="number" name="monto" min="0.01" max="99999999.99" step="0.01" required inputmode="decimal" value="${r?.monto||''}" placeholder="0.00"><span>Bs</span></div></label><label class="field"><span>Vigencia desde</span><input type="date" name="vigencia_desde" required value="${r?.vigencia_desde||today}"></label></div><div class="notice notice-blue" style="margin-top:20px">${icon('info')}Los montos de esta demostración son ficticios.</div></div><div class="dialog-foot"><button type="button" class="btn" data-action="close-dialog">Cancelar</button><button class="btn btn-primary" type="submit">${r?'Guardar cambios':'Agregar tarifa'}</button></div></form>`);
}
document.addEventListener('click',event=>{
  const mapLink=event.target.closest('[data-map-filter]');if(mapLink)state.mapFilter=mapLink.dataset.mapFilter;
  const row=event.target.closest('[data-driver-row]');if(row&&!event.target.closest('a,button'))location.hash='conductores/'+row.dataset.driverRow;
  const el=event.target.closest('[data-action]');if(!el)return;
  const a=el.dataset.action;
  if(a==='menu'){$('#sidebar').classList.add('open');el.setAttribute('aria-expanded','true');}
  if(a==='close-menu'){$('#sidebar').classList.remove('open');$('[data-action="menu"]').setAttribute('aria-expanded','false');}
  if(a==='logout'){state.session=false;location.hash='login';}
  if(a==='pending'){state.driverTab='pendiente';state.driverSearch='';state.driverPage=1;location.hash='conductores';}
  if(a==='driver-tab'){state.driverTab=el.dataset.tab;state.driverSearch='';state.driverPage=1;render();$(`[data-tab="${state.driverTab}"]`).focus();}
  if(a==='driver-page'){state.driverPage=Number(el.dataset.page);$('#driver-results').innerHTML=driversTable();}
  if(a==='map-filter'){state.mapFilter=el.dataset.filter;render();}
  if(a==='locate-driver'){const id=Number(el.dataset.id);state.selectedMapDriver=id;highlightMapPerson(id);if(mapInstance&&mapMarkers[id]){mapInstance.setView(mapMarkers[id].getLatLng(),15,{animate:!matchMedia('(prefers-reduced-motion: reduce)').matches});mapMarkers[id].openPopup();}}
  if(a==='driver-action')confirmDriver(el.dataset.id,el.dataset.next);
  if(a==='confirm-driver'){
    const d=getDriver(el.dataset.id),next=el.dataset.next;
    if(!d||d.status!==el.dataset.from){closeDialog();toast('La cuenta cambió. Revisa su estado e inténtalo de nuevo.');return;}
    d.status=next;if(next==='suspendido'||next==='rechazado'){if(d.availability!=='en_servicio'){d.availability='no_disponible';d.shift='no_iniciada';}}
    closeDialog();render();toast(`Cuenta de ${d.name}: ${labels[next].toLowerCase()}. Cambio de demostración.`);
  }
  if(a==='edit-vehicle')vehicleDialog(el.dataset.id);
  if(a==='new-rate')rateDialog();
  if(a==='edit-rate')rateDialog(el.dataset.id);
  if(a==='close-dialog')closeDialog();
  if(a==='reset-config'){render();toast('Se restauraron los últimos valores guardados.');}
  if(a==='toggle-password'){const input=$('input[name="contrasena"]');input.type=input.type==='password'?'text':'password';el.setAttribute('aria-label',input.type==='password'?'Mostrar contraseña':'Ocultar contraseña');el.setAttribute('aria-pressed',input.type==='text');}
  if(a==='clear-filters'){state.driverSearch='';state.requestSearch='';state.requestFilter='todos';render();}
  if(a==='refresh'&&!state.refreshing){state.refreshing=true;el.disabled=true;el.classList.add('refreshing');setTimeout(()=>{state.refreshing=false;state.refreshedAt=new Date();if(state.session){render();toast('Vista actualizada. Estás viendo datos de demostración.');}},650);}
});
document.addEventListener('input',event=>{
  if(event.target.id==='driver-search'){state.driverSearch=event.target.value;state.driverPage=1;$('#driver-results').innerHTML=driversTable();}
  if(event.target.id==='request-search'){state.requestSearch=event.target.value;updateRequests();}
});
function updateRequests(){const temp=document.createElement('div');temp.innerHTML=requestsPage();$('#request-results').innerHTML=$('#request-results',temp).innerHTML;}
document.addEventListener('change',event=>{if(event.target.id==='request-filter'){state.requestFilter=event.target.value;updateRequests();}});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&$('#sidebar')?.classList.contains('open')){$('#sidebar').classList.remove('open');$('[data-action="menu"]').setAttribute('aria-expanded','false');$('[data-action="menu"]').focus();}
  const tab=event.target.closest('[role="tab"]');if(tab&&['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){event.preventDefault();const tabs=$$('[role="tab"]');const i=tabs.indexOf(tab);const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;tabs[next].click();}
});
document.addEventListener('submit',event=>{
  const form=event.target;if(!['login-form','vehicle-form','rate-form','config-form'].includes(form.id))return;event.preventDefault();
  const data=Object.fromEntries(new FormData(form));
  if(form.id==='login-form'){
    if(data.correo.trim().toLowerCase()==='admin@taxisur.demo'&&data.contrasena==='TaxiSur2026!'){state.session=true;location.hash='inicio';toast('Bienvenido al panel de demostración.');}
    else{$('#login-error').innerHTML='<div class="form-error">Correo o contraseña incorrectos. Usa las credenciales de demostración que aparecen debajo.</div>';$('input[name="contrasena"]',form).setAttribute('aria-invalid','true');}
  }
  if(form.id==='vehicle-form'){
    const d=getDriver(form.dataset.id);const values=Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.trim()]));
    if(Object.values(values).some(v=>!v)){$('#vehicle-error').innerHTML='<div class="form-error">Completa todos los datos del vehículo.</div>';return;}
    values.placa=values.placa.toUpperCase();if(state.drivers.some(other=>other.id!==d.id&&other.vehicle.placa.toUpperCase()===values.placa)){$('#vehicle-error').innerHTML='<div class="form-error">Esta placa ya está registrada en otro vehículo.</div>';return;}
    Object.assign(d.vehicle,values);closeDialog();render();toast('Datos del vehículo guardados en la demostración.');
  }
  if(form.id==='rate-form'){
    const amount=Number(data.monto);if(!data.descripcion.trim()||!Number.isFinite(amount)||amount<=0||!data.vigencia_desde){$('#rate-error').innerHTML='<div class="form-error">Completa la descripción, una fecha válida y un monto mayor que cero.</div>';return;}
    const record={descripcion:data.descripcion.trim(),monto:amount.toFixed(2),vigencia_desde:data.vigencia_desde};const old=state.rates.find(r=>r.id===Number(form.dataset.id));if(old)Object.assign(old,record);else state.rates.push({id:Math.max(0,...state.rates.map(r=>r.id))+1,...record});closeDialog();render();toast(old?'Tarifa actualizada en la demostración.':'Nueva tarifa agregada a la demostración.');
  }
  if(form.id==='config-form'){
    if(!data.nombre_empresa.trim()||!Number.isInteger(Number(data.radio_maximo_busqueda_km))||Number(data.radio_maximo_busqueda_km)<1){toast('Revisa el nombre y el radio de búsqueda.');return;}
    state.config={nombre_empresa:data.nombre_empresa.trim(),telefono_centro_atencion:data.telefono_centro_atencion.trim(),radio_maximo_busqueda_km:Number(data.radio_maximo_busqueda_km)};render();toast('Configuración guardada en la demostración.');
  }
});
$('#dialog').addEventListener('click',event=>{if(event.target===$('#dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeDialog();}});
window.addEventListener('hashchange',()=>{if($('#dialog').open)closeDialog();render();window.scrollTo(0,0);$('#main')?.focus({preventScroll:true});});
// Optional progressive enhancement. Unsupported browsers keep the same UI.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tools=[{
    name:'read_demo_operation',title:'Consultar operación de demostración',
    description:'Devuelve los cuatro indicadores del panel. Todos los valores son ficticios.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute(input){if(!state.session)throw new Error('Inicia la sesión de demostración.');if(input&&Object.keys(input).length)throw new Error('Esta consulta no recibe parámetros.');return {demo:true,disponibles:state.drivers.filter(d=>mapColor(d)==='green').length,en_servicio:state.drivers.filter(d=>d.availability==='en_servicio').length,solicitudes_activas:state.requests.length,completadas_hoy:state.completed};}
  },{
    name:'filter_demo_drivers',title:'Filtrar conductores de demostración',
    description:'Abre el listado de conductores y aplica los mismos filtros visibles de estado y búsqueda. No modifica cuentas.',
    inputSchema:{type:'object',properties:{estado:{type:'string',enum:['pendiente','aprobado','rechazado','suspendido']},busqueda:{type:'string',maxLength:100}},required:['estado'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){if(!state.session)throw new Error('Inicia la sesión de demostración.');if(!input||!['pendiente','aprobado','rechazado','suspendido'].includes(input.estado)||Object.keys(input).some(k=>!['estado','busqueda'].includes(k))||(input.busqueda!==undefined&&(typeof input.busqueda!=='string'||input.busqueda.length>100)))throw new Error('Filtro no válido.');state.driverTab=input.estado;state.driverSearch=input.busqueda||'';state.driverPage=1;history.replaceState(null,'','#conductores');render();return {demo:true,estado:state.driverTab,resultados:filteredDrivers().map(d=>({id:d.id,nombre:d.name,estado:d.status}))};}
  }];
  for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
render();
