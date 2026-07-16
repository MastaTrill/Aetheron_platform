/**
 * sentinel-integration.js
 * 
 * Enhanced production-ready integration module for Aetheron Sentinel L3
 * into the Aetheron Platform dashboards and Command Deck.
 *
 * Features:
 * - On-chain reads for health, quantum state, threats, yield
 * - Real-time event listening for threat intercepts
 * - DeFAI / TEE AI agent status hooks (verifiable AI governance)
 * - Hardware / Cyberdeck data formatting helpers
 * - Robust polling with pause/resume + retry logic
 * - Easy UI update functions + example widget
 * - Production notes for ABIs, addresses, and error handling
 *
 * Usage:
 *   import { initSentinelIntegration, getCombinedSentinelStatus, startSentinelPolling, updateSentinelDashboardUI } from './sentinel-integration.js';
 *
 * Place in root or /js/ folder. Update SENTINEL_CONFIG with real addresses.
 */

import { ethers } from 'ethers';

// ============================================
// CONFIGURATION
// ============================================
const SENTINEL_CONFIG = {
  CORE_LOOP_ADDRESS: '0xYOUR_SENTINEL_CORE_LOOP_ADDRESS',      // SentinelCoreLoop.sol
  QUANTUM_GUARD_ADDRESS: '0xYOUR_SENTINEL_QUANTUM_GUARD_ADDRESS', // SentinelQuantumGuard.sol
  // Future: Add YieldMaximizer, AMMStrategy, etc.

  RPC_URL: 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
  CHAIN_ID: 137,

  // Polling defaults
  DEFAULT_POLL_INTERVAL: 30000, // 30 seconds
  MAX_RETRIES: 3,
};

// ============================================
// ABIs (Minimal viable + examples - expand with export:abis from Sentinel repo)
// ============================================
const SENTINEL_ABIS = {
  CoreLoop: [
    "function getSystemHealth() view returns (uint256 securityScore, uint256 threatLevel, uint256 uptime)",
    "function getQuantumState() view returns (uint256 coherence, uint256 entropy, uint256 superpositionStrength)",
    "function getRecentThreatIntercepts(uint256 count) view returns (tuple(uint256 id, uint256 timestamp, string threatType, uint256 severity)[]) ",
    "function getYieldMetrics() view returns (uint256 baseAPY, uint256 avgAPY, uint256 totalYieldGenerated)",
    "event ThreatIntercepted(uint256 indexed id, uint256 timestamp, string threatType, uint256 severity)",
    // DeFAI / AI Agent hooks (add when contracts support)
    "function getAIAgentStatus() view returns (uint8 autonomyLevel, bool teeVerified, uint256 lastDecisionTimestamp)",
  ],
  QuantumGuard: [
    "function getQuantumCoherence() view returns (uint256)",
    "function getSecurityScore() view returns (uint256)",
  ],
};

// ============================================
// STATE
// ============================================
let provider;
let coreLoopContract;
let _quantumGuardContract;
let _isInitialized = false;
let pollingIntervalId = null;

// ============================================
// INITIALIZATION
// ============================================
export async function initSentinelIntegration(customConfig = {}) {
  try {
    Object.assign(SENTINEL_CONFIG, customConfig);

    provider = window.ethereum 
      ? new ethers.BrowserProvider(window.ethereum) 
      : new ethers.JsonRpcProvider(SENTINEL_CONFIG.RPC_URL);

    const network = await provider.getNetwork();
    if (Number(network.chainId) !== SENTINEL_CONFIG.CHAIN_ID) {
      console.warn(`Warning: Connected to chain ${network.chainId}, expected Polygon (${SENTINEL_CONFIG.CHAIN_ID})`);
    }

    if (SENTINEL_CONFIG.CORE_LOOP_ADDRESS && SENTINEL_CONFIG.CORE_LOOP_ADDRESS !== '0xYOUR_SENTINEL_CORE_LOOP_ADDRESS') {
      coreLoopContract = new ethers.Contract(
        SENTINEL_CONFIG.CORE_LOOP_ADDRESS,
        SENTINEL_ABIS.CoreLoop,
        provider
      );
    }

    if (SENTINEL_CONFIG.QUANTUM_GUARD_ADDRESS && SENTINEL_CONFIG.QUANTUM_GUARD_ADDRESS !== '0xYOUR_SENTINEL_QUANTUM_GUARD_ADDRESS') {
      _quantumGuardContract = new ethers.Contract(
        SENTINEL_CONFIG.QUANTUM_GUARD_ADDRESS,
        SENTINEL_ABIS.QuantumGuard,
        provider
      );
    }

    _isInitialized = true;
    console.log('%c[Sentinel] Integration initialized successfully', 'color: #22c55e');
    return true;
  } catch (error) {
    console.error('[Sentinel] Initialization failed:', error);
    return false;
  }
}

