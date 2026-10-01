/* =========================================================
   Frango do Mindu PDV V1.2
   Desenvolvido por Daniel Marques via IA
   ========================================================= */

const money = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const today = () => new Date().toISOString().slice(0, 10);

/* ---------------- DADOS DE DEMONSTRAÇÃO ---------------- */
const defaultProducts = [
  { id: 1, name: 'Frango Assado', category: 'Frangos', price: 35, cost: 20, stock: 50, minStock: 10, unit: 'un', emoji: '🍗', active: true, code: 'FRA001', image: '', type: 'normal', components: [] },
  { id: 2, name: 'Meio Frango', category: 'Frangos', price: 20, cost: 12, stock: 50, minStock: 10, unit: 'un', emoji: '🍗', active: true, code: 'FRA002', image: '', type: 'normal', components: [] },
  { id: 3, name: 'Frango Completo', category: 'Frangos', price: 40, cost: 24, stock: 40, minStock: 10, unit: 'un', emoji: '🍗', active: true, code: 'FRA003', image: '', type: 'normal', components: [] },
  { id: 4, name: 'Batata Frita', category: 'Porções', price: 15, cost: 7, stock: 80, minStock: 15, unit: 'un', emoji: '🍟', active: true, code: 'POR001', image: '', type: 'normal', components: [] },
  { id: 5, name: 'Farofa', category: 'Acompanhamentos', price: 8, cost: 3, stock: 80, minStock: 15, unit: 'un', emoji: '🥣', active: true, code: 'ACO001', image: '', type: 'normal', components: [] },
  { id: 6, name: 'Arroz', category: 'Acompanhamentos', price: 10, cost: 4, stock: 80, minStock: 15, unit: 'un', emoji: '🍚', active: true, code: 'ACO002', image: '', type: 'normal', components: [] },
  { id: 7, name: 'Feijão', category: 'Acompanhamentos', price: 10, cost: 4, stock: 80, minStock: 15, unit: 'un', emoji: '🫘', active: true, code: 'ACO003', image: '', type: 'normal', components: [] },
  { id: 8, name: 'Coca-Cola 2L', category: 'Bebidas', price: 13, cost: 8, stock: 60, minStock: 12, unit: 'un', emoji: '🥤', active: true, code: 'BEB001', image: '', type: 'normal', components: [] },
  { id: 9, name: 'Coca-Cola Lata', category: 'Bebidas', price: 6, cost: 3, stock: 100, minStock: 20, unit: 'un', emoji: '🥤', active: true, code: 'BEB002', image: '', type: 'normal', components: [] },
  { id: 10, name: 'Guaraná 2L', category: 'Bebidas', price: 11, cost: 7, stock: 60, minStock: 12, unit: 'un', emoji: '🥤', active: true, code: 'BEB003', image: '', type: 'normal', components: [] },
  { id: 11, name: 'Água', category: 'Bebidas', price: 4, cost: 1.5, stock: 100, minStock: 20, unit: 'un', emoji: '💧', active: true, code: 'BEB004', image: '', type: 'normal', components: [] },
  { id: 12, name: 'Suco Natural', category: 'Bebidas', price: 8, cost: 3, stock: 60, minStock: 12, unit: 'un', emoji: '🧃', active: true, code: 'BEB005', image: '', type: 'normal', components: [] }
];

const demo = () => ({
  products: JSON.parse(JSON.stringify(defaultProducts)),
  categories: ['Frangos', 'Porções', 'Acompanhamentos', 'Bebidas'],
  orders: [],
  moves: [],
  stockMoves: [],
  clients: [],
  delivery: [],
  cashOpen: true,
  opening: 100,
  cashOpenedAt: new Date().toISOString(),
  config: { name: 'Frango do Mindu', address: '', phone: '', info: 'Sabor em cada pedacinho!' }
});

/* ---------------- BANCO LOCAL ---------------- */
let db = JSON.parse(localStorage.getItem('frangoMinduDB_v11') || 'null') || demo();
if (!db.categories) db.categories = [...new Set(db.products.map(p => p.category))];
if (!db.clients) db.clients = [];
if (!db.delivery) db.delivery = [];
if (!db.stockMoves) db.stockMoves = [];

/* --------- MIGRAÇÃO V1.1 → V1.2 --------- */
db.products.forEach(p => {
  if (p.type === undefined) p.type = 'normal';
  if (p.code === undefined || p.code === '') p.code = gerarCodigo(p.category);
  if (p.image === undefined) p.image = '';
  if (p.components === undefined) p.components = [];
});

