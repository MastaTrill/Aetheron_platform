import React, { useEffect, useState } from 'react';
import { 
  initSentinelIntegration, 
  getCombinedSentinelStatus, 
  startSentinelPolling 
} from '../sentinel-integration.js';

/**
 * SentinelStatus - React component for Aetheron Platform
 * 
 * Usage:
 *   <SentinelStatus />
 *   or with props: <SentinelStatus pollInterval={15000} showDeFAI={true} />
 */
export default function SentinelStatus({ 
  pollInterval = 30000, 
  showDeFAI = true,
  className = '' 
}) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stopPolling;

    const init = async () => {
      try {
        await initSentinelIntegration();
        const initial = await getCombinedSentinelStatus();
        setStatus(initial);
        setLoading(false);

        // Start polling
        stopPolling = startSentinelPolling((newStatus) => {
          setStatus(newStatus);
        }, pollInterval).stop;
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    init();

    return () => {
      if (stopPolling) stopPolling();
    };
  }, [pollInterval]);

  if (loading) {
    return <div className={`sentinel-react-widget loading ${className}`}>Loading Sentinel L3...</div>;
  }

  if (error || !status?.isHealthy) {
    return (
      <div className={`sentinel-react-widget error ${className}`}>
        Sentinel L3 temporarily unavailable
      </div>
    );
  }

  const { health, quantum, yield: yieldData, defai } = status;

  return (
    <div className={`sentinel-react-widget ${className}`}>
      <div className="header">
        <h3>🛡️ Sentinel L3</h3>
        <span className={`badge ${health.threatLevel === 0 ? 'secure' : 'warning'}`}>
          {health.threatLevel === 0 ? 'SECURE' : 'MONITORING'}
        </span>
      </div>

      <div className="metrics">
        <div className="metric">
          <span>Security</span>
          <strong>{health.securityScore}/1000</strong>
        </div>
        <div className="metric">
          <span>Quantum</span>
          <strong>{quantum.coherence}%</strong>
        </div>
        <div className="metric">
          <span>APY</span>
          <strong>{yieldData.avgAPY}%</strong>
        </div>
        {showDeFAI && (
          <div className="metric">
            <span>DeFAI</span>
            <strong>{defai?.teeVerified ? 'TEE ✓' : 'Standard'}</strong>
          </div>
        )}
      </div>

      <div className="footer">
        Updated {new Date(status.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}

// Optional: Add some basic styles if using CSS modules or Tailwind
// You can import './SentinelStatus.css' if needed