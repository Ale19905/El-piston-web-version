/**
 * El Pistón — frontend sin frameworks. PocketBase se consume únicamente por el SDK.
 * Los nombres de campo coinciden con 20261107000000_crear_modelo.js.
 * IMPORTANTE: algunas validaciones de negocio son solo de interfaz; ver docs/limitaciones.md.
 */
const API_URL = 'http://127.0.0.1:8090';
const app = document.querySelector('#app');
const dialog = document.querySelector('#modal');
const toast = document.querySelector('#toast');
let pb;
let onSubmitModal = null;
let toastTimer;

const STATE_LABELS = {
  recibida: 'Recibida', diagnostico: 'En diagnóstico', reparacion: 'En reparación',
  lista: 'Lista para entregar', entregada: 'Entregada', cancelada: 'Cancelada',
};
const STATE_COLORS = {
  recibida: 'blue', diagnostico: 'amber', reparacion: 'blue',
  lista: 'green', entregada: 'green', cancelada: 'red',
};
const ACTIVE_STATES = ['recibida', 'diagnostico', 'reparacion', 'lista'];
const NEXT_STATE = { recibida: 'diagnostico', diagnostico: 'reparacion', reparacion: 'lista', lista: 'entregada' };
const ROLE_LABELS = { dueno: 'Dueño', recepcionista: 'Recepcionista', mecanico: 'Mecánico' };
const state = {
  page: 'dashboard', selectedOrder: null, selectedClient: null, selectedVehicle: null,
  statusFilter: 'todas', reportFrom: `${new Date().getFullYear()}-01-01`,
  reportTo: localDateInput(), data: {}, working: false,
};

// --- Utilidades visuales ---
const icons = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  car: '<path d="M5 17h14l2-5-2-6H5l-2 6 2 5Z"/><path d="M5 17v3M19 17v3M3 12h18M7 9h.01M17 9h.01"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.7-3.7a6 6 0 0 1-7.6 7.6l-6.9 6.9a2 2 0 1 1-2.8-2.8l6.9-6.9a6 6 0 0 1 7.6-7.6z"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.7L13 2.3a2 2 0 0 0-2 0L4 6.3A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  card: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>',
  chart: '<path d="M3 3v18h18M8 16v-4M13 16V8M18 16V5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 7l2 5M4 12l2 5a7 7 0 0 0 12.4-2"/>',
  search: '<circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/>',
  arrow: '<path d="m5 12 14 0m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  alert: '<path d="m10.3 3.8-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.2l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21h-3v-.3a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1-2-2 .1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H5v-3h.3a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L6.4 9l2-2 .1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V5h3v.3a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.3v3h-.3a1.7 1.7 0 0 0-1.5 1Z"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.box}</svg>`;
const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = (v) => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const dateFmt = new Intl.DateTimeFormat('es-UY', { day: '2-digit', month: 'short', year: 'numeric' });
const numberFmt = new Intl.NumberFormat('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (cents) => `$ ${numberFmt.format((Number(cents) || 0) / 100)}`;
const cents = (str) => {
  const n = Number(str);
  if (!Number.isFinite(n) || n < 0) throw new Error('Introduce un importe válido, igual o mayor que cero.');
  return Math.round(n * 100);
};
function localDateInput(d = new Date()) {
  const x = new Date(d);
  return [x.getFullYear(), String(x.getMonth()+1).padStart(2,'0'), String(x.getDate()).padStart(2,'0')].join('-');
}
function fromDateInput(str) { return new Date(`${str}T12:00:00`).toISOString(); }
function dateLabel(raw) { return raw ? dateFmt.format(new Date(raw)) : '—'; }
function badge(stateName) { return `<span class="badge ${STATE_COLORS[stateName] || 'gray'}">${escapeHtml(STATE_LABELS[stateName] || stateName)}</span>`; }
const isPersonal = () => ['dueno','recepcionista'].includes(pb?.authStore?.record?.rol);
const currentUser = () => pb?.authStore?.record;
const coll = (name) => state.data[name] || [];
const byId = (name, id) => coll(name).find(x => x.id === id);
const clientForVehicle = (vehiculo) => byId('clientes', vehiculo?.cliente);
const vehicleForOrder = (orden) => byId('vehiculos', orden?.vehiculo);
const clientForOrder = (orden) => clientForVehicle(vehicleForOrder(orden));
const mechanicName = (id) => byId('users', id)?.nombre || 'Sin asignar';
const canModifyOrder = (order) => Boolean(order && ACTIVE_STATES.includes(order.estado) && (isPersonal() || order.mecanico === currentUser()?.id));
const empty = (title, desc='Todavía no hay registros para mostrar.') => `<div class="empty"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(desc)}</p></div>`;
function toastMsg(message, error=false) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast visible${error ? ' error' : ''}`;
  toastTimer = setTimeout(() => toast.className = 'toast', 4900);
}
function userError(e) {
  const fields = e?.response?.data;
  const first = fields && Object.values(fields).find(x => x?.message);
  return first?.message || e?.response?.message || e?.message || 'No se pudo completar la operación.';
}
function pageHead(title, desc, actions='') {
  return `<div class="page-head"><div><div class="eyebrow">Gestión del taller</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(desc)}</p></div><div class="page-actions">${actions}</div></div>`;
}
function actionButton(label, action, cls='btn-primary', extra='') {
  return `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`;
}
function table(headers, rows, searchable=false) {
  if (!rows.length) return empty('Sin resultados', 'Agrega registros para comenzar a trabajar.');
  return `${searchable ? '<div class="toolbar"><input class="input search-box" data-table-search placeholder="Buscar en esta tabla…" aria-label="Buscar registros"></div>' : ''}
   <div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>
   <div class="table-caption">${rows.length} registro(s) mostrados.</div>`;
}
function searchRow(content, cells) { return `<tr data-search="${escapeHtml(norm(content))}">${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`; }

// --- Carga real desde PocketBase ---
async function fetchData() {
  const names = ['users','clientes','vehiculos','ordenes','trabajos','repuestos','orden_repuestos', ...(isPersonal() ? ['pagos'] : [])];
  const values = await Promise.all(names.map(n => pb.collection(n).getFullList({sort: '-created', requestKey: `all-${n}`})));
  state.data = Object.fromEntries(names.map((n,i) => [n, values[i]]));
  if (!isPersonal()) state.data.pagos = [];
}
function stockFor(repuestoId) {
  const p = byId('repuestos', repuestoId);
  if (!p) return 0;
  return Number(p.unidades_recibidas || 0) - coll('orden_repuestos').filter(x => x.repuesto === repuestoId).reduce((sum,x) => sum + Number(x.cantidad || 0), 0);
}
function lowStock() { return coll('repuestos').filter(x => x.activo && stockFor(x.id) <= Number(x.stock_minimo || 0)); }
function laborFor(id) { return coll('trabajos').filter(w => w.orden === id).reduce((s,w) => s + Number(w.precio_centavos || 0), 0); }
function partsFor(id) { return coll('orden_repuestos').filter(w => w.orden === id).reduce((s,w) => s + Number(w.precio_unitario_centavos || 0)*Number(w.cantidad || 0), 0); }
function paidFor(id) { return coll('pagos').filter(w => w.orden === id).reduce((s,w) => s + Number(w.monto_centavos || 0), 0); }
function totalFor(id) { return laborFor(id) + partsFor(id); }
function balanceFor(id) { return totalFor(id) - paidFor(id); }
const activeOrders = () => coll('ordenes').filter(o => ACTIVE_STATES.includes(o.estado));
const visibleOrders = () => isPersonal() ? coll('ordenes') : coll('ordenes').filter(o => o.mecanico === currentUser()?.id);
function flashLoading() { app.querySelector('.workspace')?.setAttribute('aria-busy', 'true'); }
async function updateAndRender(message='Datos actualizados.') {
  flashLoading();
  await fetchData();
  render();
  if (message) toastMsg(message);
}