let cart = [];
let category = 'Todos';

const save = () => localStorage.setItem('frangoMinduDB_v11', JSON.stringify(db));
const nextOrder = () => String(db.orders.length + 1).padStart(6, '0');
const qs = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

/* ---------------- CLOCK ---------------- */
function renderClock() {
  qs('clock').textContent = new Date().toLocaleString('pt-BR');
  qs('cashStatus').textContent = db.cashOpen ? 'Caixa aberto' : 'Caixa fechado';
}
setInterval(renderClock, 1000);
renderClock();

/* ---------------- NAVEGAÇÃO ---------------- */
const titles = {
  dashboard: 'Dashboard', venda: 'Nova venda', pedidos: 'Pedidos', produtos: 'Produtos',
  categorias: 'Categorias', estoque: 'Estoque', caixa: 'Caixa', clientes: 'Clientes',
  delivery: 'Delivery', cozinha: 'Cozinha', relatorios: 'Relatórios', config: 'Configurações'
};

document.querySelectorAll('.nav').forEach(b => b.onclick = () => showPage(b.dataset.page));

function showPage(page) {
  document.querySelectorAll('.nav').forEach(x => x.classList.toggle('active', x.dataset.page === page));
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active-page'));
  qs('page-' + page).classList.add('active-page');
  qs('pageTitle').textContent = titles[page] || page;
  ({
    dashboard: renderDashboard,
    venda: () => { renderCats(); renderProducts(); renderCart(); },
    pedidos: renderOrders,
    produtos: renderProductsTable,
    categorias: renderCategories,
    estoque: renderStock,
    caixa: renderCash,
    clientes: renderClients,
    delivery: renderDelivery,
    cozinha: renderKitchen,
    relatorios: renderReports,
    config: renderConfig
  }[page] || (() => {}))();
}

/* =========================================================
   HELPERS: código automático, validação e imagem comprimida
   ========================================================= */
function gerarCodigo(categoria) {
  const prefixo = (categoria || 'PRD').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'PRD';
  const usados = db.products
    .map(p => p.code || '')
    .filter(c => c.startsWith(prefixo))
    .map(c => parseInt(c.replace(prefixo, ''), 10))
    .filter(n => !isNaN(n));
  const proximo = (usados.length ? Math.max(...usados) : 0) + 1;
  return prefixo + String(proximo).padStart(3, '0');
}

function codigoJaExiste(codigo, idIgnorar = null) {
  if (!codigo) return false;
  return db.products.some(p => p.code === codigo && p.id !== idIgnorar);
}

function fileToCompressedDataURL(file, maxSize = 200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (!file.type.startsWith('image/')) return reject(new Error('Arquivo não é uma imagem.'));
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
        else if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}

/* =========================================================
   TELA DE VENDA
   ========================================================= */
