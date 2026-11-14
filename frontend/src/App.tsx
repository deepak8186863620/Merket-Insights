import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api/chat', '') : 'http://localhost:8000'
const CHAT_API = `${API_BASE}/api/chat`

interface MarketIndex {
  symbol: string
  name: string
  region: string
  price: number
  change: number
  changePercent: number
  direction: 'up' | 'down'
}

interface MarketPulseData {
  indices: MarketIndex[]
  sentiment: {
    score: number
    label: string
    bullishRatio: number
  }
}

interface StockQuote {
  ticker: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  sparkline: number[]
  currency: string
}

interface ChartData {
  ticker: string
  period: string
  currency: string
  currentPrice: number
  high: number
  low: number
  dates: string[]
  prices: number[]
  volumes: number[]
  sma20: (number | null)[]
  technicals: {
    rsi: number
    smaTrend: string
    overallSignal: string
  }
  dcfBaseline: {
    fcfPerShare: number
    estimatedFairValue: number
    undervaluedPercent: number
    verdict: string
  }
}

interface HeatmapStock {
  ticker: string
  name: string
  weight: number
  price: number
  changePercent: number
  status: 'up' | 'down'
}

interface HeatmapSector {
  sector: string
  stocks: HeatmapStock[]
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const PRESET_QUERIES = [
  { icon: '📊', title: 'Live Market Signals', text: "Analyze today's Indian market condition with key technical & sentiment signals." },
  { icon: '🚀', title: 'Top Momentum Stocks', text: 'Which stocks are showing high volume breakouts and bullish momentum today?' },
  { icon: '🏦', title: 'Banking & IT Sector', text: 'Compare the performance and outlook of NIFTY Bank vs NIFTY IT.' },
  { icon: '🎯', title: 'Analyst Conviction', text: 'What are the highest-rated analyst recommendations with strong upside targets?' },
  { icon: '🔍', title: 'Deep Fundamental Scan', text: 'Give a comprehensive balance sheet and valuation breakdown for Reliance Industries.' },
  { icon: '⚔️', title: 'Head-to-Head Duel', text: 'Compare TCS vs Infosys across P/E, revenue growth, margins and analyst targets.' },
]

function genId() {
  return Math.random().toString(36).substring(2, 9)
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Sparkline SVG Component
function SparklineChart({ data, isUp }: { data: number[]; isUp: boolean }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 120
  const height = 36
  const padding = 4

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((val - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  const strokeColor = isUp ? '#059669' : '#dc2626'

  return (
    <svg width={width} height={height} className="sparkline-svg">
      <polyline fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

// Interactive Full Canvas/SVG Chart Component
function InteractiveChart({
  chartData,
  showSMA,
}: {
  chartData: ChartData
  showSMA: boolean
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const { prices, dates, volumes, sma20, high, low, currency } = chartData

  if (!prices || prices.length < 2) return null

  const width = 800
  const height = 320
  const padding = 40
  const chartH = height - padding * 2
  const chartW = width - padding * 2

  const minPrice = low * 0.99
  const maxPrice = high * 1.01
  const priceRange = maxPrice - minPrice || 1

  // Area polyline points
  const points = prices.map((p, i) => {
    const x = padding + (i / (prices.length - 1)) * chartW
    const y = padding + chartH - ((p - minPrice) / priceRange) * chartH
    return { x, y, price: p, date: dates[i], vol: volumes[i] }
  })

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ')
  const areaStr = `${padding},${padding + chartH} ${polylineStr} ${points[points.length - 1].x},${padding + chartH}`

  // SMA points
  const validSMA = sma20
    .map((s, i) => {
      if (s === null) return null
      const x = padding + (i / (prices.length - 1)) * chartW
      const y = padding + chartH - ((s - minPrice) / priceRange) * chartH
      return `${x},${y}`
    })
    .filter(Boolean)
    .join(' ')

  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1]
  const isGain = prices[prices.length - 1] >= prices[0]

  return (
    <div className="interactive-chart-wrap">
      <div className="chart-header-metrics">
        <div>
          <span className="chart-curr-price">
            {currency} {activePoint?.price.toLocaleString()}
          </span>
          <span className={`chart-day-badge ${isGain ? 'up' : 'down'}`}>
            {isGain ? '▲' : '▼'} {(((activePoint?.price - prices[0]) / prices[0]) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="chart-cursor-info">
          <span>Date: <strong>{activePoint?.date}</strong></span>
          <span>Vol: <strong>{activePoint?.vol?.toLocaleString()}</strong></span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="main-chart-svg"
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const relX = e.clientX - rect.left
          const ratio = (relX - padding * (rect.width / width)) / (chartW * (rect.width / width))
          const idx = Math.max(0, Math.min(prices.length - 1, Math.round(ratio * (prices.length - 1))))
          setHoverIndex(idx)
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isGain ? '#059669' : '#dc2626'} stopOpacity="0.18" />
            <stop offset="100%" stopColor={isGain ? '#059669' : '#dc2626'} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding + chartH * pct
          const priceLevel = (maxPrice - pct * priceRange).toFixed(1)
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(15, 23, 42, 0.08)" strokeDasharray="4 4" />
              <text x={width - padding + 5} y={y + 4} fill="#64748b" fontSize="10" fontFamily="monospace">
                {priceLevel}
              </text>
            </g>
          )
        })}

        {/* Area & Polyline */}
        <polygon fill="url(#areaGradient)" points={areaStr} />
        <polyline fill="none" stroke={isGain ? '#059669' : '#dc2626'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={polylineStr} />

        {/* SMA Line */}
        {showSMA && validSMA && (
          <polyline fill="none" stroke="#4f46e5" strokeWidth="2" strokeDasharray="3 3" points={validSMA} />
        )}

        {/* Crosshair */}
        {hoverIndex !== null && (
          <g>
            <line x1={activePoint.x} y1={padding} x2={activePoint.x} y2={padding + chartH} stroke="rgba(37, 99, 235, 0.5)" strokeDasharray="3 3" />
            <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  )
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [marketPulse, setMarketPulse] = useState<MarketPulseData | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'chart' | 'heatmap' | 'watchlist' | 'duel'>('chat')
  
  // Chart Studio state
  const [chartTicker, setChartTicker] = useState('RELIANCE.NS')
  const [chartPeriod, setChartPeriod] = useState('1mo')
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [showSMA, setShowSMA] = useState(true)
  
  // Interactive DCF Sliders
  const [dcfGrowthRate, setDcfGrowthRate] = useState(12)
  const [dcfDiscountRate, setDcfDiscountRate] = useState(9)

  // Heatmap state
  const [heatmapData, setHeatmapData] = useState<HeatmapSector[]>([])
  const [heatmapLoading, setHeatmapLoading] = useState(false)

  // Watchlist & Duel state
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mi_watchlist')
      return saved ? JSON.parse(saved) : ['RELIANCE.NS', 'TCS.NS', 'AAPL', 'NVDA']
    } catch {
      return ['RELIANCE.NS', 'TCS.NS', 'AAPL', 'NVDA']
    }
  })
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, StockQuote>>({})
  const [newWatchlistTicker, setNewWatchlistTicker] = useState('')
  const [duelStock1, setDuelStock1] = useState('TCS.NS')
  const [duelStock2, setDuelStock2] = useState('INFY.NS')
  const [isListening, setIsListening] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const threadId = useRef(genId())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Fetch market pulse
  useEffect(() => {
    const fetchPulse = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/market-pulse`)
        if (res.ok) {
          const data = await res.json()
          setMarketPulse(data)
        }
      } catch (err) {
        console.warn('Failed to load market pulse:', err)
      }
    }
    fetchPulse()
    const interval = setInterval(fetchPulse, 20000)
    return () => clearInterval(interval)
  }, [])

  // Fetch Chart Data
  const loadChartData = useCallback(async (ticker: string, period: string) => {
    setChartLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/chart-data/${encodeURIComponent(ticker)}?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setChartData(data)
      }
    } catch (err) {
      console.error('Failed to load chart data:', err)
    } finally {
      setChartLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'chart') {
      loadChartData(chartTicker, chartPeriod)
    }
  }, [activeTab, chartTicker, chartPeriod, loadChartData])

  // Fetch Heatmap Data
  useEffect(() => {
    if (activeTab === 'heatmap' && heatmapData.length === 0) {
      setHeatmapLoading(true)
      fetch(`${API_BASE}/api/market-heatmap`)
        .then(res => res.json())
        .then(data => setHeatmapData(data.heatmap || []))
        .catch(err => console.error('Failed to load heatmap:', err))
        .finally(() => setHeatmapLoading(false))
    }
  }, [activeTab, heatmapData.length])

  // Fetch watchlist quotes
  useEffect(() => {
    const fetchWatchlist = async () => {
      const quotes: Record<string, StockQuote> = {}
      for (const ticker of watchlist) {
        try {
          const res = await fetch(`${API_BASE}/api/stock-quote/${encodeURIComponent(ticker)}`)
          if (res.ok) {
            quotes[ticker] = await res.json()
          }
        } catch {
          // ignore individual failures
        }
      }
      setWatchlistQuotes(quotes)
    }
    if (watchlist.length > 0) {
      fetchWatchlist()
      const interval = setInterval(fetchWatchlist, 25000)
      return () => clearInterval(interval)
    }
  }, [watchlist])

  // Save watchlist
  useEffect(() => {
    localStorage.setItem('mi_watchlist', JSON.stringify(watchlist))
  }, [watchlist])

  // Web Speech API Voice Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript))
        setIsListening(false)
      }

      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch {
        setIsListening(false)
      }
    }
  }

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || input).trim()
      if (!query || loading) return

      const userMsg: Message = { id: genId(), role: 'user', content: query, timestamp: new Date() }
      const assistantId = genId()
      const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', timestamp: new Date() }

      setMessages(prev => [...prev, userMsg, assistantMsg])
      setInput('')
      setLoading(true)
      setActiveTab('chat')

      try {
        const res = await fetch(CHAT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: { content: query, id: userMsg.id, role: 'user' },
            threadId: threadId.current,
            responseId: assistantId,
          }),
        })

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`)
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) throw new Error('ReadableStream not supported')

        let accumulated = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          accumulated += chunk
          setMessages(prev =>
            prev.map(m => (m.id === assistantId ? { ...m, content: accumulated } : m))
          )
        }
      } catch (err: any) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `⚠️ **Connection Notice**: ${err.message || 'Error communicating with analysis agent'}.\nPlease ensure the backend is running on \`${API_BASE}\`.`,
                }
              : m
          )
        )
      } finally {
        setLoading(false)
      }
    },
    [input, loading]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExport = (content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `MarketInsight_Report_${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const addWatchlistTicker = () => {
    const t = newWatchlistTicker.trim().toUpperCase()
    if (t && !watchlist.includes(t)) {
      setWatchlist(prev => [...prev, t])
      setNewWatchlistTicker('')
    }
  }

  const removeWatchlistTicker = (t: string) => {
    setWatchlist(prev => prev.filter(item => item !== t))
  }

  const startDuel = () => {
    const s1 = duelStock1.trim().toUpperCase()
    const s2 = duelStock2.trim().toUpperCase()
    if (s1 && s2) {
      handleSend(`Run a deep comparative head-to-head analysis between ${s1} and ${s2}. Compare their latest prices, valuation multiples (P/E, Market Cap), profit growth, balance sheet health, analyst targets, and provide a clear verdict on which is the better risk-reward investment.`)
    }
  }

  // Interactive DCF dynamic recalculated value
  const computedDCFFairValue = chartData
    ? Math.max(1, (chartData.dcfBaseline.fcfPerShare * (1 + dcfGrowthRate / 100)) / (dcfDiscountRate / 100) * 1.5)
    : 100
  const computedMarginOfSafety = chartData
    ? (((computedDCFFairValue - chartData.currentPrice) / chartData.currentPrice) * 100)
    : 0

  return (
    <div className="mi-root">
      <div className="ambient-radial radial-1" />
      <div className="ambient-radial radial-2" />
      <div className="matrix-grid" />

      {/* Ticker Tape Header */}
      <header className="ticker-tape-header">
        <div className="tape-track">
          {(marketPulse?.indices || [
            { symbol: '^NSEI', name: 'NIFTY 50', price: 25144.3, change: -155.05, changePercent: -0.61, direction: 'down' },
            { symbol: '^BSESN', name: 'SENSEX', price: 81592.45, change: -318.56, changePercent: -0.39, direction: 'down' },
            { symbol: '^GSPC', name: 'S&P 500', price: 7561.67, change: -30.19, changePercent: -0.4, direction: 'down' },
            { symbol: '^IXIC', name: 'NASDAQ', price: 25136.27, change: -227.48, changePercent: -0.9, direction: 'down' },
            { symbol: 'RELIANCE.NS', name: 'RELIANCE', price: 1339.7, change: 0.0, changePercent: 0.0, direction: 'up' },
            { symbol: 'TCS.NS', name: 'TCS', price: 2407.5, change: -34.9, changePercent: -1.43, direction: 'down' },
          ])
            .concat(marketPulse?.indices || [])
            .map((idx, i) => (
              <div
                key={i}
                className={`tape-item ${idx.direction}`}
                onClick={() => {
                  setChartTicker(idx.symbol)
                  setActiveTab('chart')
                }}
              >
                <span className="tape-name">{idx.name}</span>
                <span className="tape-price">{idx.price.toLocaleString()}</span>
                <span className="tape-change">
                  {idx.direction === 'up' ? '▲' : '▼'} {Math.abs(idx.changePercent).toFixed(2)}%
                </span>
              </div>
            ))}
        </div>

        {/* Fear & Greed Radar Badge */}
        {marketPulse?.sentiment && (
          <div className="sentiment-radar-pill">
            <span className="radar-pulse-dot" />
            <span className="radar-label">Market Pulse:</span>
            <span className="radar-score">{marketPulse.sentiment.score}/100</span>
            <span className={`radar-tag tag-${marketPulse.sentiment.label.toLowerCase().replace(' ', '-')}`}>
              {marketPulse.sentiment.label}
            </span>
          </div>
        )}
      </header>

      <div className="mi-body">
        {/* Sidebar */}
        <aside className={`mi-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-brand">
            <div className="brand-logo-wrap">
              <span className="brand-icon">⚡</span>
              <div className="brand-glow" />
            </div>
            <div className="brand-titles">
              <h1 className="brand-name">MarketInsight</h1>
              <span className="brand-badge">PRO QUANT AI</span>
            </div>
          </div>

          <button
            className="action-btn new-chat-btn"
            onClick={() => {
              setMessages([])
              threadId.current = genId()
              setActiveTab('chat')
            }}
          >
            <span className="btn-icon">+</span>
            <span>New Intel Session</span>
          </button>

          {/* Navigation Tabs */}
          <div className="sidebar-nav">
            <button
              className={`nav-tab-item ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <span>💬</span> AI Analyst Terminal
            </button>
            <button
              className={`nav-tab-item ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              <span>📈</span> Quant Chart & DCF Studio
            </button>
            <button
              className={`nav-tab-item ${activeTab === 'heatmap' ? 'active' : ''}`}
              onClick={() => setActiveTab('heatmap')}
            >
              <span>🗺️</span> Market Sector Heatmap
            </button>
            <button
              className={`nav-tab-item ${activeTab === 'watchlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              <span>⭐</span> Live Watchlist ({watchlist.length})
            </button>
            <button
              className={`nav-tab-item ${activeTab === 'duel' ? 'active' : ''}`}
              onClick={() => setActiveTab('duel')}
            >
              <span>⚔️</span> Stock Versus Duel
            </button>
          </div>

          {/* High-Impact Scanners */}
          <div className="sidebar-section">
            <h4 className="section-title">⚡ High-Impact Scanners</h4>
            <button
              className="scanner-chip"
              onClick={() => handleSend("Identify the top 3 breakout stocks in the Indian market today with unusual volume surge.")}
            >
              🔥 Volume Breakouts
            </button>
            <button
              className="scanner-chip"
              onClick={() => handleSend("What are the most recent insider buying or selling transactions reported in major companies?")}
            >
              🕵️ Insider Transactions
            </button>
            <button
              className="scanner-chip"
              onClick={() => handleSend("Show me high-dividend yield companies with sustainable free cash flow and low debt.")}
            >
              💰 Cash Cows & Dividends
            </button>
            <button
              className="scanner-chip"
              onClick={() => handleSend("Summarize the latest institutional and mutual fund shareholding shifts in key blue-chip stocks.")}
            >
              🏛️ Whale Portfolio Moves
            </button>
          </div>

          <div className="sidebar-footer">
            <div className="system-health">
              <span className="live-dot" />
              <span>Real-time Gemini Quant Model</span>
            </div>
          </div>
        </aside>

        {/* Sidebar Collapse Toggle */}
        <button
          className="collapse-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Toggle Navigation Sidebar"
        >
          {sidebarOpen ? '❮' : '❯'}
        </button>

        {/* Main Workspace */}
        <main className="mi-workspace">
          {/* TAB 1: Quant Chart & DCF Studio */}
          {activeTab === 'chart' ? (
            <div className="tab-pane chart-studio-pane">
              <div className="studio-topbar">
                <div className="studio-search-bar">
                  <input
                    type="text"
                    value={chartTicker}
                    onChange={e => setChartTicker(e.target.value)}
                    placeholder="Search ticker (e.g. RELIANCE.NS, AAPL, TCS.NS)..."
                    onKeyDown={e => e.key === 'Enter' && loadChartData(chartTicker, chartPeriod)}
                  />
                  <button onClick={() => loadChartData(chartTicker, chartPeriod)}>Load Asset</button>
                </div>

                <div className="period-selector">
                  {['5d', '1mo', '6mo', '1y', '5y'].map(p => (
                    <button
                      key={p}
                      className={`period-btn ${chartPeriod === p ? 'active' : ''}`}
                      onClick={() => setChartPeriod(p)}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                  <button className={`toggle-sma-btn ${showSMA ? 'active' : ''}`} onClick={() => setShowSMA(!showSMA)}>
                    SMA 20
                  </button>
                </div>
              </div>

              {chartLoading ? (
                <div className="studio-loader">
                  <div className="radar-wave" />
                  <span>Computing Quant Time-Series & Multi-Factor Ratios...</span>
                </div>
              ) : chartData ? (
                <div className="studio-grid">
                  {/* Left Column: Interactive Chart */}
                  <div className="studio-chart-card">
                    <div className="chart-asset-header">
                      <div>
                        <h2 className="asset-title">{chartData.ticker}</h2>
                        <span className="asset-sub">Interactive Quant Analytics & Technical Indicators</span>
                      </div>
                      <div className={`signal-badge badge-${chartData.technicals.overallSignal.toLowerCase().replace(' ', '-')}`}>
                        {chartData.technicals.overallSignal}
                      </div>
                    </div>

                    <InteractiveChart chartData={chartData} showSMA={showSMA} />

                    {/* Technical Indicator Indicators */}
                    <div className="technicals-row">
                      <div className="tech-box">
                        <span className="tech-lbl">14-Period RSI</span>
                        <span className={`tech-val ${chartData.technicals.rsi > 70 ? 'danger' : chartData.technicals.rsi < 35 ? 'success' : ''}`}>
                          {chartData.technicals.rsi} ({chartData.technicals.rsi > 70 ? 'Overbought' : chartData.technicals.rsi < 35 ? 'Oversold' : 'Neutral'})
                        </span>
                      </div>
                      <div className="tech-box">
                        <span className="tech-lbl">20-Day SMA Trend</span>
                        <span className={`tech-val ${chartData.technicals.smaTrend === 'Bullish' ? 'success' : 'danger'}`}>
                          {chartData.technicals.smaTrend}
                        </span>
                      </div>
                      <div className="tech-box">
                        <span className="tech-lbl">Period High / Low</span>
                        <span className="tech-val">
                          {chartData.high} / {chartData.low}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Interactive DCF Valuation Simulator */}
                  <div className="studio-dcf-card">
                    <h3 className="dcf-title">⚡ Interactive DCF Valuation Simulator</h3>
                    <p className="dcf-sub">
                      Adjust expected cash flow growth and hurdle discount rate to compute intrinsic fair value dynamically.
                    </p>

                    <div className="slider-group">
                      <div className="slider-label">
                        <span>Expected FCF Growth:</span>
                        <span className="slider-val">{dcfGrowthRate}%</span>
                      </div>
                      <input
                        type="range"
                        min="-5"
                        max="35"
                        value={dcfGrowthRate}
                        onChange={e => setDcfGrowthRate(Number(e.target.value))}
                      />
                    </div>

                    <div className="slider-group">
                      <div className="slider-label">
                        <span>Hurdle Discount Rate (WACC):</span>
                        <span className="slider-val">{dcfDiscountRate}%</span>
                      </div>
                      <input
                        type="range"
                        min="6"
                        max="18"
                        value={dcfDiscountRate}
                        onChange={e => setDcfDiscountRate(Number(e.target.value))}
                      />
                    </div>

                    {/* Computed Valuation Display */}
                    <div className="dcf-result-box">
                      <div className="result-metric">
                        <span className="res-lbl">Current Market Price</span>
                        <span className="res-val">{chartData.currency} {chartData.currentPrice.toLocaleString()}</span>
                      </div>
                      <div className="result-metric">
                        <span className="res-lbl">Simulated Fair Value</span>
                        <span className="res-val highlight">{chartData.currency} {computedDCFFairValue.toFixed(2)}</span>
                      </div>
                      <div className="result-metric">
                        <span className="res-lbl">Margin of Safety</span>
                        <span className={`res-val ${computedMarginOfSafety >= 0 ? 'success' : 'danger'}`}>
                          {computedMarginOfSafety >= 0 ? '▲ Undervalued' : '▼ Overvalued'} by {Math.abs(computedMarginOfSafety).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <button
                      className="dcf-ai-btn"
                      onClick={() => {
                        setActiveTab('chat')
                        handleSend(`Perform a detailed discounted cash flow (DCF) valuation breakdown for ${chartData.ticker}. Given an expected growth rate of ${dcfGrowthRate}% and discount rate of ${dcfDiscountRate}%, does current price of ${chartData.currentPrice} offer an adequate margin of safety?`)
                      }}
                    >
                      🤖 Request Full AI DCF Report
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : activeTab === 'heatmap' ? (
            /* TAB 2: Market Sector Heatmap */
            <div className="tab-pane heatmap-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">🗺️ Live Market Sector Treemap</h2>
                  <p className="pane-sub">Real-time performance across major industry verticals. Click any card to launch its quant studio.</p>
                </div>
              </div>

              {heatmapLoading ? (
                <div className="studio-loader">
                  <div className="radar-wave" />
                  <span>Loading Multi-Sector Breadth...</span>
                </div>
              ) : (
                <div className="heatmap-sectors-wrap">
                  {heatmapData.map((sec, i) => (
                    <div key={i} className="sector-group-card">
                      <h3 className="sector-title">{sec.sector}</h3>
                      <div className="sector-stocks-grid">
                        {sec.stocks.map(s => {
                          const isUp = s.changePercent >= 0
                          return (
                            <div
                              key={s.ticker}
                              className={`heatmap-stock-tile ${isUp ? 'tile-up' : 'tile-down'}`}
                              onClick={() => {
                                setChartTicker(s.ticker)
                                setActiveTab('chart')
                              }}
                            >
                              <div className="tile-ticker">{s.ticker}</div>
                              <div className="tile-name">{s.name}</div>
                              <div className="tile-price">{s.price.toLocaleString()}</div>
                              <div className="tile-change">
                                {isUp ? '▲' : '▼'} {Math.abs(s.changePercent).toFixed(2)}%
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'watchlist' ? (
            /* TAB 3: Watchlist */
            <div className="tab-pane watchlist-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">⭐ Quantitative Watchlist</h2>
                  <p className="pane-sub">Real-time prices, 7-day sparklines, and 1-click agent intelligence.</p>
                </div>
                <div className="add-ticker-bar">
                  <input
                    type="text"
                    placeholder="Enter ticker (e.g. INFY.NS, NVDA, TSLA)..."
                    value={newWatchlistTicker}
                    onChange={e => setNewWatchlistTicker(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addWatchlistTicker()}
                  />
                  <button onClick={addWatchlistTicker}>+ Add Ticker</button>
                </div>
              </div>

              <div className="watchlist-grid">
                {watchlist.map(ticker => {
                  const q = watchlistQuotes[ticker]
                  const isUp = (q?.change || 0) >= 0
                  return (
                    <div key={ticker} className="watchlist-card">
                      <div className="card-top">
                        <div>
                          <h3 className="card-ticker">{ticker}</h3>
                          <span className="card-currency">{q?.currency || 'USD'}</span>
                        </div>
                        <button className="card-remove-btn" onClick={() => removeWatchlistTicker(ticker)}>
                          ✕
                        </button>
                      </div>

                      <div className="card-price-row">
                        <div className="card-current-price">
                          {q ? `${q.price.toLocaleString()}` : <span className="shimmer-text">Loading...</span>}
                        </div>
                        {q && (
                          <div className={`card-delta-badge ${isUp ? 'up' : 'down'}`}>
                            {isUp ? '▲' : '▼'} {Math.abs(q.changePercent).toFixed(2)}%
                          </div>
                        )}
                      </div>

                      {q?.sparkline && (
                        <div className="card-chart">
                          <SparklineChart data={q.sparkline} isUp={isUp} />
                        </div>
                      )}

                      <div className="card-actions">
                        <button
                          className="card-analyze-btn"
                          onClick={() => {
                            setChartTicker(ticker)
                            setActiveTab('chart')
                          }}
                        >
                          📈 View Quant Chart & DCF
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : activeTab === 'duel' ? (
            /* TAB 4: Duel Arena */
            <div className="tab-pane duel-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">⚔️ Stock Versus Arena</h2>
                  <p className="pane-sub">Pit any two assets head-to-head for an algorithmic AI breakdown.</p>
                </div>
              </div>

              <div className="duel-arena-card">
                <div className="duel-fighters">
                  <div className="fighter-box">
                    <label>Contender Alpha</label>
                    <input
                      type="text"
                      value={duelStock1}
                      onChange={e => setDuelStock1(e.target.value)}
                      placeholder="e.g. TCS.NS or AAPL"
                    />
                  </div>
                  <div className="duel-vs-circle">VS</div>
                  <div className="fighter-box">
                    <label>Contender Beta</label>
                    <input
                      type="text"
                      value={duelStock2}
                      onChange={e => setDuelStock2(e.target.value)}
                      placeholder="e.g. INFY.NS or MSFT"
                    />
                  </div>
                </div>

                <button className="duel-launch-btn" onClick={startDuel}>
                  ⚡ Launch Algorithmic Duel
                </button>
              </div>
            </div>
          ) : (
            /* TAB 5: Chat AI Analysis Terminal */
            <div className="tab-pane chat-pane">
              {messages.length === 0 ? (
                <div className="welcome-hero">
                  <div className="hero-status-pill">
                    <span className="pulse-beacon" />
                    <span>Live Financial Neural Engine Active</span>
                  </div>

                  <h2 className="hero-main-title">
                    Master the Markets with <br />
                    <span className="title-gradient">Institutional Intelligence</span>
                  </h2>

                  <p className="hero-description">
                    Direct access to real-time stock quotes, cash flows, insider trades, institutional ownership, and
                    autonomous quant agent reasoning.
                  </p>

                  <div className="hero-cards-grid">
                    {PRESET_QUERIES.map((preset, i) => (
                      <div
                        key={i}
                        className="hero-preset-card"
                        onClick={() => handleSend(preset.text)}
                        style={{ animationDelay: `${i * 0.07}s` }}
                      >
                        <span className="preset-icon">{preset.icon}</span>
                        <div className="preset-content">
                          <h4 className="preset-title">{preset.title}</h4>
                          <p className="preset-text">{preset.text}</p>
                        </div>
                        <span className="preset-arrow">↗</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="conversation-thread">
                  {messages.map(msg => (
                    <div key={msg.id} className={`chat-message-row msg-${msg.role}`}>
                      <div className="msg-avatar-col">
                        {msg.role === 'user' ? (
                          <div className="user-avatar-badge">YOU</div>
                        ) : (
                          <div className="ai-avatar-badge">⚡</div>
                        )}
                      </div>

                      <div className="msg-content-col">
                        <div className="msg-header-meta">
                          <span className="sender-tag">
                            {msg.role === 'user' ? 'Investor' : 'MarketInsight Intelligence'}
                          </span>
                          <span className="time-tag">{formatTime(msg.timestamp)}</span>
                        </div>

                        <div className="msg-bubble-box">
                          {msg.content ? (
                            <div className="rich-markdown-body">
                              {msg.content.split('\n').map((line, idx) => {
                                if (line.startsWith('### ')) {
                                  return <h4 key={idx} className="md-h4">{line.replace('### ', '')}</h4>
                                }
                                if (line.startsWith('## ')) {
                                  return <h3 key={idx} className="md-h3">{line.replace('## ', '')}</h3>
                                }
                                if (line.startsWith('# ')) {
                                  return <h2 key={idx} className="md-h2">{line.replace('# ', '')}</h2>
                                }
                                if (line.startsWith('- ') || line.startsWith('* ')) {
                                  return (
                                    <div key={idx} className="md-list-item">
                                      <span className="bullet">▸</span>
                                      <span>{line.substring(2)}</span>
                                    </div>
                                  )
                                }
                                if (!line.trim()) {
                                  return <div key={idx} className="md-spacer" />
                                }
                                return <p key={idx} className="md-paragraph">{line}</p>
                              })}
                            </div>
                          ) : msg.role === 'assistant' && loading ? (
                            <div className="quant-calculating">
                              <span className="radar-wave" />
                              <span className="calc-text">Querying real-time market data & financial reports...</span>
                            </div>
                          ) : null}
                        </div>

                        {msg.role === 'assistant' && msg.content && (
                          <div className="msg-toolbar">
                            <button
                              className="tool-btn"
                              onClick={() => handleCopy(msg.id, msg.content)}
                              title="Copy to clipboard"
                            >
                              {copiedId === msg.id ? '✓ Copied' : '📋 Copy Analysis'}
                            </button>
                            <button
                              className="tool-btn"
                              onClick={() => handleExport(msg.content)}
                              title="Export Markdown Report"
                            >
                              📥 Export Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          )}

          {/* Unified Input Terminal */}
          <div className="terminal-dock">
            <div className="dock-container">
              <div className="dock-glass-wrap">
                <textarea
                  ref={textareaRef}
                  className="dock-input"
                  placeholder={isListening ? '🎙️ Listening to your voice query...' : 'Ask about any stock, financial statement, valuation, or market trend...'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={loading}
                />

                <div className="dock-actions">
                  <button
                    className={`dock-btn mic-btn ${isListening ? 'listening' : ''}`}
                    onClick={toggleVoice}
                    title={isListening ? 'Stop recording' : 'Voice search'}
                  >
                    {isListening ? (
                      <span className="voice-waves">
                        <span /><span /><span />
                      </span>
                    ) : (
                      '🎙️'
                    )}
                  </button>

                  <button
                    className={`dock-btn send-btn ${input.trim() && !loading ? 'ready' : ''}`}
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    title="Send query"
                  >
                    {loading ? <span className="dock-spinner" /> : '➤'}
                  </button>
                </div>
              </div>
              <div className="dock-meta-info">
                <span>MarketInsight AI v2.0</span> · <span>Deterministic Quant Math & Live Exchange Data</span> ·{' '}
                <span>Shift+Enter for multi-line</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