// --- Autenticación y estructura de navegación ---
function renderLogin() {
  app.innerHTML = `<div class="auth-layout"><div class="auth-side"><div class="brand"><span class="brand-symbol">${icon('gear','icon-lg')}</span> El Pistón</div>
  <div><div class="eyebrow" style="color:#9fc8dc;margin-bottom:18px">Sistema de gestión local</div><h1>Tu taller, <span>bajo control.</span></h1><p>Organiza clientes, vehículos, servicios, repuestos y pagos desde un solo lugar.</p></div>
  <footer>Taller automotriz El Pistón · Proyecto web con PocketBase</footer></div>
  <div class="auth-panel"><div class="auth-card"><div class="eyebrow">Acceso al sistema</div><h2>Bienvenido de nuevo</h2><p class="muted">Ingresa con la cuenta de empleado que creaste en PocketBase.</p>
  <form id="login-form"><div><label for="login-email">Correo electrónico</label><input class="input" id="login-email" name="email" type="email" required autocomplete="username" placeholder="correo@taller.local"></div>
  <div><label for="login-pass">Contraseña</label><input class="input" id="login-pass" name="password" type="password" required autocomplete="current-password" placeholder="Tu contraseña"></div>
  <div id="login-error" class="auth-error hidden" role="alert"></div><button class="btn btn-primary wide" type="submit">Iniciar sesión ${icon('arrow')}</button></form>
  <div class="auth-foot">Servidor local: <strong>127.0.0.1:8090</strong></div></div></div></div>`;
}
function navItem(page, text, ico) {
  return `<button class="nav-item ${state.page===page?'active':''}" data-action="nav" data-page="${page}">${icon(ico)} ${text}</button>`;
}
function render() {
  if (!pb?.authStore?.isValid) { renderLogin(); return; }
  const me = currentUser();
  const title = { dashboard: 'Panel general', clientes: 'Clientes', vehiculos:'Vehículos', ordenes:'Órdenes de servicio', inventario:'Inventario', pagos:'Pagos', reportes:'Reportes'}[state.page] || 'Panel general';
  if (!isPersonal() && ['pagos','reportes'].includes(state.page)) state.page='dashboard';
  app.innerHTML = `<div class="layout"><div class="menu-overlay" data-action="close-menu"></div><aside class="sidebar">
    <div class="brand"><span class="brand-symbol">${icon('gear','icon-lg')}</span> El Pistón</div>
    <div class="sidebar-label">Principal</div><nav aria-label="Navegación principal">
    ${navItem('dashboard','Panel general','home')}
    ${navItem('clientes','Clientes','users')}
    ${navItem('vehiculos','Vehículos','car')}
    ${navItem('ordenes','Órdenes','wrench')}
    ${navItem('inventario','Inventario','box')}
    ${isPersonal() ? `${navItem('pagos','Pagos','card')}${navItem('reportes','Reportes','chart')}`:''}
    </nav><div class="sidebar-bottom"><div class="user-chip"><span class="avatar">${escapeHtml((me.nombre || 'U').slice(0,1).toUpperCase())}</span><div><strong title="${escapeHtml(me.nombre)}">${escapeHtml(me.nombre || me.email)}</strong><small>${escapeHtml(ROLE_LABELS[me.rol] || me.rol)}</small></div></div>
    <button class="nav-item logout" data-action="logout">${icon('logout')} Cerrar sesión</button></div></aside>
    <main class="main"><header class="topbar"><div class="row"><button class="icon-btn mobile-menu" data-action="toggle-menu" aria-label="Abrir menú">${icon('menu')}</button><strong>${escapeHtml(title)}</strong></div>
      <div class="right-links"><span class="badge green">Conectado</span>${actionButton(`${icon('refresh')} Actualizar`,'refresh','btn-outline btn-sm')}</div></header>
      <section class="workspace">${renderPage()}</section></main></div>`;
}
function renderPage() {
  if (state.page==='dashboard') return dashboardPage();
  if (state.page==='clientes') return state.selectedClient ? clientDetailPage() : clientsPage();
  if (state.page==='vehiculos') return state.selectedVehicle ? vehicleDetailPage() : vehiclesPage();
  if (state.page==='ordenes') return state.selectedOrder ? orderDetailPage() : ordersPage();
  if (state.page==='inventario') return inventoryPage();
  if (state.page==='pagos') return paymentsPage();
  if (state.page==='reportes') return reportsPage();
  return dashboardPage();
}

// --- Dashboard ---
function stat(label, val, hint, ico, variant='') {
  return `<div class="card stat-card"><div class="stat-top"><span class="label">${escapeHtml(label)}</span><span class="stat-icon ${variant}">${icon(ico)}</span></div><div class="value">${val}</div><div class="hint">${escapeHtml(hint)}</div></div>`;
}
function dashboardPage() {
  const orders = activeOrders().filter(o => isPersonal() || o.mecanico===currentUser()?.id);
  const lows=lowStock();
  const delivered=coll('ordenes').filter(o => o.estado==='entregada' && localDateInput(o.fecha_entrega||o.updated).startsWith(localDateInput().slice(0,7)));
  const pending=coll('ordenes').filter(o=>o.estado==='entregada' && balanceFor(o.id)>0);
  const recent=visibleOrders().slice(0,6);
  const mechanics=coll('users').filter(u => u.rol==='mecanico' && u.activo);
  const max=Math.max(...mechanics.map(u => activeOrders().filter(o => o.mecanico===u.id).length),1);
  const income=isPersonal()?stat('Facturado este mes',money(delivered.reduce((s,o)=>s+totalFor(o.id),0)),'Órdenes entregadas','chart','green') :stat('Órdenes listas',orders.filter(o=>o.estado==='lista').length,'Pendientes de entrega','check','green');
  return `${pageHead('Panel de control',`Hola, ${currentUser().nombre}. Resumen actualizado de la actividad del taller.`, actionButton(`${icon('refresh')} Actualizar`,'refresh','btn-outline'))}
    <div class="stat-grid">
      ${stat('Órdenes abiertas',orders.length,'En curso','wrench')}
      ${stat('Clientes registrados',coll('clientes').length,'En base de datos','users')}
      ${income}
      ${stat('Alertas de stock',lows.length,'Bajo el mínimo establecido','alert','amber')}
    </div>
    <div class="two-columns"><section class="card"><div class="card-head"><h2>Órdenes recientes</h2>${actionButton('Ver todas','to-orders','btn-outline btn-sm')}</div>
      ${recent.length ? `<div class="mini-list">${recent.map(o=>{const v=vehicleForOrder(o); return `<div class="mini-row"><div><button class="link-btn" data-action="order-detail" data-id="${o.id}">#${escapeHtml(o.id.slice(-6).toUpperCase())} · ${escapeHtml(v?.matricula || 'Vehículo')}</button><small style="display:block">${escapeHtml(clientForOrder(o)?.nombre || '')} · ${dateLabel(o.fecha_ingreso)}</small></div>${badge(o.estado)}</div>`}).join('')}</div>` : empty('No hay órdenes todavía', 'Comienza creando un cliente y su vehículo.')}
      </section><section class="card"><div class="card-head"><h2>Carga por mecánico</h2><span class="subtle">Órdenes abiertas</span></div>
      ${mechanics.length ? mechanics.map(u=>{ const count=activeOrders().filter(o=>o.mecanico===u.id).length; return `<div style="margin-bottom:19px"><div class="row between"><strong style="font-size:.84rem">${escapeHtml(u.nombre)}</strong><span class="subtle">${count} ${count===1?'orden':'órdenes'}</span></div><div class="meter"><span style="width:${Math.round(count*100/max)}%"></span></div></div>`}).join('') : empty('Sin mecánicos activos','Habilítalos en el panel de PocketBase.')}
      </section></div>
      <section class="card"><div class="card-head"><h2>Repuestos por agotarse</h2>${actionButton('Ir a inventario','to-inventory','btn-outline btn-sm')}</div>
      ${lows.length ? `<div class="alert-list">${lows.slice(0,6).map(p=>`<div class="alert-item"><div><strong>${escapeHtml(p.nombre)}</strong><small>Código ${escapeHtml(p.codigo)} · Mínimo ${Number(p.stock_minimo)}</small></div><span class="alert-number">${stockFor(p.id)} uds.</span></div>`).join('')}</div>` : `<div class="small-note">Todo en orden: no hay repuestos activos por debajo de su mínimo.</div>`}
      ${isPersonal() && pending.length ? `<div class="summary-strip"><div><small>Órdenes entregadas con saldo</small><strong>${pending.length}</strong></div><div><small>Saldo pendiente total</small><strong>${money(pending.reduce((s,o)=>s+balanceFor(o.id),0))}</strong></div></div>`:''}</section>`;
}