function renderCats() {
  let cats = ['Todos', ...db.categories.filter(c => c)];
  qs('cats').innerHTML = cats.map(c => `<button class="cat ${c === category ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  document.querySelectorAll('.cat').forEach(b => b.onclick = () => { category = b.dataset.cat; renderCats(); renderProducts(); });
}

function renderProducts() {
  let q = (qs('search').value || '').toLowerCase();
  let ps = db.products.filter(p =>
    p.active !== false &&
    (category === 'Todos' || p.category === category) &&
    (p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q))
  );
  qs('productGrid').innerHTML = ps.map(p => {
    const visual = p.image
      ? `<img src="${p.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px">`
      : `<span class="emoji">${p.emoji || '🍗'}</span>`;
    const info = p.type === 'combo' ? '🍱 Combo' : `Estoque: ${p.stock}`;
    return `<button class="product" data-id="${p.id}">
      ${visual}
      <b>${esc(p.name)}</b>
      ${p.code ? `<small style="color:#888">${esc(p.code)}</small>` : ''}
      <span class="price">${money(p.price)}</span>
      <small style="color:#777">${info}</small>
    </button>`;
  }).join('') || '<div class="empty">Nenhum produto encontrado.</div>';
  document.querySelectorAll('.product').forEach(b => b.onclick = () => addCart(+b.dataset.id));
}

function addCart(id) {
  const p = db.products.find(x => x.id === id);
  if (!p) return;
  if (p.type !== 'combo' && p.stock <= 0) return alert('Produto sem estoque.');
  let x = cart.find(i => i.id === id);
  if (x) x.qty++;
  else cart.push({ id, qty: 1 });
  renderCart();
}

function renderCart() {
  let el = qs('cart');
  if (!cart.length) el.innerHTML = '<div class="empty">Seu pedido está vazio.<br>Selecione os produtos ao lado.</div>';
  else el.innerHTML = cart.map(i => {
    const p = db.products.find(x => x.id === i.id);
    return `<div class="cart-item">
      <div><b>${esc(p.name)}</b><br><small>${money(p.price)} cada • ${money(p.price * i.qty)}</small></div>
      <div class="qty">
        <button data-action="minus" data-id="${i.id}">−</button>
        <b>${i.qty}</b>
        <button data-action="plus" data-id="${i.id}">+</button>
      </div>
    </div>`;
  }).join('');
  document.querySelectorAll('.qty button').forEach(b => b.onclick = () => {
    let i = cart.find(x => x.id == b.dataset.id);
    if (b.dataset.action === 'plus') i.qty++;
    else i.qty--;
    if (i.qty <= 0) cart = cart.filter(x => x !== i);
    renderCart();
  });
  let sub = cart.reduce((s, i) => s + db.products.find(p => p.id === i.id).price * i.qty, 0);
  let d = Math.max(0, Number(qs('discount').value) || 0);
  qs('subtotal').textContent = money(sub);
  qs('total').textContent = money(Math.max(0, sub - d));
}

qs('search').oninput = renderProducts;
qs('discount').oninput = renderCart;
qs('clearCart').onclick = () => { cart = []; renderCart(); };

/* ---------------- MODAL GENÉRICO ---------------- */
function openModal(html) { qs('modalBody').innerHTML = html; qs('modal').classList.remove('hidden'); }
function closeModal() { qs('modal').classList.add('hidden'); }
qs('modalClose').onclick = closeModal;

/* ---------------- PAGAMENTO ---------------- */
qs('payBtn').onclick = () => {
  if (!cart.length) return alert('Adicione produtos ao pedido.');
  if (!db.cashOpen) return alert('Abra o caixa antes de vender.');
  let sub = cart.reduce((s, i) => s + db.products.find(p => p.id === i.id).price * i.qty, 0);
  let discount = Math.max(0, Number(qs('discount').value) || 0);
  let total = Math.max(0, sub - discount);
  openModal(`<h2>Finalizar pedido #${nextOrder()}</h2>
    <p>Subtotal: ${money(sub)} • Desconto: ${money(discount)}</p>
    <h2 style="color:#ffc400">${money(total)}</h2>
    <div class="payment-grid">
      ${['Dinheiro', 'PIX', 'Débito', 'Crédito'].map(x => `<button class="payment" data-pay="${x}">${x}</button>`).join('')}
    </div>
    <div id="cashPay"></div>`);
  document.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => finishSale(b.dataset.pay, total, discount));
};

function finishSale(method, total, discount) {
  if (method === 'Dinheiro') {
    qs('cashPay').innerHTML = `<div class="change">
      <label>Valor recebido
        <input id="received" type="number" min="${total}" step="0.01" style="width:100%;margin-top:8px;background:#111;color:#fff;border:1px solid #444;padding:10px;border-radius:7px">
      </label>
      <button class="primary full" id="confirmCash">Confirmar pagamento</button>
    </div>`;
    qs('confirmCash').onclick = () => {
      let r = Number(qs('received').value);
      if (r < total) return alert('Valor recebido insuficiente.');
      completeSale(method, total, r - total, discount);
    };
  } else completeSale(method, total, 0, discount);
}

function completeSale(method, total, change, discount) {
  // Validação de estoque (inclusive componentes de combos)
  for (const item of cart) {
    const p = db.products.find(x => x.id === item.id);
    if (p.type === 'combo') {
      for (const c of (p.components || [])) {
        const prod = db.products.find(x => x.id === c.productId);
        if (prod && prod.stock < c.qty * item.qty) {
          return alert(`Estoque insuficiente de "${prod.name}" para o combo "${p.name}".`);
        }
      }
    } else if (p.stock < item.qty) {
      return alert(`Estoque insuficiente de "${p.name}".`);
    }
  }

  const order = {
    id: nextOrder(),
    date: new Date().toISOString(),
    items: cart.map(i => ({ ...i })),
    subtotal: cart.reduce((s, i) => s + db.products.find(p => p.id === i.id).price * i.qty, 0),
    discount, total, method, change,
    note: qs('saleNote').value.trim(),
    status: 'Recebido'
  };
  db.orders.push(order);

  // Baixa de estoque (combo baixa nos componentes)
  cart.forEach(i => {
    const p = db.products.find(x => x.id === i.id);
    if (p.type === 'combo') {
      (p.components || []).forEach(c => {
        const prod = db.products.find(x => x.id === c.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - c.qty * i.qty);
          db.stockMoves.push({
            date: new Date().toISOString(),
            type: 'saída',
            product: prod.name,
            qty: c.qty * i.qty,
            description: `Venda #${order.id} (combo ${p.name})`
          });
        }
      });
    } else {
      p.stock = Math.max(0, p.stock - i.qty);
      db.stockMoves.push({
        date: new Date().toISOString(),
        type: 'saída',
        product: p.name,
        qty: i.qty,
        description: 'Venda #' + order.id
      });
    }
  });

  db.moves.push({ date: new Date().toISOString(), type: 'venda', description: 'Venda #' + order.id, value: total, method });
  save();
  closeModal();
  cart = [];
  qs('discount').value = 0;
  qs('saleNote').value = '';
  qs('orderNo').textContent = '#' + nextOrder();
  renderCart();
  renderProducts();
  alert(`Venda #${order.id} registrada com sucesso!\nPagamento: ${method}\nTroco: ${money(change)}`);
}

