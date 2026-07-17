/**
 * sentinel-abi-loader.js
 * Helper to dynamically load full ABIs from your Sentinel repo export
 * or from a local JSON file.
 *
 * Recommended usage:
 *   import { loadSentinelABIs } from './js/sentinel-abi-loader.js';
 *   const abis = await loadSentinelABIs();
 *   // Then pass to sentinel-integration.js or use directly
 */

export async function loadSentinelABIs(source = 'local') {
  if (source === 'local') {
    // Option 1: Load from a JSON file you exported
    try {
      const response = await fetch('/abis/sentinel-abis.json');
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('No local ABI file found. Using minimal ABIs.');
    }
  }

  // Fallback: Return minimal working ABIs (same as in sentinel-integration.js)
  return {
    CoreLoop: [
      "function getSystemHealth() view returns (uint256 securityScore, uint256 threatLevel, uint256 uptime)",
      "function getQuantumState() view returns (uint256 coherence, uint256 entropy, uint256 superpositionStrength)",
      "function getRecentThreatIntercepts(uint256 count) view returns (tuple(uint256 id, uint256 timestamp, string threatType, uint256 severity)[]) ",
      "function getYieldMetrics() view returns (uint256 baseAPY, uint256 avgAPY, uint256 totalYieldGenerated)",
      "function getAIAgentStatus() view returns (uint8 autonomyLevel, bool teeVerified, uint256 lastDecisionTimestamp)",
      "event ThreatIntercepted(uint256 indexed id, uint256 timestamp, string threatType, uint256 severity)",
    ],
    QuantumGuard: [
      "function getQuantumCoherence() view returns (uint256)",
      "function getSecurityScore() view returns (uint256)",
    ]
  };
}

// Helper to update the main integration config with full ABIs
export async function applyFullABIsToIntegration(integrationModule) {
  const fullABIs = await loadSentinelABIs();
  // You can extend the module here if needed
  console.log('[Sentinel] Full ABIs loaded:', Object.keys(fullABIs));
  return fullABIs;
}