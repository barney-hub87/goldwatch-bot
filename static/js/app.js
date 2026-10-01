const formatPrice = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
};

const setText = (id, value) => {
  const node = document.getElementById(id);
  if (node) node.textContent = value == null || value === '' ? '—' : String(value);
};

const updateTime = () => {
  const node = document.getElementById('last-updated');
  if (node) node.textContent = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date());
};

const renderTimeframes = (timeframes) => {
  const tbody = document.getElementById('timeframe-rows');
  if (!tbody) return;
  tbody.replaceChildren();
  Object.entries(timeframes || {}).forEach(([frame, details]) => {
    const row = document.createElement('tr');
    const values = [frame, details.trend || '—', details.rsi ?? '—', details.macd || '—', details.ema20 || details.ema200 || '—'];
    values.forEach((value, index) => {
      const cell = document.createElement('td');
      if (index === 0) {
        cell.className = 'timeframe-cell';
        cell.textContent = value;
      } else if (index === 1) {
        const badge = document.createElement('span');
        badge.className = 'trend-pill';
        badge.textContent = value;
        cell.append(badge);
      } else {
        cell.textContent = value;
      }
      row.append(cell);
    });
    tbody.append(row);
  });
  if (!tbody.children.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'empty-row';
    cell.textContent = 'No timeframe details available.';
    row.append(cell);
    tbody.append(row);
  }
};

const renderLevels = (levels) => {
  const list = document.getElementById('levels-list');
  if (!list) return;
  const labels = { pivot: 'Pivot', r1: 'Resistance 1', s1: 'Support 1', pdh: 'Previous day high', pdl: 'Previous day low' };
  list.replaceChildren();
  Object.entries(labels).forEach(([key, label]) => {
    if (levels?.[key] == null) return;
    const row = document.createElement('div');
    const isResistance = key === 'r1' || key === 'pdh';
    const isSupport = key === 's1' || key === 'pdl';
    row.className = 'level-row' + (isResistance ? ' resistance' : '') + (isSupport ? ' support' : '');
    const name = document.createElement('span');
    name.className = 'level-name';
    const swatch = document.createElement('span');
    swatch.className = 'level-swatch';
    const labelText = document.createElement('span');
    labelText.textContent = label;
    name.append(swatch, labelText);
    const value = document.createElement('strong');
    value.textContent = formatPrice(levels[key]);
    row.append(name, value);
    list.append(row);
  });
};

const renderReasons = (reasons) => {
  const list = document.getElementById('reasons-list');
  if (!list) return;
  list.replaceChildren();
  (Array.isArray(reasons) ? reasons : []).forEach((reason) => {
    const item = document.createElement('li');
    const check = document.createElement('span');
    check.className = 'reason-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '✓';
    const text = document.createElement('span');
    text.textContent = reason;
    item.append(check, text);
    list.append(item);
  });
};

const renderSignal = (signal) => {
  const confidence = Math.max(0, Math.min(100, Number(signal.confidence) || 0));
  setText('current-price', '$' + formatPrice(signal.current_price));
  setText('map-current', formatPrice(signal.current_price));
  setText('market-direction', signal.direction || '—');
  setText('setup-direction', signal.direction || '—');
  setText('market-status', String(signal.status || 'Signal available').replaceAll('_', ' '));
  setText('confidence-value', confidence);
  setText('setup-confidence-value', confidence);
  setText('setup-status', String(signal.status || 'Signal').replaceAll('_', ' '));
  setText('entry-zone', signal.entry_zone || '—');
  setText('rr-ratio', signal.rr_ratio || '—');
  setText('stop-loss', formatPrice(signal.stop_loss));
  setText('target-one', formatPrice(signal.tp1));
  setText('target-two', formatPrice(signal.tp2));
  const meter = document.getElementById('confidence-meter');
  if (meter) meter.style.width = confidence + '%';
  renderTimeframes(signal.timeframes);
  renderLevels(signal.levels);
  renderReasons(signal.reasons);
};

const loadSignal = async () => {
  const button = document.getElementById('refresh-button');
  const alert = document.getElementById('load-error');
  if (button) {
    button.classList.add('is-loading');
    button.disabled = true;
  }
  if (alert) alert.hidden = true;
  try {
    const response = await fetch('/api/signal', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Signal request failed');
    renderSignal(await response.json());
    updateTime();
  } catch (error) {
    if (alert) alert.hidden = false;
    console.error('Unable to load signal data:', error);
  } finally {
    if (button) {
      button.classList.remove('is-loading');
      button.disabled = false;
    }
  }
};

const setupRiskCalculator = () => {
  const form = document.getElementById('risk-form');
  if (!form) return;
  const button = document.getElementById('calculate-button');
  const error = document.getElementById('risk-error');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (error) error.hidden = true;
    const formData = new FormData(form);
    const payload = {
      balance: Number(formData.get('balance')),
      risk_pct: Number(formData.get('risk_pct')),
      sl_points: Number(formData.get('sl_points'))
    };
    if (button) button.disabled = true;
    try {
      const response = await fetch('/api/calculate-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to calculate position size.');
      setText('recommended-lot', Number(result.recommended_lot).toFixed(2));
      setText('risk-amount', '$' + formatPrice(result.risk_amount));
    } catch (requestError) {
      if (error) {
        error.textContent = requestError.message || 'Unable to calculate position size.';
        error.hidden = false;
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refresh-button')?.addEventListener('click', loadSignal);
  setupRiskCalculator();
  loadSignal();
});