/* =========================================================
   PEDIDOS
   ========================================================= */
function renderOrders() {
  let q = (qs('orderSearch').value || '').toLowerCase();
  let os = db.orders.filter(o => o.id.includes(q));
  qs('ordersTable').innerHTML = `<table><thead><tr>
    <th>Pedido</th><th>Data</th><th>Itens</th><th>Pagamento</th><th>Total</th><th>Status</th><th></th>
  </tr></thead><tbody>${os.slice().reverse().map(o => `<tr>
    <td>#${o.id}</td>
    <td>${new Date(o.date).toLocaleString('pt-BR')}</td>
    <td>${o.items.reduce((s, i) => s + i.qty, 0)}</td>
    <td>${esc(o.method)}</td>
    <td><b>${money(o.total)}</b></td>
    <td><span class="tag">${esc(o.status || 'Recebido')}</span></td>
    <td>
      <button class="small-btn" data-view="${o.id}">Detalhes</button>
      <button class="small-btn" data-cancel="${o.id}">Cancelar</button>
    </td>
  </tr>`).join('')}</tbody></table>`;
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => viewOrder(b.dataset.view));
  document.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => cancelOrder(b.dataset.cancel));
}

function viewOrder(id) {
  let o = db.orders.find(x => x.id === id);
  openModal(`<h2>Pedido #${o.id}</h2>
    ${o.items.map(i => { let p = db.products.find(x => x.id === i.id); return `<p>${i.qty}x ${esc(p?.name || 'Produto')} — ${money((p?.price || 0) * i.qty)}</p>`; }).join('')}
    <hr>
    <p>Subtotal: ${money(o.subtotal)}</p>
    <p>Desconto: ${money(o.discount)}</p>
    <h3>Total: ${money(o.total)}</h3>
    <p>Pagamento: ${esc(o.method)} • Troco: ${money(o.change)}</p>
    <p>Observação: ${esc(o.note || '-')}</p>`);
}

function cancelOrder(id) {
  let o = db.orders.find(x => x.id === id);
  if (!o || o.cancelled) return;
  if (!confirm(`Cancelar o pedido #${id}?`)) return;
  o.cancelled = true;
  o.status = 'Cancelado';

  // Devolve estoque (inclusive componentes de combo)
  o.items.forEach(i => {
    let p = db.products.find(x => x.id === i.id);
    if (!p) return;
    if (p.type === 'combo') {
      (p.components || []).forEach(c => {
        const prod = db.products.find(x => x.id === c.productId);
        if (prod) {
          prod.stock += c.qty * i.qty;
          db.stockMoves.push({
            date: new Date().toISOString(),
            type: 'entrada',
            product: prod.name,
            qty: c.qty * i.qty,
            description: `Cancelamento #${id} (combo ${p.name})`
          });
        }
      });
    } else {
      p.stock += i.qty;
      db.stockMoves.push({
        date: new Date().toISOString(),
        type: 'entrada',
        product: p.name,
        qty: i.qty,
        description: 'Cancelamento #' + id
      });
    }
  });

  db.moves.push({ date: new Date().toISOString(), type: 'sangria', description: 'Cancelamento #' + id, value: o.total });
  save();
  renderOrders();
  renderDashboard();
  renderCash();
}

qs('orderSearch').oninput = renderOrders;

