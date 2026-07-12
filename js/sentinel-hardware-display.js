/**
 * sentinel-hardware-display.js
 * Specialized formatting and display helpers for Hardware / Cyberdeck / Physical Command Deck use.
 *
 * Use this alongside sentinel-integration.js when displaying on repurposed devices
 * (Galaxy S21, old laptops, custom cyberdecks, etc.).
 */

import { formatForCyberdeck, getCombinedSentinelStatus } from './sentinel-integration.js';

/**
 * Get data optimized for small / low-power hardware displays
 */
export async function getHardwareOptimizedStatus() {
  const status = await getCombinedSentinelStatus();
  const cyber = formatForCyberdeck(status);

  return {
    // Compact single-line summaries
    summary: `${cyber.security} | Q:${cyber.quantum} | APY:${cyber.apy}`,
    threat: cyber.threat,
    defai: cyber.defai,
    // Full structured data
    full: status,
    // Simple text block for e-ink / small screens
    textBlock: `
Sentinel L3
Security: ${cyber.security}
Quantum: ${cyber.quantum}
APY: ${cyber.apy}
DeFAI: ${cyber.defai}
Updated: ${cyber.updated}
    `.trim(),
  };
}

/**
 * Render a very lightweight text version (great for terminal or small displays)
 */
export async function renderTextOnlyStatus(elementOrId) {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return;

  const data = await getHardwareOptimizedStatus();
  el.innerHTML = `<pre style="font-family: monospace; white-space: pre; font-size: 13px; line-height: 1.3;">${data.textBlock}</pre>`;
}

/**
 * Example: Update a physical display element every N seconds
 */
export function startHardwareDisplayUpdater(elementOrId, intervalMs = 60000) {
  const update = async () => {
    await renderTextOnlyStatus(elementOrId);
  };

  update();
  return setInterval(update, intervalMs);
}