// --- Clientes ---
function clientsPage() {
  const rows=coll('clientes').map(c=>searchRow([c.nombre,c.telefono,c.direccion].join(' '),[
    `<button class="link-btn" data-action="client-detail" data-id="${c.id}">${escapeHtml(c.nombre)}</button>`, escapeHtml(c.telefono), escapeHtml(c.direccion || '—'),
    String(coll('vehiculos').filter(v=>v.cliente===c.id).length),
    `<div class="cell-actions">${actionButton('Ver','client-detail','btn-outline btn-sm',`data-id="${c.id}"`)} ${isPersonal()?actionButton('Editar','edit-client','btn-outline btn-sm',`data-id="${c.id}"`):''}</div>`]));
  return `${pageHead('Clientes','Información de contacto e historial de propietarios.',isPersonal()?actionButton(`${icon('plus')} Nuevo cliente`,'new-client','btn-sky'):'')}
    <section class="card">${table(['Nombre','Teléfono','Dirección','Vehículos','Acciones'],rows,true)}</section>`;
}
function clientDetailPage() {
  const c=byId('clientes',state.selectedClient);
  if (!c) {state.selectedClient=null;return clientsPage();}
  const vehicles=coll('vehiculos').filter(v=>v.cliente===c.id);
  const vehicleIds=new Set(vehicles.map(v=>v.id));
  const orders=coll('ordenes').filter(o=>vehicleIds.has(o.vehiculo) && (isPersonal() || o.mecanico===currentUser()?.id));
  const vehiclesRows=vehicles.map(v=>searchRow(v.matricula+' '+v.marca,[`<button class="link-btn" data-action="vehicle-detail" data-id="${v.id}">${escapeHtml(v.matricula)}</button>`,`${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}`,String(coll('ordenes').filter(o=>o.vehiculo===v.id).length)]));
  const orderRows=orders.map(o=>searchRow(o.id,[`<button class="link-btn" data-action="order-detail" data-id="${o.id}">#${o.id.slice(-6).toUpperCase()}</button>`,escapeHtml(vehicleForOrder(o)?.matricula||''),dateLabel(o.fecha_ingreso),badge(o.estado)]));
  return `<button class="detail-breadcrumb" data-action="back-clients">← Volver a clientes</button>
  ${pageHead(c.nombre,'Ficha de cliente y servicios asociados.',isPersonal()?actionButton('Editar datos','edit-client','btn-outline',`data-id="${c.id}"`):'')}
  <div class="detail-grid"><div class="stack"><section class="card"><div class="card-head"><h2>Vehículos</h2></div>${table(['Matrícula','Vehículo','Visitas'],vehiclesRows)}</section><section class="card"><div class="card-head"><h2>Historial de servicios</h2></div>${table(['Orden','Matrícula','Ingreso','Estado'],orderRows)}</section></div>
  <section class="card" style="align-self:start"><div class="card-head"><h2>Datos de contacto</h2></div><div class="detail-card"><div class="detail-line"><span class="muted">Teléfono</span><strong>${escapeHtml(c.telefono)}</strong></div><div class="detail-line"><span class="muted">Dirección</span><strong>${escapeHtml(c.direccion||'No indicada')}</strong></div><div class="detail-line"><span class="muted">Vehículos</span><strong>${vehicles.length}</strong></div>${isPersonal()?`<div class="detail-line"><span class="muted">Pendiente (órdenes entregadas)</span><strong>${money(orders.filter(o=>o.estado==='entregada').reduce((s,o)=>s+Math.max(0,balanceFor(o.id)),0))}</strong></div>`:''}</div></section></div>`;
}

// --- Vehículos ---
function vehiclesPage() {
  const rows=coll('vehiculos').map(v=>searchRow(`${v.matricula} ${v.marca} ${v.modelo} ${clientForVehicle(v)?.nombre}`, [
    `<button class="link-btn" data-action="vehicle-detail" data-id="${v.id}">${escapeHtml(v.matricula)}</button>`,`${escapeHtml(v.marca)} ${escapeHtml(v.modelo)}`,String(v.anio||'—'),escapeHtml(clientForVehicle(v)?.nombre || '—'),
    Number(v.kilometraje_ultimo||0).toLocaleString('es-UY')+' km',
    `<div class="cell-actions">${actionButton('Ver','vehicle-detail','btn-outline btn-sm',`data-id="${v.id}"`)}${isPersonal()?actionButton('Editar','edit-vehicle','btn-outline btn-sm',`data-id="${v.id}"`):''}</div>`
  ]));
  return `${pageHead('Vehículos','Matrículas, propietarios y seguimiento de visitas.',isPersonal()?actionButton(`${icon('plus')} Nuevo vehículo`,'new-vehicle','btn-sky'):'')}
    <section class="card">${table(['Matrícula','Marca y modelo','Año','Propietario','Último km','Acciones'],rows,true)}</section>`;
}
function vehicleDetailPage() {
  const v=byId('vehiculos',state.selectedVehicle);
  if(!v){state.selectedVehicle=null;return vehiclesPage();}
  const c=clientForVehicle(v);
  const orders=coll('ordenes').filter(o=>o.vehiculo===v.id && (isPersonal() || o.mecanico===currentUser()?.id));
  const rows=orders.map(o=>searchRow(o.problema,[`<button class="link-btn" data-action="order-detail" data-id="${o.id}">#${o.id.slice(-6).toUpperCase()}</button>`,dateLabel(o.fecha_ingreso),escapeHtml(o.problema),badge(o.estado)]));
  return `<button class="detail-breadcrumb" data-action="back-vehicles">← Volver a vehículos</button>${pageHead(`${v.marca} ${v.modelo}`,
    `${v.matricula} · ${v.anio || 'Sin año'} · ${c?.nombre || 'Propietario no disponible'}`,
    isPersonal()?actionButton(`${icon('plus')} Nueva orden`,'new-order','btn-sky',`data-vehiculo="${v.id}"`):'')}
    <div class="detail-grid"><section class="card"><div class="card-head"><h2>Historial del vehículo</h2></div>${table(['Orden','Fecha','Problema reportado','Estado'],rows)}</section>
    <section class="card" style="align-self:start"><div class="card-head"><h2>Ficha técnica</h2></div><div class="detail-card">${[['Matrícula',v.matricula],['Marca',v.marca],['Modelo',v.modelo],['Año',v.anio || '—'],['Último kilometraje',`${Number(v.kilometraje_ultimo||0).toLocaleString('es-UY')} km`],['Propietario',c?.nombre||'—']].map(([label,val])=>`<div class="detail-line"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(val)}</strong></div>`).join('')}</div></section></div>`;
}