qs('exportOrders').onclick = () => {
  let rows = [['Pedido', 'Data', 'Pagamento', 'Total', 'Status']].concat(
    db.orders.map(o => [o.id, new Date(o.date).toLocaleString('pt-BR'), o.method, o.total, o.status || 'Recebido'])
  );
  let csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n');
  let a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'pedidos-frango-do-mindu.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};

/* =========================================================
   PRODUTOS
   ========================================================= */
function renderProductsTable() {
  let q = (qs('productSearch').value || '').toLowerCase();
  let ps = db.products.filter(p =>
    p.name.toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q)
  );
  qs('productsTable').innerHTML = `<table><thead><tr>
    <th>Produto</th><th>Código</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Tipo</th><th>Status</th><th>Ações</th>
  </tr></thead><tbody>${ps.map(p => `<tr>
    <td>
      ${p.image
        ? `<img src="${p.image}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:6px">`
        : (p.emoji || '🍗')}
      ${esc(p.name)}
    </td>
    <td><code>${esc(p.code || '—')}</code></td>
    <td>${esc(p.category)}</td>
    <td>${money(p.price)}</td>
    <td class="${p.type !== 'combo' && p.stock <= p.minStock ? 'low' : ''}">${p.type === 'combo' ? '—' : p.stock}</td>
    <td>${p.type === 'combo' ? '🍱 Combo' : 'Simples'}</td>
    <td>${p.active === false ? 'Inativo' : 'Ativo'}</td>
    <td>
      <button class="small-btn" data-edit="${p.id}">Editar</button>
      <button class="small-btn" data-toggle="${p.id}">${p.active === false ? 'Ativar' : 'Inativar'}</button>
      <button class="small-btn" data-del="${p.id}">Excluir</button>
    </td>
  </tr>`).join('')}</tbody></table>`;
  document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openProductForm(db.products.find(p => p.id === +b.dataset.edit)));
  document.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
    let p = db.products.find(p => p.id === +b.dataset.toggle);
    p.active = p.active === false;
    save(); renderProductsTable(); renderProducts();
  });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (confirm('Excluir este produto?')) {
      db.products = db.products.filter(p => p.id !== +b.dataset.del);
      save(); renderProductsTable(); renderCats(); renderProducts();
    }
  });
}

