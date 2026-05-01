import React from 'react';

function App() {
  const [tab, setTab] = React.useState(0);

  return (
    <div>
      <div style={{background: '#1976d2', color: 'white', padding: '20px', textAlign: 'center'}}>
        <h1>🎯 Baldwin Dashboard (React)</h1>
        <p>Post-Sale Performance & Retention Platform</p>
      </div>

      <div style={{display: 'flex', justifyContent: 'center', background: 'white', borderBottom: '1px solid #ddd'}}>
        {['📤 Upload', '📊 Dashboard', '📈 Analytics', '🏆 Promotion'].map((label, idx) => (
          <button
            key={idx}
            style={{
              background: 'none',
              border: 'none',
              padding: '15px 30px',
              cursor: 'pointer',
              fontSize: '16px',
              borderBottom: tab === idx ? '3px solid #1976d2' : '3px solid transparent',
              color: tab === idx ? '#1976d2' : 'inherit'
            }}
            onClick={() => setTab(idx)}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{maxWidth: '1200px', margin: '20px auto', padding: '0 20px'}}>
        {tab === 0 && (
          <div style={{background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
            <h2>Upload NAA Records</h2>
            <p>Drag and drop NAA CRM screenshots or CSV files</p>
            <div style={{
              border: '2px dashed #1976d2',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              background: '#f8f9ff'
            }}>
              <div style={{fontSize: '3em', marginBottom: '10px'}}>📄</div>
              <div>Drop files here or click to browse</div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
              <div style={{background: 'white', borderRadius: '8px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                <h3>Book Relevance Score</h3>
                <div style={{fontSize: '3em', color: '#4caf50'}}>78</div>
                <div style={{width: '100%', height: '20px', background: '#e0e0e0', borderRadius: '10px'}}>
                  <div style={{width: '78%', height: '100%', background: '#4caf50', borderRadius: '10px'}}></div>
                </div>
              </div>
              <div style={{background: 'white', borderRadius: '8px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
                <h3>Agent Effectiveness Score</h3>
                <div style={{fontSize: '3em', color: '#ff9800'}}>85</div>
                <div style={{width: '100%', height: '20px', background: '#e0e0e0', borderRadius: '10px'}}>
                  <div style={{width: '85%', height: '100%', background: '#ff9800', borderRadius: '10px'}}></div>
                </div>
              </div>
            </div>
            <div style={{background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
              <h3>Performance Metrics</h3>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px'}}>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '1.8em', fontWeight: 'bold', color: '#1976d2'}}>147</div>
                  <div style={{color: '#666'}}>Total Policies</div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '1.8em', fontWeight: 'bold', color: '#1976d2'}}>89</div>
                  <div style={{color: '#666'}}>Total Clients</div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '1.8em', fontWeight: 'bold', color: '#1976d2'}}>$28,450</div>
                  <div style={{color: '#666'}}>Monthly Premium</div>
                </div>
                <div style={{textAlign: 'center'}}>
                  <div style={{fontSize: '1.8em', fontWeight: 'bold', color: '#1976d2'}}>$45,600</div>
                  <div style={{color: '#666'}}>YTD Commission</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 2 && (
          <div style={{background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
            <h2>Book Analytics</h2>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#f5f5f5'}}>
                  <th style={{padding: '12px', textAlign: 'left'}}>Client</th>
                  <th style={{padding: '12px', textAlign: 'left'}}>Policy #</th>
                  <th style={{padding: '12px', textAlign: 'left'}}>Carrier</th>
                  <th style={{padding: '12px', textAlign: 'right'}}>Premium</th>
                  <th style={{padding: '12px', textAlign: 'left'}}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd'}}>John Smith</td>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd'}}>POL-001</td>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd'}}>Mutual of Omaha</td>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'right'}}>$250</td>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd'}}><span style={{background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '12px'}}>Active</span></td>
                </tr>
                <tr>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd'}}>Sarah Johnson</td>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd'}}>POL-002</td>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd'}}>AIG</td>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'right'}}>$180</td>
                  <td style={{padding: '12px', borderBottom: '1px solid #ddd'}}><span style={{background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '12px'}}>Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {tab === 3 && (
          <div style={{background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
            <h2>Promotion Tracker</h2>
            <div style={{marginBottom: '15px', padding: '15px', background: '#e8f5e9', borderRadius: '8px'}}>
              <div style={{fontWeight: 'bold'}}>✓ Associate Agent</div>
              <div style={{fontSize: '0.9em', color: '#666'}}>Completed all requirements</div>
            </div>
            <div style={{marginBottom: '15px', padding: '15px', background: '#e8f5e9', borderRadius: '8px'}}>
              <div style={{fontWeight: 'bold'}}>✓ Senior Agent</div>
              <div style={{fontSize: '0.9em', color: '#666'}}>Completed all requirements</div>
            </div>
            <div style={{marginBottom: '15px', padding: '15px', background: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #1976d2'}}>
              <div style={{fontWeight: 'bold'}}>Team Leader (Current)</div>
              <div style={{fontSize: '0.9em', color: '#666'}}>
                • Recruit 3 new agents (1/3)<br/>
                • Achieve Book Relevance Score of 80+ (78/100)<br/>
                • Maintain 100+ active policies (147/100) ✓<br/>
                • Complete leadership training (Pending)
              </div>
            </div>
            <div style={{padding: '15px', background: '#f5f5f5', borderRadius: '8px'}}>
              <div style={{fontWeight: 'bold'}}>Agency Manager</div>
              <div style={{fontSize: '0.9em', color: '#666'}}>
                • Build team of 10+ agents<br/>
                • Achieve combined book premium of $50K/month<br/>
                • Maintain personal Book Relevance Score of 85+
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