// --- Órdenes y sus detalles ---
function ordersPage() {
  const filtered=visibleOrders().filter(o=>state.statusFilter==='todas'||o.estado===state.statusFilter);
  const rows=filtered.map(o=>{const v=vehicleForOrder(o); return searchRow([o.id,v?.matricula,clientForOrder(o)?.nombre,o.problema,mechanicName(o.mecanico)].join(' '),[
    `<button class="link-btn" data-action="order-detail" data-id="${o.id}">#${o.id.slice(-6).toUpperCase()}</button>`,dateLabel(o.fecha_ingreso),
    `<strong>${escapeHtml(v?.matricula || '—')}</strong><small class="muted">${escapeHtml(v?.marca || '')} ${escapeHtml(v?.modelo || '')}</small>`,
    escapeHtml(clientForOrder(o)?.nombre || '—'),badge(o.estado),escapeHtml(mechanicName(o.mecanico)),
    `<button class="btn btn-outline btn-sm" data-action="order-detail" data-id="${o.id}">Ver detalle ${icon('chevron')}</button>`
  ]);});
  return `${pageHead('Órdenes de servicio','Gestiona cada ingreso, trabajo y reparación.',isPersonal()?actionButton(`${icon('plus')} Nueva orden`,'new-order','btn-sky'):'')}
  <section class="card"><div class="toolbar"><select id="order-status-filter" class="select" style="max-width:235px" aria-label="Filtrar por estado">
  <option value="todas">Todos los estados</option>${Object.entries(STATE_LABELS).map(([k,v])=>`<option value="${k}" ${state.statusFilter===k?'selected':''}>${v}</option>`).join('')}</select>
  <input class="input search-box" data-table-search placeholder="Buscar orden, matrícula, cliente…" aria-label="Buscar orden"></div>
  ${rows.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Orden</th><th>Ingreso</th><th>Vehículo</th><th>Cliente</th><th>Estado</th><th>Mecánico</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div><div class="table-caption">${rows.length} órdenes mostradas</div>`:empty('No hay órdenes para este filtro')}</section>`;
}
function orderDetailPage() {
  const o=byId('ordenes',state.selectedOrder);
  if (!o || (!isPersonal() && o.mecanico!==currentUser()?.id)) {state.selectedOrder=null;return ordersPage();}
  const v=vehicleForOrder(o), c=clientForOrder(o), canEdit=canModifyOrder(o);
  const works=coll('trabajos').filter(w=>w.orden===o.id),parts=coll('orden_repuestos').filter(w=>w.orden===o.id),pay=coll('pagos').filter(w=>w.orden===o.id);
  const worksRows=works.map(w=>searchRow(w.descripcion,[escapeHtml(w.descripcion),`<strong>${money(w.precio_centavos)}</strong>`]));
  const partsRows=parts.map(p=>searchRow(byId('repuestos',p.repuesto)?.nombre,[escapeHtml(byId('repuestos',p.repuesto)?.nombre||'Repuesto eliminado'),String(p.cantidad),money(p.precio_unitario_centavos),`<strong>${money(p.cantidad*p.precio_unitario_centavos)}</strong>`]));
  const payRows=pay.map(p=>searchRow(p.medio_pago,[dateLabel(p.fecha_pago),escapeHtml(p.medio_pago),`<strong>${money(p.monto_centavos)}</strong>`]));
  const canCancel=isPersonal() && canEdit && works.length===0 && parts.length===0 && pay.length===0;
  const next=NEXT_STATE[o.estado];
  return `<button class="detail-breadcrumb" data-action="back-orders">← Volver a órdenes</button>
  ${pageHead(`Orden #${o.id.slice(-6).toUpperCase()}`,`${v?.marca||'Vehículo'} ${v?.modelo||''} · ${v?.matricula||'—'} · Ingreso ${dateLabel(o.fecha_ingreso)}`,
  `<span style="align-self:center">${badge(o.estado)}</span>${isPersonal()&&canEdit?actionButton('Editar orden','edit-order','btn-outline',`data-id="${o.id}"`):''}`)}
  <div class="detail-grid"><div class="stack">
    <section class="card"><div class="card-head"><h2>Servicio y diagnóstico</h2>${canEdit ? actionButton('Editar diagnóstico','diagnosis','btn-outline btn-sm',`data-id="${o.id}"`):''}</div>
      <div class="detail-card"><div><div class="eyebrow">Problema reportado</div><p class="mt-2" style="line-height:1.6">${escapeHtml(o.problema)}</p></div><div><div class="eyebrow">Diagnóstico</div><p class="mt-2" style="line-height:1.6">${escapeHtml(o.diagnostico||'Aún no registrado')}</p></div>
      ${o.observaciones?`<div><div class="eyebrow">Observaciones</div><p class="mt-2" style="line-height:1.6">${escapeHtml(o.observaciones)}</p></div>`:''}
      ${canEdit?`<div class="row wrap">${next && (next!=='entregada' || isPersonal())?actionButton(`${icon('arrow')} Pasar a: ${escapeHtml(STATE_LABELS[next])}`,'advance-order','btn-sky',`data-id="${o.id}" ${next==='entregada' && paidFor(o.id)<=0?'disabled title="Primero registra un pago"':''}`):''}${canCancel?actionButton('Cancelar orden','cancel-order','btn-outline',`data-id="${o.id}"`):''}</div>${next==='entregada' && !isPersonal()?'<p class="muted">La entrega la confirma recepción tras registrar al menos un pago.</p>':''}${next==='entregada' && isPersonal() && paidFor(o.id)===0?'<p class="muted">Para entregar esta orden, primero registra un pago.</p>':''}`:''}</div>
    </section>
    <section class="card"><div class="card-head"><h2>Trabajos realizados</h2>${canEdit?actionButton(`${icon('plus')} Agregar trabajo`,'new-work','btn-outline btn-sm',`data-id="${o.id}"`):''}</div>${table(['Descripción','Mano de obra'],worksRows)}</section>
    <section class="card"><div class="card-head"><h2>Repuestos utilizados</h2>${canEdit?actionButton(`${icon('plus')} Usar repuesto`,'new-consumption','btn-outline btn-sm',`data-id="${o.id}"`):''}</div>${table(['Repuesto','Cant.','Precio unit.','Subtotal'],partsRows)}</section>
    ${isPersonal()?`<section class="card"><div class="card-head"><h2>Pagos registrados</h2>${o.estado!=='cancelada' && balanceFor(o.id)>0 ? actionButton(`${icon('plus')} Registrar pago`,'new-payment','btn-outline btn-sm',`data-id="${o.id}"`):''}</div>${table(['Fecha','Medio','Monto'],payRows)}</section>`:''}
    </div>
    <div class="stack"><section class="card"><div class="card-head"><h2>Información de la orden</h2></div>
      <div class="detail-card">${[['Cliente',c?.nombre||'—'],['Teléfono',c?.telefono||'—'],['Vehículo',v?.matricula||'—'],['Mecánico',mechanicName(o.mecanico)],['Kilometraje de entrada',`${Number(o.kilometraje_ingreso||0).toLocaleString('es-UY')} km`],['Fecha de ingreso',dateLabel(o.fecha_ingreso)],['Fecha de entrega',dateLabel(o.fecha_entrega)]].map(([label,val])=>`<div class="detail-line"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(val)}</strong></div>`).join('')}</div>
    </section>
    <section class="card"><div class="card-head"><h2>Resumen económico</h2></div><div class="detail-card"><div class="detail-line"><span class="muted">Mano de obra</span><strong>${money(laborFor(o.id))}</strong></div><div class="detail-line"><span class="muted">Repuestos</span><strong>${money(partsFor(o.id))}</strong></div><div class="detail-money"><div class="row between"><span>Total orden</span><span class="total">${money(totalFor(o.id))}</span></div>${isPersonal()?`<div class="row between mt-2"><span class="muted">Abonado</span><strong>${money(paidFor(o.id))}</strong></div><div class="row between mt-2"><span>Saldo pendiente</span><span class="balance">${money(balanceFor(o.id))}</span></div>`:''}</div></div>
    </section></div>
  </div>`;
}

// --- Inventario y pagos ---
function inventoryPage() {
  const rows=coll('repuestos').map(p=>{const stock=stockFor(p.id),low=p.activo&&stock<=Number(p.stock_minimo||0);return searchRow([p.codigo,p.nombre].join(' '),[
    `<strong>${escapeHtml(p.codigo)}</strong>`,escapeHtml(p.nombre),money(p.precio_venta_centavos),
    `<strong style="${low?'color:#b77b04;':''}">${stock}</strong>`,String(p.stock_minimo||0),
    p.activo?`<span class="badge ${low?'amber':'green'}">${low?'Stock bajo':'Disponible'}</span>`:'<span class="badge gray">Inactivo</span>',
    isPersonal()?`<div class="cell-actions">${actionButton('Reponer','replenish','btn-outline btn-sm',`data-id="${p.id}"`)}${actionButton('Editar','edit-part','btn-outline btn-sm',`data-id="${p.id}"`)}</div>`:'—'
  ]);});
  return `${pageHead('Inventario de repuestos','Existencias calculadas a partir de unidades recibidas y consumos.',isPersonal()?actionButton(`${icon('plus')} Nuevo repuesto`,'new-part','btn-sky'):'')}
  ${lowStock().length?`<div class="warning-note mb-3">${icon('alert')} Hay ${lowStock().length} repuesto(s) con existencias iguales o inferiores al mínimo configurado.</div>`:''}
  <section class="card">${table(['Código','Repuesto','Precio venta','Stock','Mínimo','Estado','Acciones'],rows,true)}</section>
  <p class="table-caption">Stock disponible = unidades recibidas acumuladas − unidades utilizadas en órdenes. No existe una columna de stock físico independiente.</p>`;
}
function paymentsPage() {
  const rows=coll('pagos').map(p=>{const o=byId('ordenes',p.orden); return searchRow(`${p.medio_pago} ${clientForOrder(o)?.nombre||''}`,[
    dateLabel(p.fecha_pago),`<button class="link-btn" data-action="order-detail" data-id="${p.orden}">#${p.orden.slice(-6).toUpperCase()}</button>`,escapeHtml(clientForOrder(o)?.nombre||'—'),
    escapeHtml(p.medio_pago),`<strong>${money(p.monto_centavos)}</strong>`
  ]);});
  return `${pageHead('Pagos','Registro de abonos recibidos por orden de servicio.')}
    <div class="stat-grid">${stat('Total cobrado',money(coll('pagos').reduce((s,p)=>s+Number(p.monto_centavos||0),0)),'Todos los pagos registrados','card','green')}
    ${stat('Pagos registrados',coll('pagos').length,'Abonos individuales','check')}
    ${stat('Órdenes con saldo',coll('ordenes').filter(o=>o.estado==='entregada'&&balanceFor(o.id)>0).length,'Entregadas y con saldo','alert','amber')}
    ${stat('Saldo por cobrar',money(coll('ordenes').filter(o=>o.estado==='entregada').reduce((s,o)=>s+Math.max(balanceFor(o.id),0),0)),'De órdenes entregadas','chart')}</div>
    <section class="card">${table(['Fecha','Orden','Cliente','Medio','Importe'],rows,true)}</section>`;
}