function openProductForm(p = null) {
  const ehCombo = p?.type === 'combo';
  const componentes = p?.components || [];

  openModal(`
    <h2>${p ? 'Editar' : 'Novo'} produto</h2>
    <div class="form-grid">
      <label>Nome<input id="fName" value="${esc(p?.name || '')}"></label>
      <label>Categoria<select id="fCat">${db.categories.map(c => `<option ${c === p?.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>

      <label>Código
        <div style="display:flex;gap:6px">
          <input id="fCode" value="${esc(p?.code || '')}" placeholder="Ex: FRA001">
          <button type="button" class="secondary" id="gerarCodigo" title="Gerar código">🎲</button>
        </div>
      </label>
      <label>Unidade<input id="fUnit" value="${esc(p?.unit || 'un')}"></label>

      <label>Preço<input id="fPrice" type="number" step="0.01" value="${p?.price || 0}"></label>
      <label>Custo<input id="fCost" type="number" step="0.01" value="${p?.cost || 0}"></label>
      <label>Estoque<input id="fStock" type="number" value="${p?.stock || 0}" ${ehCombo ? 'disabled' : ''}></label>
      <label>Estoque mínimo<input id="fMin" type="number" value="${p?.minStock || 0}" ${ehCombo ? 'disabled' : ''}></label>

      <label style="grid-column:span 2">Ícone do produto
        <input type="file" id="fImage" accept="image/*">
        <div style="display:flex;gap:12px;align-items:center;margin-top:8px">
          <img id="fPreview" src="${p?.image || ''}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid #444;${p?.image ? '' : 'display:none'}">
          <span class="muted">Deixe vazio para usar o emoji.</span>
        </div>
      </label>
      <label style="grid-column:span 2">Emoji (caso não use imagem)
        <input id="fEmoji" value="${esc(p?.emoji || '🍗')}" maxlength="4">
      </label>

      <label style="grid-column:span 2;display:flex;align-items:center;gap:10px;color:#ffc400">
        <input type="checkbox" id="fIsCombo" ${ehCombo ? 'checked' : ''} style="width:auto">
        <b>Este produto é um combo (agrupa outros produtos)</b>
      </label>
    </div>

    <div id="comboArea" style="${ehCombo ? '' : 'display:none'};margin-top:16px;background:#151515;border-radius:10px;padding:14px">
      <h3 style="margin-top:0">Componentes do combo</h3>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <select id="compSelect" style="flex:1">
          ${db.products.filter(x => x.type !== 'combo' && x.id !== p?.id).map(x => `<option value="${x.id}">${esc(x.name)} — ${money(x.price)}</option>`).join('')}
        </select>
        <input id="compQty" type="number" min="1" value="1" style="width:80px">
        <button type="button" class="secondary" id="addComp">Adicionar</button>
      </div>
      <ul id="compList" style="list-style:none;padding:0;margin:0"></ul>
      <p class="muted" style="margin-top:8px">Soma dos itens: <b id="compSum">R$ 0,00</b></p>
    </div>

    <div class="modal-actions">
      <button class="secondary" onclick="closeModal()">Cancelar</button>
      <button class="primary" id="saveProduct">Salvar</button>
    </div>
  `);

  let compsTemp = JSON.parse(JSON.stringify(componentes));

  qs('gerarCodigo').onclick = () => { qs('fCode').value = gerarCodigo(qs('fCat').value); };

  qs('fImage').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const dataUrl = await fileToCompressedDataURL(f);
      qs('fPreview').src = dataUrl;
      qs('fPreview').style.display = 'block';
      qs('fPreview').dataset.base64 = dataUrl;
    } catch (err) { alert(err.message); }
  };

  qs('fIsCombo').onchange = (e) => {
    qs('comboArea').style.display = e.target.checked ? 'block' : 'none';
    qs('fStock').disabled = e.target.checked;
    qs('fMin').disabled = e.target.checked;
  };

  function renderComps() {
    qs('compList').innerHTML = compsTemp.map((c, i) => {
      const prod = db.products.find(x => x.id === c.productId);
      return `<li style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #333">
        <span>${c.qty}x ${esc(prod?.name || 'Produto removido')}</span>
        <span>
          <b style="color:#ffc400;margin-right:12px">${money((prod?.price || 0) * c.qty)}</b>
          <button type="button" class="small-btn" data-rm="${i}">✕</button>
        </span>
      </li>`;
    }).join('') || '<li class="muted">Nenhum componente adicionado.</li>';
    const soma = compsTemp.reduce((s, c) => s + ((db.products.find(x => x.id === c.productId)?.price || 0) * c.qty), 0);
    qs('compSum').textContent = money(soma);
    qs('compList').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      compsTemp.splice(+b.dataset.rm, 1);
      renderComps();
    });
  }
  renderComps();

  qs('addComp').onclick = () => {
    const pid = +qs('compSelect').value;
    const qty = Math.max(1, Number(qs('compQty').value) || 1);
    if (!pid) return;
    const existente = compsTemp.find(c => c.productId === pid);
    if (existente) existente.qty += qty;
    else compsTemp.push({ productId: pid, qty });
    qs('compQty').value = 1;
    renderComps();
  };

  qs('saveProduct').onclick = () => {
    const isCombo = qs('fIsCombo').checked;
    const code = qs('fCode').value.trim().toUpperCase();
    const imgBase64 = qs('fPreview').dataset.base64 || p?.image || '';
    const data = {
      name: qs('fName').value.trim(),
      category: qs('fCat').value,
      code: code || gerarCodigo(qs('fCat').value),
      price: Number(qs('fPrice').value),
      cost: Number(qs('fCost').value),
      stock: isCombo ? 0 : Number(qs('fStock').value),
      minStock: isCombo ? 0 : Number(qs('fMin').value),
      unit: qs('fUnit').value.trim() || 'un',
      emoji: qs('fEmoji').value || '🍗',
      image: imgBase64,
      type: isCombo ? 'combo' : 'normal',
      components: isCombo ? compsTemp : [],
      active: p?.active !== false
    };

    if (!data.name) return alert('Informe o nome.');
    if (codigoJaExiste(data.code, p?.id)) return alert(`O código ${data.code} já está em uso.`);
    if (isCombo && compsTemp.length === 0) return alert('Adicione pelo menos um componente ao combo.');

    if (p) Object.assign(p, data);
    else db.products.push({ id: Date.now(), ...data });

    save();
    closeModal();
    renderProductsTable();
    renderCats();
    renderProducts();
  };
}

qs('addProduct').onclick = () => openProductForm();
qs('productSearch').oninput = renderProductsTable;

/* =========================================================
   CATEGORIAS
   ========================================================= */
function renderCategories() {
  qs('categoriesTable').innerHTML = `<table><thead><tr>
    <th>Categoria</th><th>Produtos</th><th>Ações</th>
  </tr></thead><tbody>${db.categories.map(c => `<tr>
    <td>${esc(c)}</td>
    <td>${db.products.filter(p => p.category === c).length}</td>
    <td>
      <button class="small-btn" data-cat-edit="${esc(c)}">Renomear</button>
      <button class="small-btn" data-cat-del="${esc(c)}">Excluir</button>
    </td>
  </tr>`).join('')}</tbody></table>`;
  document.querySelectorAll('[data-cat-edit]').forEach(b => b.onclick = () => {
    let old = b.dataset.catEdit;
    let n = prompt('Novo nome:', old);
    if (n && n.trim() && n !== old) {
      db.categories = db.categories.map(c => c === old ? n.trim() : c);
      db.products.forEach(p => { if (p.category === old) p.category = n.trim(); });
      save(); renderCategories(); renderCats(); renderProductsTable();
    }
  });
  document.querySelectorAll('[data-cat-del]').forEach(b => b.onclick = () => {
    let c = b.dataset.catDel;
    if (db.products.some(p => p.category === c)) return alert('A categoria possui produtos. Reclassifique-os antes de excluir.');
    db.categories = db.categories.filter(x => x !== c);
    save(); renderCategories(); renderCats();
  });
}

qs('addCategory').onclick = () => {
  let n = qs('categoryName').value.trim();
  if (!n) return alert('Informe a categoria.');
  if (db.categories.includes(n)) return alert('Categoria já existe.');
  db.categories.push(n);
  qs('categoryName').value = '';
  save(); renderCategories(); renderCats();
};

/* =========================================================
   ESTOQUE
   ========================================================= */
function stockMove(kind) {
  openModal(`<h2>${kind === 'entrada' ? 'Entrada de estoque' : kind === 'saída' ? 'Saída de estoque' : 'Ajuste de estoque'}</h2>
    <label>Produto
      <select id="sProd" style="width:100%;margin-top:7px;background:#111;color:#fff;border:1px solid #444;padding:10px;border-radius:7px">
        ${db.products.filter(p => p.type !== 'combo').map(p => `<option value="${p.id}">${esc(p.name)} — atual ${p.stock}</option>`).join('')}
      </select>
    </label>
    <label style="display:block;margin-top:12px">Quantidade
      <input id="sQty" type="number" min="1" value="1" style="width:100%;margin-top:7px;background:#111;color:#fff;border:1px solid #444;padding:10px;border-radius:7px">
    </label>
    <label style="display:block;margin-top:12px">Observação
      <input id="sDesc" style="width:100%;margin-top:7px;background:#111;color:#fff;border:1px solid #444;padding:10px;border-radius:7px">
    </label>
    <button class="primary full" id="doStock">Confirmar</button>`);
  qs('doStock').onclick = () => {
    let p = db.products.find(x => x.id === +qs('sProd').value);
    let q = Number(qs('sQty').value);
    if (!p || q <= 0) return alert('Informe uma quantidade válida.');
    let old = p.stock;
    if (kind === 'entrada') p.stock += q;
    else if (kind === 'saída') p.stock = Math.max(0, p.stock - q);
    else p.stock = q;
    db.stockMoves.push({ date: new Date().toISOString(), type: kind, product: p.name, qty: Math.abs(p.stock - old), description: qs('sDesc').value || kind });
    save(); closeModal(); renderStock(); renderProductsTable(); renderProducts(); renderDashboard();
  };
}

qs('stockEntry').onclick = () => stockMove('entrada');
qs('stockExit').onclick = () => stockMove('saída');
qs('stockAdjust').onclick = () => stockMove('ajuste');

function renderStock() {
  let low = db.products.filter(p => p.type !== 'combo' && p.stock <= p.minStock);
  qs('stockTable').innerHTML = `<p>Produtos em estoque baixo: <b class="${low.length ? 'low' : ''}">${low.length}</b></p>
    <table><thead><tr><th>Data</th><th>Tipo</th><th>Produto</th><th>Qtd.</th><th>Observação</th></tr></thead>
    <tbody>${db.stockMoves.slice().reverse().map(m => `<tr>
      <td>${new Date(m.date).toLocaleString('pt-BR')}</td>
      <td>${esc(m.type)}</td>
      <td>${esc(m.product)}</td>
      <td>${m.qty}</td>
      <td>${esc(m.description)}</td>
    </tr>`).join('') || '<tr><td colspan="5">Nenhuma movimentação.</td></tr>'}</tbody></table>`;
}

/* =========================================================
   CAIXA
   ========================================================= */
function cashBalance() {
  let sales = db.orders.filter(o => o.date.slice(0, 10) === today() && !o.cancelled).reduce((s, o) => s + o.total, 0);
  let en = db.moves.filter(m => m.date.slice(0, 10) === today() && m.type === 'entrada').reduce((s, m) => s + m.value, 0);
  let sang = db.moves.filter(m => m.date.slice(0, 10) === today() && m.type === 'sangria').reduce((s, m) => s + m.value, 0);
  return db.opening + sales + en - sang;
}

function renderCash() {
  let sales = db.orders.filter(o => o.date.slice(0, 10) === today() && !o.cancelled);
  let total = sales.reduce((s, o) => s + o.total, 0);
  let moves = db.moves.filter(m => m.date.slice(0, 10) === today());
  qs('cashCards').innerHTML = `
    <div class="card"><span>Abertura</span><strong>${money(db.opening)}</strong></div>
    <div class="card"><span>Vendas hoje</span><strong>${money(total)}</strong></div>
    <div class="card"><span>Pedidos</span><strong>${sales.length}</strong></div>
    <div class="card"><span>Saldo estimado</span><strong>${money(cashBalance())}</strong></div>`;
  qs('cashMoves').innerHTML = moves.slice().reverse().map(m => `<div class="move">
    <span>${esc(m.description)}<br><small>${new Date(m.date).toLocaleTimeString('pt-BR')}</small></span>
    <b class="${m.type === 'sangria' ? 'negative' : 'positive'}">${m.type === 'sangria' ? '−' : '+'}${money(m.value)}</b>
  </div>`).join('') || '<p style="color:#777">Nenhuma movimentação hoje.</p>';
}

function cashMove(type) {
  if (!db.cashOpen) return alert('Caixa está fechado.');
  openModal(`<h2>${type === 'entrada' ? 'Entrada de dinheiro' : 'Sangria'}</h2>
    <label>Valor<input id="moveValue" type="number" step="0.01" style="width:100%;margin-top:7px;background:#111;color:#fff;border:1px solid #444;padding:10px;border-radius:7px"></label>
    <label style="display:block;margin-top:12px">Descrição<input id="moveDesc" style="width:100%;margin-top:7px;background:#111;color:#fff;border:1px solid #444;padding:10px;border-radius:7px"></label>
    <button class="primary full" id="doMove">Confirmar</button>`);
  qs('doMove').onclick = () => {
    let v = Number(qs('moveValue').value);
    if (v <= 0) return alert('Informe um valor válido.');
    db.moves.push({ date: new Date().toISOString(), type, description: qs('moveDesc').value || type, value: v });
    save(); closeModal(); renderCash();
  };
}

qs('cashIn').onclick = () => cashMove('entrada');
qs('cashOut').onclick = () => cashMove('sangria');

qs('closeCash').onclick = () => {
  if (!db.cashOpen) return;
  if (confirm(`Fechar caixa com saldo estimado de ${money(cashBalance())}?`)) {
    db.cashOpen = false; save(); renderClock(); renderCash();
  }
};

qs('openCash').onclick = () => {
  if (db.cashOpen) return alert('O caixa já está aberto.');
  openModal(`<h2>Abrir caixa</h2>
    <label>Valor de abertura<input id="openingValue" type="number" step="0.01" value="0" style="width:100%;margin-top:7px;background:#111;color:#fff;border:1px solid #444;padding:10px;border-radius:7px"></label>
    <button class="primary full" id="doOpen">Abrir caixa</button>`);
  qs('doOpen').onclick = () => {
    db.opening = Number(qs('openingValue').value) || 0;
    db.cashOpen = true;
    db.cashOpenedAt = new Date().toISOString();
    save(); closeModal(); renderClock(); renderCash();
  };
};

/* =========================================================
   CLIENTES
   ========================================================= */
function renderClients() {
  let q = (qs('clientSearch').value || '').toLowerCase();
  let cs = db.clients.filter(c => (c.name + ' ' + c.phone + ' ' + (c.doc || '')).toLowerCase().includes(q));
  qs('clientsTable').innerHTML = `<table><thead><tr>
    <th>Nome</th><th>Telefone</th><th>CPF/CNPJ</th><th>Endereço</th><th>Ações</th>
  </tr></thead><tbody>${cs.map(c => `<tr>
    <td>${esc(c.name)}</td>
    <td>${esc(c.phone)}</td>
    <td>${esc(c.doc || '—')}</td>
    <td>${esc