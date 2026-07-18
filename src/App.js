import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
// ── Colours ──────────────────────────────────────────
const BLUE = '#2563eb';
const GREEN = '#059669';
const AMBER = '#d97706';
const RED = '#dc2626';
const NAVY = '#1F3864';

// ── KPI Card Component ────────────────────────────────
function KPICard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e6f0',
      borderRadius: 12,
      padding: '18px 20px',
      flex: 1,
      minWidth: 140
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || NAVY }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Tab Button Component ──────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        fontSize: 13,
        fontWeight: 500,
        border: 'none',
        borderBottom: active ? `2px solid ${BLUE}` : '2px solid transparent',
        background: 'none',
        color: active ? BLUE : '#6b7280',
        cursor: 'pointer'
      }}
    >
      {label}
    </button>
  );
}

// ── Main App ──────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [salesData, setSalesData] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [channelData, setChannelData] = useState([]);
  // hourlyData available for future use
  const [loading, setLoading] = useState(true);

  // Load all CSV files when app starts
  useEffect(() => {
    const loadCSV = (file) =>
      new Promise((resolve) => {
        Papa.parse(`/${file}`, {
          download: true,
          header: true,
          dynamicTyping: true,
          complete: (result) => resolve(result.data.filter(r => r.Date || r.Channel || r.Item || r.hour))
        });
      });

    Promise.all([
      loadCSV('fact_sales_overview.csv'),
      loadCSV('dim_menu_items.csv'),
      loadCSV('dim_channels.csv'),
      loadCSV('fact_hourly_sales.csv')
    ]).then(([sales, menu, channels, hourly]) => {
      setSalesData(sales);
      setMenuData(menu.filter(m => m.Net_Sales > 0).sort((a, b) => b.Net_Sales - a.Net_Sales));
      setChannelData(channels);
      //setHourlyData(hourly);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Arial' }}>
      <p style={{ color: '#6b7280' }}>Loading Goomti data...</p>
    </div>
  );

  // ── Calculated values ──
  const totalSales = salesData.reduce((s, r) => s + (r.Net_Sales || 0), 0);
  const totalOrders = salesData.reduce((s, r) => s + (r.Orders || 0), 0);
  const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
  const weekendSales = salesData
    .filter(r => ['Friday', 'Saturday', 'Sunday'].includes(r.Day_of_Week))
    .reduce((s, r) => s + (r.Net_Sales || 0), 0);

  // DoW aggregation
  const dowOrder = ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dowData = dowOrder.map(day => ({
    day: day.slice(0, 3),
    sales: salesData.filter(r => r.Day_of_Week === day).reduce((s, r) => s + (r.Net_Sales || 0), 0)
  }));

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f4f6fb', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e6f0', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #c9a96e, #a07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>G</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Goomti Restaurant</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>Sales Analytics Dashboard</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', background: '#f4f6fb', border: '1px solid #e2e6f0', padding: '4px 12px', borderRadius: 20 }}>
          May–Jun 2026
        </div>
      </div>

      {/* Nav Tabs */}
      <div style={{ background: '#fff', borderBottom: '2px solid #e2e6f0', padding: '0 28px', display: 'flex' }}>
        {['overview', 'channels', 'menu', 'customers'].map(page => (
          <Tab key={page} label={page.charAt(0).toUpperCase() + page.slice(1)} active={activePage === page} onClick={() => setActivePage(page)} />
        ))}
      </div>

      {/* Pages */}
      <div style={{ padding: 24 }}>

        {/* ── OVERVIEW PAGE ── */}
        {activePage === 'overview' && (
          <div>
            <h2 style={{ marginBottom: 16, color: NAVY }}>Business Overview</h2>

            {/* KPI Row */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
              <KPICard label="Total Net Sales" value={`£${totalSales.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`} sub="all channels" color={BLUE} />
              <KPICard label="Total Orders" value={totalOrders.toFixed(0)} sub="30-day period" />
              <KPICard label="Avg Order Value" value={`£${aov.toFixed(2)}`} sub="net ÷ orders" color={GREEN} />
              <KPICard label="Weekend Revenue" value={`£${weekendSales.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`} sub="Fri–Sun" color={AMBER} />
            </div>

            {/* Daily Sales Chart */}
            <div style={{ background: '#fff', border: '1px solid #e2e6f0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Daily Net Sales</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>All channels · May–Jun 2026</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="Date" tick={{ fontSize: 9 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${v}`} />
                  <Tooltip formatter={v => [`£${v.toFixed(2)}`, 'Net Sales']} />
                  <Bar dataKey="Net_Sales" radius={[3, 3, 0, 0]}>
                    {salesData.map((entry, i) => (
                      <Cell key={i} fill={entry.Net_Sales > 1000 ? GREEN : BLUE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* DoW Chart */}
            <div style={{ background: '#fff', border: '1px solid #e2e6f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Revenue by Day of Week</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>Average across the period</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${v}`} />
                  <Tooltip formatter={v => [`£${v.toFixed(2)}`, 'Net Sales']} />
                  <Bar dataKey="sales" radius={[3, 3, 0, 0]}>
                    {dowData.map((entry, i) => (
                      <Cell key={i} fill={['Fri', 'Sat', 'Sun'].includes(entry.day) ? GREEN : BLUE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── CHANNELS PAGE ── */}
        {activePage === 'channels' && (
          <div>
            <h2 style={{ marginBottom: 16, color: NAVY }}>Channel Performance</h2>
            <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
              {channelData.map(c => (
                <KPICard key={c.Channel} label={c.Channel} value={`£${Number(c.Net_Sales).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`} sub={`${c.Pct_of_Total}% of total`} color={BLUE} />
              ))}
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e6f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Net Sales by Channel</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="Channel" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${v}`} />
                  <Tooltip formatter={v => [`£${v.toFixed(2)}`, 'Net Sales']} />
                  <Bar dataKey="Net_Sales" radius={[4, 4, 0, 0]}>
                    {channelData.map((_, i) => (
                      <Cell key={i} fill={[GREEN, BLUE, '#0891b2', AMBER, '#7c3aed', '#9ca3af'][i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── MENU PAGE ── */}
        {activePage === 'menu' && (
          <div>
            <h2 style={{ marginBottom: 16, color: NAVY }}>Menu Performance</h2>
            <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
              <KPICard label="Total Menu Items" value={menuData.length} sub="active items" color={BLUE} />
              <KPICard label="Top Item" value="Maharaja Thali" sub="£1,039 · 19% of dine-in" color={GREEN} />
              <KPICard label="Dine-in Sales" value={`£${menuData.reduce((s, r) => s + r.Net_Sales, 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`} sub="all menu items" color={AMBER} />
            </div>

            {/* Top 10 Table */}
            <div style={{ background: '#fff', border: '1px solid #e2e6f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Top 10 Items by Revenue</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e6f0' }}>
                    {['#', 'Item', 'Category', 'Sold', 'Avg Price', 'Net Sales'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {menuData.slice(0, 10).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f2f8' }}>
                      <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.Item}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: '#eff6ff', color: BLUE, fontSize: 10, padding: '2px 8px', borderRadius: 20 }}>{item.Category}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>{item.Items_Sold}</td>
                      <td style={{ padding: '10px 12px', color: GREEN, fontWeight: 600 }}>£{Number(item.Avg_Price).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>£{Number(item.Net_Sales).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* ── CUSTOMERS PAGE ── */}
        {activePage === 'customers' && (
          <div>
            <h2 style={{ marginBottom: 16, color: NAVY }}>Customer Analysis</h2>

            {/* KPI Row */}
            <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
              <KPICard label="Unique Customers" value="124" sub="online/delivery channel" />
              <KPICard label="Repeat Customers" value="16" sub="only 13% return" color={RED} />
              <KPICard label="One-Time Buyers" value="108" sub="87% never returned" color={AMBER} />
              <KPICard label="Repeat Rate" value="13%" sub="industry avg: 25–40%" color={RED} />
              <KPICard label="Avg Days Between Orders" value="25.5" sub="repeat customers" />
              <KPICard label="Retention Opportunity" value="£487" sub="if 10% dormant return" color={GREEN} />
            </div>

            {/* Retention Split */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>

              {/* Donut style */}
              <div style={{ background: '#fff', border: '1px solid #e2e6f0', borderRadius: 12, padding: 20, flex: 1, minWidth: 280 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Repeat vs One-Time Customers</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 20 }}>87% of customers never came back</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, fontWeight: 700, color: RED }}>87%</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>One-time · 108 customers</div>
                  </div>
                  <div style={{ width: 1, height: 60, background: '#e2e6f0' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, fontWeight: 700, color: GREEN }}>13%</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Returning · 16 customers</div>
                  </div>
                </div>
              </div>

              {/* Retention Model */}
              <div style={{ background: '#fff', border: '1px solid #e2e6f0', borderRadius: 12, padding: 20, flex: 1, minWidth: 280 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Retention Opportunity Model</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>Revenue if X% of 108 dormant customers return</div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={[
                    { label: '5% return', revenue: 243 },
                    { label: '10% return', revenue: 487 },
                    { label: '15% return', revenue: 730 },
                    { label: '20% return', revenue: 974 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `£${v}`} />
                    <Tooltip formatter={v => [`£${v}`, 'Extra Revenue/month']} />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {[BLUE, GREEN, '#1d4ed8', '#1e3a8a'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Benchmark Table */}
            <div style={{ background: '#fff', border: '1px solid #e2e6f0', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Goomti vs Industry Benchmark</div>
              <table>
                <thead>
                  <tr>
                    {['Metric', 'Goomti', 'Industry Avg', 'Gap'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: 'Repeat Rate', goomti: '13%', industry: '25–40%', gap: '−12 to −27pp', bad: true },
                    { metric: 'Orders per Customer', goomti: '1.19', industry: '2.5–3.5', gap: '−1.3 to −2.3', bad: true },
                    { metric: 'Days Between Orders', goomti: '25.5', industry: '14–21', gap: '+4 to +11 days', bad: true },
                    { metric: 'Avg Order Value', goomti: '£45.12', industry: '£25–40', gap: '+£5 to +£20', bad: false },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td>{row.metric}</td>
                      <td style={{ fontWeight: 700, color: row.bad ? RED : GREEN }}>{row.goomti}</td>
                      <td>{row.industry}</td>
                      <td style={{ color: row.bad ? RED : GREEN, fontWeight: 600 }}>{row.gap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Insight boxes */}
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { head: 'Critical Retention Gap', body: 'At 1.19 orders/customer, almost everyone is a first-timer. Industry benchmark is 2.5–3.5/year.', color: RED },
                { head: 'Re-engagement Value', body: 'Win back 10% of 108 dormant customers (≈11 people) = +£487/month at zero acquisition cost.', color: GREEN },
                { head: '25-Day Window', body: 'Repeat customers return every 25.5 days. A "Come back in 30 days" offer aligns perfectly.', color: '#7c3aed' },
              ].map((ins, i) => (
                <div key={i} style={{ flex: 1, minWidth: 220, background: '#fff', border: '1px solid #e2e6f0', borderLeft: `3px solid ${ins.color}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: ins.color, marginBottom: 6 }}>{ins.head}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{ins.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}