// --- Reportes ---
function inDateRange(raw) { if(!raw) return false;const key=localDateInput(raw);return key>=state.reportFrom&&key<=state.reportTo; }
function reportsPage() {
  const delivered=coll('ordenes').filter(o=>o.estado==='entregada' && inDateRange(o.fecha_entrega));
  const payments=coll('pagos').filter(p=>inDateRange(p.fecha_pago));
  const billing=delivered.reduce((s,o)=>s+totalFor(o.id),0);
  const collected=payments.reduce((s,p)=>s+Number(p.monto_centavos||0),0);
  const debts=coll('clientes').map(c=>{
    const vIds=new Set(coll('vehiculos').filter(v=>v.cliente===c.id).map(v=>v.id));
    const pending=coll('ordenes').filter(o=>o.estado==='entregada'&&vIds.has(o.vehiculo)).reduce((s,o)=>s+Math.max(balanceFor(o.id),0),0);
    return {...c,pending};
  }).filter(c=>c.pending>0).sort((a,b)=>b.pending-a.pending);
  const debtRows=debts.map(c=>searchRow(c.nombre,[`<button class="link-btn" data-action="client-detail" data-id="${c.id}">${escapeHtml(c.nombre)}</button>`,escapeHtml(c.telefono),`<strong>${money(c.pending)}</strong>`]));
  const recentRows=delivered.map(o=>searchRow(o.id,[`<button class="link-btn" data-action="order-detail" data-id="${o.id}">#${o.id.slice(-6).toUpperCase()}</button>`,dateLabel(o.fecha_entrega),escapeHtml(clientForOrder(o)?.nombre||'—'),money(totalFor(o.id))]));
  return `${pageHead('Reportes del taller','Facturación y pagos se muestran por separado para no confundirlos.')}
    <section class="card section-space"><div class="date-filters"><label>Desde<input type="date" class="input" id="date-from" value="${state.reportFrom}"></label><label>Hasta<input type="date" class="input" id="date-to" value="${state.reportTo}"></label>
    ${actionButton('Aplicar período','apply-dates','btn-primary')}</div></section>
    <div class="stat-grid">${stat('Facturado',money(billing),'Valor de órdenes entregadas','chart','green')}${stat('Cobrado',money(collected),'Pagos recibidos en el período','card')}
    ${stat('Órdenes entregadas',delivered.length,'En el período seleccionado','check')}${stat('Clientes con deuda',debts.length,'Saldo histórico de órdenes entregadas','alert','amber')}</div>
    <div class="two-columns"><section class="card"><div class="card-head"><h2>Órdenes facturadas</h2></div>${table(['Orden','Entrega','Cliente','Total'],recentRows)}</section>
    <section class="card"><div class="card-head"><h2>Clientes con saldo pendiente</h2></div>${table(['Cliente','Teléfono','Deuda'],debtRows)}</section></div>
    <div class="small-note">Criterio de facturación del proyecto: suma del importe de órdenes marcadas como entregadas por fecha de entrega. No se generan facturas fiscales.</div>`;
}

