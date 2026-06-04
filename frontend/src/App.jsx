import React, { useState } from 'react'
import Sidebar        from './components/Sidebar'
import TopBar         from './components/TopBar'
import FeedPanel      from './components/FeedPanel'
import ResultPanel    from './components/ResultPanel'
import EvolutionChart from './components/EvolutionChart'
import HistoryView    from './components/HistoryView'
import AnalyticsView  from './components/AnalyticsView'
import TxDetailModal  from './components/TxDetailModal'
import useSimulator   from './hooks/useSimulator'

export default function App() {
  const [speed,     setSpeed]     = useState('normal')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selected,  setSelected]  = useState(null)

  const { feed, history, evoData, stats, running, apiStatus, toggle } = useSimulator(speed)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        stats={stats} speed={speed} setSpeed={setSpeed}
        running={running} toggle={toggle}
      />

      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        <TopBar stats={stats} running={running} activeTab={activeTab} apiStatus={apiStatus} />

        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

          {activeTab === 'dashboard' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'12px', gap:'12px', overflow:'hidden' }}>
              <div style={{ flex:1, display:'flex', gap:'12px', minHeight:0 }}>
                <FeedPanel  feed={feed}  onSelect={setSelected} />
                <ResultPanel feed={feed} onSelect={setSelected} />
              </div>
              <div style={{ flexShrink:0 }}>
                <EvolutionChart evoData={evoData} />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ flex:1, padding:'14px 16px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <HistoryView history={history} onSelect={setSelected} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div style={{ flex:1, padding:'14px 16px', overflowY:'auto' }}>
              <AnalyticsView history={history} stats={stats} />
            </div>
          )}
        </div>
      </div>

      {selected && <TxDetailModal row={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
