import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts'
import ReactMarkdown from 'react-markdown'

const API_URL = 'http://localhost:8000'
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#06b6d4', '#ec4899']

const SEVERITY_BADGE = {
  critical: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-600',
  informational: 'bg-gray-600',
}

function sevBadge(sev) {
  return SEVERITY_BADGE[sev?.toLowerCase()] || 'bg-gray-600'
}

const fixPL = (str) => (str || '')
  .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e')
  .replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
  .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
  .replace(/Ą/g,'A').replace(/Ć/g,'C').replace(/Ę/g,'E')
  .replace(/Ł/g,'L').replace(/Ń/g,'N').replace(/Ó/g,'O')
  .replace(/Ś/g,'S').replace(/Ź/g,'Z').replace(/Ż/g,'Z')

// ─── STATS CARDS ─────────────────────────────────────────────────────────────
function StatsCards({ stats }) {
  const sev = stats.severities || {}
  const cards = [
    { label: 'Wszystkich zdarzen', value: stats.total, icon: 'shield', color: 'bg-blue-900 border-blue-600' },
    { label: 'Krytyczne',          value: sev.critical || 0, icon: 'red', color: 'bg-red-900 border-red-600' },
    { label: 'Wysokie',            value: sev.high || 0,     icon: 'orange', color: 'bg-orange-900 border-orange-600' },
    { label: 'Srednie',            value: sev.medium || 0,   icon: 'yellow', color: 'bg-yellow-900 border-yellow-600' },
    { label: 'Zablokowane',        value: (stats.actions?.['reset-both'] || stats.actions?.drop || 0), icon: 'block', color: 'bg-purple-900 border-purple-600' },
    { label: 'Kraje zrodlowe',     value: stats.top_countries?.length || 0, icon: 'globe', color: 'bg-green-900 border-green-600' },
  ]
  const icons = { shield: '🛡️', red: '🔴', orange: '🟠', yellow: '🟡', block: '🚫', globe: '🌍' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
      {cards.map((c, i) => (
        <div key={i} style={{ border: '1px solid', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }} className={c.color}>
          <div style={{ fontSize: '1.5rem' }}>{icons[c.icon]}</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{c.value ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: '#d1d5db' }}>{c.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── TIMELINE ────────────────────────────────────────────────────────────────
function TimelineChart({ stats }) {
  const data = (stats.timeline || []).map(item => ({
    hour: item.hour?.slice(8) || '',
    count: item.count
  }))
  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-6">
      <h3 className="text-white font-semibold mb-4">📈 Zagrożenia w Czasie</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} />
          <YAxis stroke="#9ca3af" fontSize={11} />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
          <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── CHARTS ROW ───────────────────────────────────────────────────────────────
function ChartsRow({ stats }) {
  const threatData  = (stats.top_threats   || []).slice(0, 8).map(t => ({ name: (t.name || 'unknown').slice(0, 25), value: t.count }))
  const countryData = (stats.top_countries || []).slice(0, 8).map(c => ({ name: c.country || 'unknown', value: c.count }))
  const sevData     = Object.entries(stats.severities || {}).map(([name, value]) => ({ name, value }))
  const catData     = (stats.categories    || []).slice(0, 6).map(c => ({ name: c.category || 'unknown', value: c.count }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3 text-sm">⚠️ Top Zagrożenia</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={threatData} layout="vertical">
            <XAxis type="number" stroke="#9ca3af" fontSize={10} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={8} width={90} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3 text-sm">🌍 Kraje Źródłowe</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={countryData} layout="vertical">
            <XAxis type="number" stroke="#9ca3af" fontSize={10} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={9} width={40} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3 text-sm">🎯 Poziomy Ryzyka</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={sevData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
              label={({ name, value }) => `${name}:${value}`} labelLine={false}>
              {sevData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3 text-sm">📂 Kategorie</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={catData} layout="vertical">
            <XAxis type="number" stroke="#9ca3af" fontSize={10} />
            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={8} width={80} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
            <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── TOP ATTACKERS ────────────────────────────────────────────────────────────
function TopAttackers({ stats }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-6">
      <h3 className="text-white font-semibold mb-4">🎯 Top Atakujące IP</h3>
      <table className="w-full text-sm text-gray-300">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-2 px-3">#</th>
            <th className="text-left py-2 px-3">IP</th>
            <th className="text-right py-2 px-3">Ataki</th>
            <th className="text-left py-2 px-3">Kraj</th>
          </tr>
        </thead>
        <tbody>
          {(stats.top_src_ips || []).map((item, i) => (
            <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
              <td className="py-2 px-3">
                <span className={`px-2 py-1 rounded text-xs font-bold text-white ${i === 0 ? 'bg-red-600' : i === 1 ? 'bg-orange-600' : i === 2 ? 'bg-yellow-600' : 'bg-gray-700'}`}>
                  #{i + 1}
                </span>
              </td>
              <td className="py-2 px-3 font-mono text-red-400">{item.ip}</td>
              <td className="py-2 px-3 text-right">
                <span className="bg-red-900 text-red-200 px-2 py-1 rounded text-xs font-bold">{item.count}</span>
              </td>
              <td className="py-2 px-3 text-gray-400">
                {(stats.top_countries || []).find(c => c.country)?.country || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── LOGS TABLE ───────────────────────────────────────────────────────────────
function LogsTable({ hours, maxLogs }) {
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ severity: '', src_ip: '', category: '' })

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ hours, max_logs: maxLogs })
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
      const res = await axios.get(`${API_URL}/threats/logs?${params}`)
      setLogs(res.data.logs)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [hours, maxLogs])

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">📋 Zdarzenia Bezpieczeństwa</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none focus:border-red-500">
          <option value="">Wszystkie poziomy</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input type="text" placeholder="🔍 Źródło IP" value={filters.src_ip}
          onChange={e => setFilters(f => ({ ...f, src_ip: e.target.value }))}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none w-36" />
        <input type="text" placeholder="🔍 Kategoria" value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm border border-gray-700 focus:outline-none w-36" />
        <button onClick={fetchLogs} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          Filtruj
        </button>
        <span className="text-gray-500 text-sm self-center">Wyników: {logs.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-gray-300">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left py-2 px-2">Czas</th>
              <th className="text-left py-2 px-2">Źródło IP</th>
              <th className="text-left py-2 px-2">Kraj</th>
              <th className="text-left py-2 px-2">Cel IP</th>
              <th className="text-left py-2 px-2">Zagrożenie</th>
              <th className="text-left py-2 px-2">Kategoria</th>
              <th className="text-left py-2 px-2">Poziom</th>
              <th className="text-left py-2 px-2">Akcja</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">Ładowanie...</td></tr>
            ) : logs.map((log, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="py-1 px-2 font-mono">{log.time?.slice(0, 16)}</td>
                <td className="py-1 px-2 font-mono text-red-400">{log.src_ip}</td>
                <td className="py-1 px-2 text-gray-400">{log.src_country}</td>
                <td className="py-1 px-2 font-mono text-blue-400">{log.dst_ip}</td>
                <td className="py-1 px-2 text-yellow-400">{log.threat_name?.slice(0, 30)}</td>
                <td className="py-1 px-2 text-purple-400">{log.threat_category}</td>
                <td className="py-1 px-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${sevBadge(log.severity)}`}>
                    {log.severity}
                  </span>
                </td>
                <td className="py-1 px-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${log.action === 'allow' ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                    {log.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── MARKDOWN COMPONENTS ─────────────────────────────────────────────────────
const mdC = {
  h1: ({ children }) => <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ color: '#60a5fa', fontSize: '1.25rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ color: '#f97316', fontSize: '1.1rem', fontWeight: 'bold', margin: '1rem 0 0.25rem' }}>{children}</h3>,
  strong: ({ children }) => <strong style={{ color: '#fbbf24' }}>{children}</strong>,
  li: ({ children }) => <li style={{ marginLeft: '1.5rem', listStyleType: 'disc', marginBottom: '0.25rem' }}>{children}</li>,
  p:  ({ children }) => <p style={{ marginBottom: '0.75rem' }}>{children}</p>,
  hr: () => <hr style={{ borderColor: '#374151', margin: '1rem 0' }} />,
  code: ({ children }) => <code style={{ backgroundColor: '#1f2937', color: '#a78bfa', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em' }}>{children}</code>,
}

// ─── REPORT VIEW ─────────────────────────────────────────────────────────────
function ReportView({ data }) {

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const W = pdf.internal.pageSize.getWidth()
    const H = pdf.internal.pageSize.getHeight()
    const m = 15
    const mw = W - m * 2
    let y = m

    const newPage = () => {
      pdf.addPage()
      pdf.setFillColor(17, 24, 39)
      pdf.rect(0, 0, W, H, 'F')
      y = m
    }

    pdf.setFillColor(17, 24, 39)
    pdf.rect(0, 0, W, H, 'F')
    pdf.setFontSize(20); pdf.setTextColor(239, 68, 68)
    pdf.text('Threat Intelligence Dashboard', m, y); y += 8
    pdf.setFontSize(10); pdf.setTextColor(156, 163, 175)
    pdf.text(fixPL(`Data: ${data.timestamp}  |  Zdarzen: ${data.logs_count}  |  Zakres: ${data.time_range}`), m, y); y += 10
    pdf.setDrawColor(239, 68, 68); pdf.setLineWidth(0.5)
    pdf.line(m, y, W - m, y); y += 8

    for (const line of data.report.split('\n')) {
      if (y > H - m) newPage()

      // Pomiń separatory tabeli |---|---|
      if (/^\|[-| :]+\|/.test(line)) continue

      // Tabela markdown
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(c => c.trim() !== '').map(c => fixPL(c.trim()))
        pdf.setFontSize(8); pdf.setTextColor(200, 200, 200)
        const w = pdf.splitTextToSize(cells.join('  |  '), mw)
        pdf.text(w, m + 2, y); y += w.length * 4.5
        continue
      }

      if (line.startsWith('## ')) {
        y += 2; if (y > H - m) newPage()
        pdf.setFontSize(13); pdf.setTextColor(96, 165, 250)
        const w = pdf.splitTextToSize(fixPL(line.replace(/^##\s*/,''). replace(/\*\*/g,'')), mw)
        pdf.text(w, m, y); y += w.length * 6 + 3; continue
      }
      if (line.startsWith('### ')) {
        pdf.setFontSize(11); pdf.setTextColor(249, 115, 22)
        const w = pdf.splitTextToSize(fixPL(line.replace(/^###\s*/,'').replace(/\*\*/g,'')), mw)
        pdf.text(w, m, y); y += w.length * 5 + 2; continue
      }
      if (line.startsWith('# ')) {
        pdf.setFontSize(15); pdf.setTextColor(255, 255, 255)
        const w = pdf.splitTextToSize(fixPL(line.replace(/^#\s*/,'').replace(/\*\*/g,'')), mw)
        pdf.text(w, m, y); y += w.length * 7 + 3; continue
      }
      if (/^[-*•]\s/.test(line)) {
        pdf.setFontSize(9); pdf.setTextColor(209, 213, 219)
        const w = pdf.splitTextToSize('• ' + fixPL(line.replace(/^[-*•]\s*/,'').replace(/\*\*/g,'')), mw - 6)
        pdf.text(w, m + 4, y); y += w.length * 4.5; continue
      }
      if (/^\d+\.\s/.test(line)) {
        pdf.setFontSize(9); pdf.setTextColor(209, 213, 219)
        const w = pdf.splitTextToSize(fixPL(line.replace(/\*\*/g,'')), mw - 4)
        pdf.text(w, m + 2, y); y += w.length * 4.5; continue
      }
      if (/^---+$/.test(line.trim())) {
        pdf.setDrawColor(55, 65, 81); pdf.setLineWidth(0.3)
        pdf.line(m, y, W - m, y); y += 5; continue
      }
      if (!line.trim()) { y += 3; continue }

      const clean = fixPL(line
        .replace(/\*\*(.+?)\*\*/g,'$1')
        .replace(/\*(.+?)\*/g,'$1')
        .replace(/`(.+?)`/g,'$1')
      )
      pdf.setFontSize(9); pdf.setTextColor(209, 213, 219)
      const w = pdf.splitTextToSize(clean, mw)
      pdf.text(w, m, y); y += w.length * 4.5
    }

    pdf.save(`threat-report-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={exportPDF} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg">
          📄 Eksport PDF
        </button>
      </div>
      <div className="bg-gray-900 rounded-lg p-6 text-gray-200 leading-relaxed">
        <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
          📅 {data.timestamp} &nbsp;|&nbsp; 🛡️ Zdarzeń: {data.logs_count} &nbsp;|&nbsp; ⏱️ {data.time_range}
        </div>
        <ReactMarkdown components={mdC}>{data.report}</ReactMarkdown>
      </div>
    </div>
  )
}

// ─── IOC XML VIEW ─────────────────────────────────────────────────────────────
function IocXmlView({ hours, maxLogs }) {
  const [xml, setXml]         = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  const generateXml = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/export/ioc-xml?hours=${hours}&max_logs=${maxLogs}`, { responseType: 'text' })
      setXml(res.data)
    } catch {}
    setLoading(false)
  }

  const downloadXml = () => {
    const blob = new Blob([xml], { type: 'application/xml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `threat-block-rules-${new Date().toISOString().slice(0, 10)}.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyXml = () => {
    navigator.clipboard.writeText(xml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-white text-xl font-bold">🚫 Eksport IOC do XML</h2>
          <p className="text-gray-400 text-sm mt-1">Generuje reguły blokowania złośliwych IP w formacie PAN-OS XML gotowe do importu</p>
        </div>
        <button onClick={generateXml} disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg">
          {loading ? '⏳ Generuję XML...' : '⚙️ Generuj IOC XML'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">⚙️</div>
          <p>AI generuje reguły blokowania PAN-OS XML...</p>
        </div>
      )}

      {!loading && xml && (
        <div>
          <div className="bg-green-900 border border-green-600 text-green-200 px-4 py-3 rounded-lg mb-4 text-sm">
            ✅ Wygenerowano reguły blokowania. Import przez: <strong>Device → Setup → Operations → Import Named Configuration Snapshot</strong>
          </div>
          <div className="flex gap-3 mb-4">
            <button onClick={downloadXml} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              💾 Pobierz XML
            </button>
            <button onClick={copyXml} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {copied ? '✅ Skopiowano!' : '📋 Kopiuj XML'}
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">{xml}</pre>
          </div>
        </div>
      )}

      {!loading && !xml && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🚫</div>
          <p>Kliknij "Generuj IOC XML" aby wygenerować reguły blokowania dla Palo Alto</p>
        </div>
      )}
    </div>
  )
}

// ─── HISTORY VIEW ─────────────────────────────────────────────────────────────
function HistoryView({ history, onLoad, selectedAnalysis }) {
  return (
    <div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-white font-semibold mb-4">📁 Historia Analiz</h3>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Brak zapisanych analiz. Uruchom pierwszą analizę!</p>
        ) : (
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">Data</th>
                <th className="text-left py-2 px-3">Zakres</th>
                <th className="text-right py-2 px-3">Zdarzeń</th>
                <th className="text-right py-2 px-3">Krytyczne</th>
                <th className="text-right py-2 px-3">Wysokie</th>
                <th className="text-left py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {history.map(a => (
                <tr key={a.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-2 px-3">{a.timestamp}</td>
                  <td className="py-2 px-3">
                    <span className="bg-red-900 text-red-200 px-2 py-1 rounded text-xs">{a.time_range}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-white">{a.logs_count}</td>
                  <td className="py-2 px-3 text-right text-red-400 font-bold">{a.critical}</td>
                  <td className="py-2 px-3 text-right text-orange-400 font-bold">{a.high}</td>
                  <td className="py-2 px-3">
                    <button onClick={() => onLoad(a.id)} className="bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">
                      Zobacz raport
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedAnalysis && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-4">📄 Raport z {selectedAnalysis.timestamp}</h3>
          <ReactMarkdown components={mdC}>{selectedAnalysis.report}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [stats, setStats]                       = useState(null)
  const [report, setReport]                     = useState(null)
  const [history, setHistory]                   = useState([])
  const [selectedAnalysis, setSelectedAnalysis] = useState(null)
  const [loading, setLoading]                   = useState(false)
  const [loadingStats, setLoadingStats]         = useState(true)
  const [error, setError]                       = useState(null)
  const [activeTab, setActiveTab]               = useState('dashboard')
  const [hours, setHours]                       = useState(24)
  const [maxLogs, setMaxLogs]                   = useState(1000)
  const [darkMode, setDarkMode]                 = useState(true)

  const loadHistory = async () => {
    try { const res = await axios.get(`${API_URL}/analyses`); setHistory(res.data) } catch {}
  }

  const loadAnalysis = async (id) => {
    try { const res = await axios.get(`${API_URL}/analyses/${id}`); setSelectedAnalysis(res.data) } catch {}
  }

  useEffect(() => {
    axios.get(`${API_URL}/threats/stats?hours=${hours}&max_logs=${maxLogs}`)
      .then(r => setStats(r.data))
      .catch(() => setError('Błąd połączenia z API'))
      .finally(() => setLoadingStats(false))
    loadHistory()
  }, [])

  const runAnalysis = async () => {
    setLoading(true); setError(null)
    try {
      const res = await axios.get(`${API_URL}/analyze?hours=${hours}&max_logs=${maxLogs}`)
      setReport(res.data); setStats(res.data.stats)
      setActiveTab('report'); loadHistory()
    } catch {
      setError('Błąd analizy. Sprawdź czy backend działa.')
    } finally { setLoading(false) }
  }

  const tabs = [
    { id: 'dashboard', label: '🛡️ Dashboard' },
    { id: 'logs',      label: '📋 Zdarzenia' },
    { id: 'ioc',       label: '🚫 Eksport IOC' },
    { id: 'report',    label: '🤖 Raport AI' },
    { id: 'history',   label: '📁 Historia' },
  ]

  const bg      = darkMode ? 'bg-gray-950' : 'bg-slate-100'
  const textMain= darkMode ? 'text-white'  : 'text-gray-900'
  const textSub = darkMode ? 'text-gray-400':'text-gray-600'
  const ctrl    = darkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'

  return (
    <div className={`min-h-screen ${bg} ${textMain} p-8`}>
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              <span className="text-red-500">🔴</span> Threat Intelligence Dashboard
            </h1>
            <p className={`${textSub} text-sm`}>Palo Alto Networks — analiza zagrożeń w czasie rzeczywistym</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <button onClick={() => setDarkMode(!darkMode)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className={`flex items-center gap-2 ${ctrl} rounded-lg px-3 py-2`}>
              <span className={`${textSub} text-sm`}>⏱️</span>
              <select value={hours} onChange={e => setHours(Number(e.target.value))}
                className={`${darkMode ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'} text-sm focus:outline-none`}>
                <option value={1}>1h</option>
                <option value={6}>6h</option>
                <option value={24}>24h</option>
                <option value={48}>48h</option>
                <option value={168}>7 dni</option>
              </select>
            </div>
            <div className={`flex items-center gap-2 ${ctrl} rounded-lg px-3 py-2`}>
              <span className={`${textSub} text-sm`}>📋</span>
              <select value={maxLogs} onChange={e => setMaxLogs(Number(e.target.value))}
                className={`${darkMode ? 'bg-transparent text-white' : 'bg-transparent text-gray-900'} text-sm focus:outline-none`}>
                <option value={500}>500</option>
                <option value={1000}>1 000</option>
                <option value={2000}>2 000</option>
                <option value={5000}>5 000</option>
              </select>
            </div>
            <button onClick={runAnalysis} disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors">
              {loading ? '⏳ Analizuję...' : '🔍 Analizuj Zagrożenia'}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6">⚠️ {error}</div>
        )}

        {loading && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p>Pobieranie logów zagrożeń i analiza AI...</p>
            <p className="text-sm mt-2">To może potrwać 30-60 sekund</p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'dashboard' && (
              loadingStats
                ? <div className="text-center py-16 text-gray-500">Ładowanie statystyk...</div>
                : stats
                  ? <>
                      <StatsCards stats={stats} />
                      <TimelineChart stats={stats} />
                      <ChartsRow stats={stats} />
                      <TopAttackers stats={stats} />
                    </>
                  : <div className="text-center py-16 text-gray-500">Brak danych — sprawdź połączenie z firewallem</div>
            )}

            {activeTab === 'logs'    && <LogsTable hours={hours} maxLogs={maxLogs} />}
            {activeTab === 'ioc'     && <IocXmlView hours={hours} maxLogs={maxLogs} />}

            {activeTab === 'report'  && report  && <ReportView data={report} />}
            {activeTab === 'report'  && !report && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-4">🤖</div>
                <p>Kliknij "Analizuj Zagrożenia" aby wygenerować raport AI</p>
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryView history={history} onLoad={loadAnalysis} selectedAnalysis={selectedAnalysis} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