// --- Formularios reutilizables ---
function field(name,label,kind='text',value='',attrs='',hint='',span='') {
  const safe=escapeHtml(value ?? '');
  const input = kind==='textarea'
    ? `<textarea class="textarea" name="${name}" id="f-${name}" ${attrs}>${safe}</textarea>`
    : `<input class="input" type="${kind}" name="${name}" id="f-${name}" value="${safe}" ${attrs}>`;
  return `<div class="field ${span}"><label for="f-${name}">${escapeHtml(label)}</label>${input}${hint?`<small>${escapeHtml(hint)}</small>`:''}</div>`;
}
function selectField(name,label,options,selected='',attrs='',span='') {
  return `<div class="field ${span}"><label for="f-${name}">${escapeHtml(label)}</label><select class="select" name="${name}" id="f-${name}" ${attrs}>${options.map(([value,text])=>`<option value="${escapeHtml(value)}" ${String(value)===String(selected)?'selected':''}>${escapeHtml(text)}</option>`).join('')}</select></div>`;
}
function formFields(...items) { return `<div class="form-grid">${items.join('')}</div>`; }
function showModal(title,description,fields,submit,sLabel='Guardar') {
  document.querySelector('#modal-title').textContent=title;
  document.querySelector('#modal-description').textContent=description;
  document.querySelector('#modal-fields').innerHTML=fields;
  document.querySelector('#submit-modal').textContent=sLabel;
  document.querySelector('#modal-form').reset();
  onSubmitModal=submit;
  dialog.showModal();
}
const getV = (data,key) => String(data.get(key)||'').trim();
function optionsOf(name, format, blank='Seleccionar…') {
  return [['',blank],...coll(name).map(r=>[r.id,format(r)])];
}
function openClientForm(id=null) {
  const c=id?byId('clientes',id):{};
  showModal(id?'Editar cliente':'Nuevo cliente','Completa los datos del propietario.',formFields(
    field('nombre','Nombre *','text',c.nombre||'','required maxlength="120"','', 'span-2'),
    field('telefono','Teléfono *','tel',c.telefono||'','required maxlength="40"'),
    field('direccion','Dirección (opcional)','text',c.direccion||'','maxlength="250"','', 'span-2')
  ),async f=>{const payload={nombre:getV(f,'nombre'),telefono:getV(f,'telefono'),direccion:getV(f,'direccion')};
    if(id)await pb.collection('clientes').update(id,payload); else await pb.collection('clientes').create(payload);
    await updateAndRender('Cliente guardado.');});
}
function openVehicleForm(id=null) {
  if(!coll('clientes').length){toastMsg('Primero debes registrar al menos un cliente.',true);return;}
  const v=id?byId('vehiculos',id):{};
  showModal(id?'Editar vehículo':'Nuevo vehículo','Asocia este vehículo a uno de los clientes registrados.',formFields(
    selectField('cliente','Propietario *',optionsOf('clientes',x=>x.nombre),v.cliente,'required','span-2'),
    field('matricula','Matrícula *','text',v.matricula||'','required maxlength="25"'),
    field('marca','Marca *','text',v.marca||'','required maxlength="60"'),
    field('modelo','Modelo *','text',v.modelo||'','required maxlength="60"'),
    field('anio','Año de fabricación *','number',v.anio||'','required min="1900" max="2100" step="1"'),
    field('kilometraje_ultimo','Último kilometraje','number',v.kilometraje_ultimo??0,'min="0" step="1"')
  ),async f=>{const payload={cliente:getV(f,'cliente'),matricula:getV(f,'matricula').toUpperCase(),marca:getV(f,'marca'),modelo:getV(f,'modelo'),
    anio:Number(getV(f,'anio')||0),kilometraje_ultimo:Number(getV(f,'kilometraje_ultimo')||0)};
    if(id)await pb.collection('vehiculos').update(id,payload);else await pb.collection('vehiculos').create(payload);
    await updateAndRender('Vehículo guardado.');});
}
function openOrderForm(vehiculoDefault='',orderId=null) {
  if (!coll('vehiculos').length) {toastMsg('Primero registra un vehículo.',true);return;}
  const o=orderId?byId('ordenes',orderId):{};
  const mechanics=coll('users').filter(u=>u.rol==='mecanico' && u.activo);
  if (!mechanics.length) {toastMsg('Debes crear y activar al menos un usuario con rol mecánico antes de registrar una orden.',true);return;}
  const selectedV=o.vehiculo||vehiculoDefault||'';
  showModal(orderId?'Editar orden':'Nueva orden de servicio',
    'Registra la visita del vehículo y asigna un mecánico.', formFields(
      selectField('vehiculo','Vehículo *',optionsOf('vehiculos',v=>`${v.matricula} · ${v.marca} ${v.modelo}`),selectedV,'required','span-2'),
      selectField('mecanico','Mecánico asignado *',[['','Seleccionar mecánico…'],...mechanics.map(u=>[u.id,u.nombre])],o.mecanico||'','required'),
      field('kilometraje_ingreso','Kilometraje de ingreso','number',o.kilometraje_ingreso??(byId('vehiculos',selectedV)?.kilometraje_ultimo||0),'min="0" step="1"'),
      field('fecha_ingreso','Fecha de ingreso *','date',o.fecha_ingreso?localDateInput(o.fecha_ingreso):localDateInput(),'required'),
      field('problema','Problema reportado *','textarea',o.problema||'','required maxlength="2000"','', 'span-2')
  ),async f=>{
    const mecanicoId=getV(f,'mecanico');
    if (!mecanicoId || !mechanics.some(u=>u.id===mecanicoId)) {
      throw new Error('Selecciona un mecánico activo para asignar esta orden.');
    }
    const payload={vehiculo:getV(f,'vehiculo'),mecanico:mecanicoId,fecha_ingreso:fromDateInput(getV(f,'fecha_ingreso')),
      kilometraje_ingreso:Number(getV(f,'kilometraje_ingreso')||0),problema:getV(f,'problema')};
    if(orderId) {
      await pb.collection('ordenes').update(orderId,payload);
      await updateAndRender('Orden actualizada.');
    } else {
      payload.estado='recibida';
      const created=await pb.collection('ordenes').create(payload);
      state.selectedOrder=created.id;state.page='ordenes';
      try {await pb.collection('vehiculos').update(payload.vehiculo,{kilometraje_ultimo:payload.kilometraje_ingreso});}
      catch(err) {toastMsg('Orden creada, pero no se pudo actualizar el último kilometraje del vehículo.',true);await updateAndRender(null);return;}
      await updateAndRender('Orden creada.');
    }
  });
}
function openDiagnosisForm(id) {
  const o=byId('ordenes',id);if(!canModifyOrder(o))return;
  showModal('Diagnóstico y observaciones','Registra las conclusiones del mecánico.', formFields(
    field('diagnostico','Diagnóstico','textarea',o.diagnostico||'','maxlength="2000"','','span-2'),
    field('observaciones','Observaciones','textarea',o.observaciones||'','maxlength="2000"','','span-2')
  ),async f=>{
    await pb.collection('ordenes').update(id,{diagnostico:getV(f,'diagnostico'),observaciones:getV(f,'observaciones')});
    await updateAndRender('Diagnóstico guardado.');
  });
}
function openWorkForm(id) {
  const o=byId('ordenes',id);if(!canModifyOrder(o))return;
  showModal('Agregar trabajo','Guarda la mano de obra realizada en esta orden.',formFields(
    field('descripcion','Trabajo realizado *','text','','required maxlength="350"','','span-2'),
    field('precio','Precio de mano de obra *','number','','required min="0" step="0.01"','Introduce el importe en unidades monetarias; se guarda en centavos.','span-2')
  ),async f=>{
    await pb.collection('trabajos').create({orden:id,descripcion:getV(f,'descripcion'),precio_centavos:cents(getV(f,'precio'))});
    await updateAndRender('Trabajo agregado.');
  });
}
function openPartForm(id=null) {
  const p=id?byId('repuestos',id):{};
  showModal(id?'Editar repuesto':'Nuevo repuesto','El inventario se controla por unidades recibidas menos consumo.',formFields(
    field('codigo','Código *','text',p.codigo||'','required maxlength="60"'),
    field('nombre','Nombre *','text',p.nombre||'','required maxlength="120"'),
    field('precio','Precio de venta *','number',p.id?(Number(p.precio_venta_centavos)/100).toFixed(2):'','required min="0" step="0.01"'),
    field('stock_minimo','Stock mínimo *','number',p.stock_minimo??2,'required min="0" step="1"'),
    id?'':field('unidades_recibidas','Unidades iniciales *','number',0,'required min="0" step="1"'),
    selectField('activo','Estado',[['true','Activo'],['false','Inactivo']],p.id?String(Boolean(p.activo)):'true')
  ),async f=>{
    const payload={codigo:getV(f,'codigo').toUpperCase(),nombre:getV(f,'nombre'),precio_venta_centavos:cents(getV(f,'precio')),
      stock_minimo:Number(getV(f,'stock_minimo')),activo:getV(f,'activo')==='true'};
    if(id)await pb.collection('repuestos').update(id,payload);
    else await pb.collection('repuestos').create({...payload,unidades_recibidas:Number(getV(f,'unidades_recibidas'))});
    await updateAndRender('Repuesto guardado.');
  });
}
function openReplenishForm(id) {
  const p=byId('repuestos',id);if(!p)return;
  showModal('Reponer existencias',`${p.nombre} · Disponible actualmente: ${stockFor(id)} unidades.`,formFields(
    field('cantidad','Unidades que ingresan *','number',1,'required min="1" step="1"','Se sumarán a las unidades recibidas acumuladas.','span-2')
  ),async f=>{
    const n=Number(getV(f,'cantidad'));
    if(!Number.isSafeInteger(n)||n<=0)throw new Error('La cantidad debe ser un entero positivo.');
    await pb.collection('repuestos').update(id,{'unidades_recibidas+':n});
    await updateAndRender('Existencias repuestas.');
  },'Confirmar reposición');
}
function openConsumptionForm(orderId) {
  const order=byId('ordenes',orderId);if(!canModifyOrder(order))return;
  const parts=coll('repuestos').filter(p=>p.activo && stockFor(p.id)>0);
  if(!parts.length){toastMsg('No hay repuestos activos con stock disponible.',true);return;}
  showModal('Usar repuesto','La cantidad indicada se descontará del stock calculado.',formFields(
    selectField('repuesto','Repuesto *',optionsOfActiveParts(),'','required','span-2'),
    field('cantidad','Cantidad *','number',1,'required min="1" step="1"','Se validará el stock actual.'),
    field('precio','Precio unitario *','number','','required min="0" step="0.01"','Precio de venta al momento del consumo.')
  ),async f=>{
    const partId=getV(f,'repuesto'),q=Number(getV(f,'cantidad'));
    if(!Number.isSafeInteger(q)||q<=0)throw new Error('La cantidad debe ser un entero positivo.');
    // Validación de interfaz. Otra petición simultánea podría superar el stock.
    const latest=await pb.collection('orden_repuestos').getFullList({filter:pb.filter('repuesto = {:id}',{id:partId}),requestKey:null});
    const part=await pb.collection('repuestos').getOne(partId,{requestKey:null});
    const available=Number(part.unidades_recibidas||0)-latest.reduce((s,r)=>s+Number(r.cantidad||0),0);
    if(q>available)throw new Error(`No hay existencias suficientes. Quedan ${available} unidades.`);
    await pb.collection('orden_repuestos').create({orden:orderId,repuesto:partId,cantidad:q,precio_unitario_centavos:cents(getV(f,'precio'))});
    await updateAndRender('Consumo registrado; el stock disponible se ha recalculado.');
  },'Registrar consumo');
  const picker=dialog.querySelector('[name="repuesto"]');
  const price=dialog.querySelector('[name="precio"]');
  picker.addEventListener('change',()=>{const p=byId('repuestos',picker.value);price.value=p?(Number(p.precio_venta_centavos)/100).toFixed(2):'';});
}
function optionsOfActiveParts() {return [['','Seleccionar repuesto…'],...coll('repuestos').filter(p=>p.activo&&stockFor(p.id)>0).map(p=>[p.id,`${p.nombre} · ${stockFor(p.id)} uds. disponibles`])];}
function openPaymentForm(id) {
  const o=byId('ordenes',id);if(!isPersonal() || !o || o.estado==='cancelada')return;
  const balance=balanceFor(id);
  if(balance<=0){toastMsg('Esta orden no tiene saldo pendiente.',true);return;}
  showModal('Registrar pago',`Saldo pendiente de la orden: ${money(balance)}`,formFields(
    field('monto','Importe abonado *','number',(balance/100).toFixed(2),`required min="0.01" step="0.01" max="${(balance/100).toFixed(2)}"`),
    field('fecha_pago','Fecha de pago *','date',localDateInput(),'required'),
    selectField('medio_pago','Medio de pago',[['efectivo','Efectivo'],['tarjeta','Tarjeta'],['transferencia','Transferencia']],'efectivo'),
    field('observaciones','Observaciones','text','','maxlength="250"','','span-2')
  ),async f=>{
    const amount=cents(getV(f,'monto'));
    if(amount<1)throw new Error('El importe debe ser mayor que cero.');
    const refreshed=await Promise.all([
      pb.collection('pagos').getFullList({filter:pb.filter('orden = {:id}',{id}),requestKey:null}),
      pb.collection('trabajos').getFullList({filter:pb.filter('orden = {:id}',{id}),requestKey:null}),
      pb.collection('orden_repuestos').getFullList({filter:pb.filter('orden = {:id}',{id}),requestKey:null}),
    ]);
    const [pays,works,parts]=refreshed;
    const total=works.reduce((s,x)=>s+x.precio_centavos,0)+parts.reduce((s,x)=>s+x.cantidad*x.precio_unitario_centavos,0);
    const remaining=total-pays.reduce((s,x)=>s+x.monto_centavos,0);
    if(amount>remaining)throw new Error(`El pago supera el saldo pendiente (${money(remaining)}).`);
    await pb.collection('pagos').create({orden:id,monto_centavos:amount,fecha_pago:fromDateInput(getV(f,'fecha_pago')),
      medio_pago:getV(f,'medio_pago'),observaciones:getV(f,'observaciones')});
    await updateAndRender('Pago registrado.');
  },'Registrar pago');
}