// ============================================
// CORE DATA FETCHERS (with retry)
// ============================================
async function withRetry(fn, retries = SENTINEL_CONFIG.MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export async function getSentinelHealth() {
  if (!coreLoopContract) return { error: 'CoreLoop not initialized' };
  return withRetry(async () => {
    const [securityScore, threatLevel, uptime] = await coreLoopContract.getSystemHealth();
    return {
      securityScore: Number(securityScore),
      threatLevel: Number(threatLevel),
      uptime: Number(uptime),
      timestamp: Date.now(),
    };
  });
}

export async function getQuantumState() {
  if (!coreLoopContract) return { error: 'CoreLoop not initialized' };
  return withRetry(async () => {
    const [coherence, entropy, superposition] = await coreLoopContract.getQuantumState();
    return {
      coherence: Number(coherence),
      entropy: Number(entropy),
      superpositionStrength: Number(superposition),
      timestamp: Date.now(),
    };
  });
}

export async function getRecentThreatIntercepts(count = 5) {
  if (!coreLoopContract) return { error: 'CoreLoop not initialized' };
  return withRetry(async () => {
    const intercepts = await coreLoopContract.getRecentThreatIntercepts(count);
    return intercepts.map(item => ({
      id: Number(item.id),
      timestamp: Number(item.timestamp) * 1000,
      threatType: item.threatType,
      severity: Number(item.severity),
    }));
  });
}

export async function getSentinelYieldMetrics() {
  if (!coreLoopContract) return { error: 'CoreLoop not initialized' };
  return withRetry(async () => {
    const [baseAPY, avgAPY, totalYield] = await coreLoopContract.getYieldMetrics();
    return {
      baseAPY: Number(baseAPY) / 100,
      avgAPY: Number(avgAPY) / 100,
      totalYieldGenerated: ethers.formatUnits(totalYield, 18),
      timestamp: Date.now(),
    };
  });
}

// DeFAI / TEE AI Agent Status (next-level enhancement)
export async function getDeFAIAgentStatus() {
  if (!coreLoopContract) return { error: 'CoreLoop not initialized' };
  try {
    // Placeholder - implement when contract exposes getAIAgentStatus()
    const [autonomyLevel, teeVerified, lastDecision] = await coreLoopContract.getAIAgentStatus();
    return {
      autonomyLevel: Number(autonomyLevel), // 0-3 as per architecture
      teeVerified: Boolean(teeVerified),
      lastDecisionTimestamp: Number(lastDecision) * 1000,
      timestamp: Date.now(),
    };
  } catch {
    return {
      autonomyLevel: null,
      teeVerified: false,
      lastDecisionTimestamp: null,
      note: 'DeFAI AI agent functions not yet exposed on this deployment',
    };
  }
}

export async function getCombinedSentinelStatus() {
  const [health, quantum, yieldData, defai] = await Promise.all([
    getSentinelHealth().catch(e => ({ error: e.message })),
    getQuantumState().catch(e => ({ error: e.message })),
    getSentinelYieldMetrics().catch(e => ({ error: e.message })),
    getDeFAIAgentStatus().catch(e => ({ error: e.message })),
  ]);

  return {
    health,
    quantum,
    yield: yieldData,
    defai,
    lastUpdated: Date.now(),
    isHealthy: !health.error && !quantum.error,
  };
}

// ============================================
// REAL-TIME EVENTS
// ============================================
export function listenForThreatEvents(callback) {
  if (!coreLoopContract) {
    console.warn('[Sentinel] Cannot listen - contract not ready');
    return () => {};
  }

  const filter = coreLoopContract.filters.ThreatIntercepted();
  const listener = (id, timestamp, threatType, severity, event) => {
    callback({
      id: Number(id),
      timestamp: Number(timestamp) * 1000,
      threatType,
      severity: Number(severity),
      txHash: event.log?.transactionHash,
    });
  };

  coreLoopContract.on(filter, listener);
  return () => coreLoopContract.off(filter, listener);
}

// ============================================
// POLLING WITH ENHANCED CONTROLS
// ============================================
export function startSentinelPolling(onUpdate, intervalMs = SENTINEL_CONFIG.DEFAULT_POLL_INTERVAL) {
  if (pollingIntervalId) clearInterval(pollingIntervalId);

  const poll = async () => {
    try {
      const status = await getCombinedSentinelStatus();
      onUpdate(status);
    } catch (err) {
      console.error('[Sentinel] Polling error:', err);
    }
  };

  poll();
  pollingIntervalId = setInterval(poll, intervalMs);

  return {
    stop: () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
      }
    },
    restart: (newInterval) => {
      if (pollingIntervalId) clearInterval(pollingIntervalId);
      return startSentinelPolling(onUpdate, newInterval || intervalMs);
    }
  };
}

// ============================================
// HARDWARE / CYBERDECK HELPERS (next-level)
// ============================================
export function formatForCyberdeck(status) {
  return {
    security: `${status.health?.securityScore || '??'}/1000`,
    threat: status.health?.threatLevel === 0 ? 'LOW' : (status.health?.threatLevel || '??'),
    quantum: `${status.quantum?.coherence || '??'}% coherence`,
    apy: `${status.yield?.avgAPY || '??'}% protected`,
    defai: status.defai?.teeVerified ? 'TEE VERIFIED' : 'STANDARD',
    updated: new Date(status.lastUpdated).toLocaleTimeString(),
  };
}

// ============================================
// UI UPDATE HELPERS
// ============================================
export async function updateSentinelDashboardUI(containerId = 'sentinel-status-panel') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[Sentinel] Container #${containerId} not found`);
    return;
  }

  const status = await getCombinedSentinelStatus();

  if (status.error || !status.isHealthy) {
    container.innerHTML = `
      <div class="sentinel-error">
        <strong>Sentinel L3</strong><br>
        Status temporarily unavailable<br>
        <small>${status.error || 'Check contract connection'}</small>
      </div>`;
    return;
  }

  const cyber = formatForCyberdeck(status);

  container.innerHTML = `
    <div class="sentinel-widget">
      <div class="sentinel-header">
        <h3>🛡️ Sentinel L3</h3>
        <span class="status-badge ${status.health.threatLevel === 0 ? 'secure' : 'warning'}">
          ${cyber.threat}
        </span>
      </div>

      <div class="metrics-grid">
        <div class="metric">
          <div class="label">Security Score</div>
          <div class="value">${cyber.security}</div>
        </div>
        <div class="metric">
          <div class="label">Quantum Coherence</div>
          <div class="value">${cyber.quantum}</div>
        </div>
        <div class="metric">
          <div class="label">Protected APY</div>
          <div class="value">${cyber.apy}</div>
        </div>
        <div class="metric">
          <div class="label">DeFAI Status</div>
          <div class="value">${cyber.defai}</div>
        </div>
      </div>

      <div class="last-updated">Updated: ${cyber.updated}</div>
    </div>
  `;
}

// Auto-init helper for convenience (optional)
if (typeof window !== 'undefined') {
  // window.initSentinel = initSentinelIntegration; // expose if needed
}

export { initSentinelIntegration as default };