// --- Eventos ---
document.querySelector('#close-modal').addEventListener('click',()=>dialog.close());
document.querySelector('#cancel-modal').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{onSubmitModal=null;document.querySelector('#modal-form').reset();});
document.querySelector('#modal-form').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!onSubmitModal || state.working)return;
  const cb=onSubmitModal, submit=document.querySelector('#submit-modal'),original=submit.textContent;
  state.working=true; submit.disabled=true;submit.textContent='Guardando…';
  try{await cb(new FormData(e.currentTarget));dialog.close();}
  catch(err){console.error(err);toastMsg(userError(err),true);}
  finally{state.working=false;submit.disabled=false;submit.textContent=original;}
});
document.addEventListener('submit',async e=>{
  if(e.target.id!=='login-form')return;
  e.preventDefault();
  const data=new FormData(e.target),btn=e.target.querySelector('[type="submit"]'),errEl=e.target.querySelector('#login-error');
  btn.disabled=true;errEl.classList.add('hidden');
  try{
    await pb.collection('users').authWithPassword(getV(data,'email'),getV(data,'password'));
    if(!pb.authStore.record.activo)throw new Error('La cuenta está deshabilitada.');
    state.page='dashboard';await fetchData();render();
  }catch(err){pb.authStore.clear();errEl.textContent='No se pudo iniciar sesión. Revisa correo, contraseña y que activo sea true.';errEl.classList.remove('hidden');console.error(err);}
  finally{btn.disabled=false;}
});
document.addEventListener('input',e=>{
  if(!e.target.matches('[data-table-search]'))return;
  const val=norm(e.target.value);
  const card=e.target.closest('.card');
  card?.querySelectorAll('tbody tr').forEach(row=>{row.style.display=(row.dataset.search||norm(row.textContent)).includes(val)?'':'none';});
});
document.addEventListener('change',e=>{
  if(e.target.id==='order-status-filter'){state.statusFilter=e.target.value;render();}
});
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b||state.working)return;
  const action=b.dataset.action,id=b.dataset.id;
  try{
    if(action==='nav'){state.page=b.dataset.page;state.selectedOrder=null;state.selectedClient=null;state.selectedVehicle=null;render();window.scrollTo(0,0);return;}
    if(action==='toggle-menu'){app.querySelector('.layout')?.classList.toggle('menu-open');return;}
    if(action==='close-menu'){app.querySelector('.layout')?.classList.remove('menu-open');return;}
    if(action==='logout'){pb.authStore.clear();state.data={};state.page='dashboard';render();return;}
    if(action==='refresh'){await updateAndRender();return;}
    if(action==='to-orders'){state.page='ordenes';render();return;}
    if(action==='to-inventory'){state.page='inventario';render();return;}
    if(action==='new-client'&&isPersonal())return openClientForm();
    if(action==='edit-client'&&isPersonal())return openClientForm(id);
    if(action==='new-vehicle'&&isPersonal())return openVehicleForm();
    if(action==='edit-vehicle'&&isPersonal())return openVehicleForm(id);
    if(action==='new-order'&&isPersonal())return openOrderForm(b.dataset.vehiculo||'');
    if(action==='edit-order'&&isPersonal())return openOrderForm('',id);
    if(action==='new-part'&&isPersonal())return openPartForm();
    if(action==='edit-part'&&isPersonal())return openPartForm(id);
    if(action==='replenish'&&isPersonal())return openReplenishForm(id);
    if(action==='new-work')return openWorkForm(id);
    if(action==='diagnosis')return openDiagnosisForm(id);
    if(action==='new-consumption')return openConsumptionForm(id);
    if(action==='new-payment'&&isPersonal())return openPaymentForm(id);
    if(action==='client-detail'){state.page='clientes';state.selectedClient=id;render();window.scrollTo(0,0);return;}
    if(action==='vehicle-detail'){state.page='vehiculos';state.selectedVehicle=id;render();window.scrollTo(0,0);return;}
    if(action==='order-detail'){state.page='ordenes';state.selectedOrder=id;render();window.scrollTo(0,0);return;}
    if(action==='back-clients'){state.selectedClient=null;render();return;}
    if(action==='back-vehicles'){state.selectedVehicle=null;render();return;}
    if(action==='back-orders'){state.selectedOrder=null;render();return;}
    if(action==='apply-dates'){
      const from=document.querySelector('#date-from').value,to=document.querySelector('#date-to').value;
      if(!from||!to||from>to)throw new Error('Elige un intervalo de fechas válido.');
      state.reportFrom=from;state.reportTo=to;render();return;
    }
    if(action==='advance-order'){
      const o=byId('ordenes',id),next=NEXT_STATE[o?.estado];
      if(!next||!canModifyOrder(o))return;
      // La orden puede seguir avanzando sin cobrar durante el diagnóstico/reparación,
      // pero NO puede entregarse sin registrar al menos un abono.
      // El mecánico no tiene acceso a pagos: la entrega la confirma recepción/dueño.
      if(next==='entregada'){
        if(!isPersonal())throw new Error('Solo recepción o el dueño pueden confirmar la entrega.');
        // Consultar el servidor y no solo los datos en memoria, por si otro usuario
        // registró un pago después de la última actualización de esta pantalla.
        const pagosActuales=await pb.collection('pagos').getFullList({
          filter:pb.filter('orden = {:id}',{id}),requestKey:null,
        });
        const totalAbonado=pagosActuales.reduce((s,p)=>s+Number(p.monto_centavos||0),0);
        if(totalAbonado<=0){
          throw new Error('No se puede entregar la orden sin un pago registrado. Registra al menos un abono antes de continuar.');
        }
      }
      if(!confirm(`¿Cambiar estado a "${STATE_LABELS[next]}"?`))return;
      const payload={estado:next};
      if(next==='entregada')payload.fecha_entrega=new Date().toISOString();
      await pb.collection('ordenes').update(id,payload);
      await updateAndRender(`La orden ahora está: ${STATE_LABELS[next]}.`);
      return;
    }
    if(action==='cancel-order'){
      const o=byId('ordenes',id);
      if(!isPersonal()||!canModifyOrder(o))return;
      if(coll('trabajos').some(x=>x.orden===id)||coll('orden_repuestos').some(x=>x.orden===id)||coll('pagos').some(x=>x.orden===id))throw new Error('No se puede cancelar una orden con trabajos, consumos o pagos.');
      if(!confirm('¿Cancelar esta orden? Esta acción no se podrá revertir desde la interfaz.'))return;
      await pb.collection('ordenes').update(id,{estado:'cancelada'});
      await updateAndRender('Orden cancelada.');
    }
  }catch(err){console.error(err);toastMsg(userError(err),true);}
});

// --- Arranque ---
async function boot(){
  try {
    const {default:PocketBase}=await import('../vendor/pocketbase.es.mjs');
    pb = new PocketBase(API_URL);
    pb.autoCancellation(false);
    if(pb.authStore.isValid){
      try{await pb.collection('users').authRefresh();await fetchData();}
      catch(e){console.warn('Sesión no válida o sin acceso:',e);pb.authStore.clear();}
    }
    render();
  } catch(error) {
    console.error(error);
    app.innerHTML=`<main class="loading-screen" style="padding:28px"><div class="card" style="max-width:560px"><h2>No se pudo cargar el SDK de PocketBase</h2>
      <p class="mt-2 muted" style="line-height:1.7">Copia el archivo oficial <code>pocketbase.es.mjs</code> de la versión 0.28.1 en <code>client/vendor/</code>.
      Consulta <code>client/README.md</code> o ejecuta el comando de instalación indicado allí. Después, actualiza esta página.</p>
      <p class="mt-2"><strong>Servidor esperado:</strong> ${API_URL}</p></div></main>`;
  }
}
boot();
