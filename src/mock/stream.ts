/* ============================================================
   Mock Stream — SPEC §9 (Assistant)
   Async generator for token-by-token streaming at ~18ms.
   ============================================================ */

export async function* streamTokens(
  text: string,
  delayMs = 18,
): AsyncGenerator<string, void, unknown> {
  const words = text.split(/(\s+)/);
  for (const word of words) {
    yield word;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export const assistantScripts: Record<string, string> = {
  'summarize-alert-0007':
    'Alert **alert-2026-0007** is a *critical* remote code execution vulnerability in Acme VPN Gateway versions prior to 5.4.2 (CVE-2026-41007, CVSS 9.8). Active exploitation has been confirmed by GreyNoise and Shadowserver. The vulnerability affects **17 hosts** (5 production tier-0) across Mumbai and Bangalore. Risk score: **94/100**. Two actions have been proposed: emergency patch (RB-114, disruptive) and WAF block (RB-089, non-disruptive). Awaiting approval from On-Call Lead.',

  'risk-explanation':
    'The risk score of **94/100** is computed using rule pack v1.4.2. The breakdown: Severity contributes +34 (CVSS 9.8), Asset Criticality +22 (5 production tier-0 gateways), Exposure +18 (2 hosts externally reachable), Active Evidence +14 (exploitation observed in the wild), Recurrence +8 (prior incident INC-2025-0412 incomplete), and Compensating Controls −2 (partial WAF coverage).',

  'compliance-status':
    'CERT-In reporting status: **1 pending** Annexure A submission for alert-2026-0007 (deadline 15:53:41 IST). Time remaining: review the countdown in the Alerts view. Retention: 3 of 4 indices compliant, 1 at risk (audit-trail-primary at 174/180 days). All data stored in ap-south-1 (in-country).',

  'fallback':
    'I can only answer from indexed evidence. Try one of the suggested questions, or scope the conversation to a specific alert or entity by dragging its chip into this panel.',
};

export async function* streamLLMResponse(
  prompt: string,
  contextId?: string,
): AsyncGenerator<string, void, unknown> {
  const lowercasePrompt = prompt.toLowerCase();
  
  let responseText = assistantScripts['fallback'];

  if (lowercasePrompt.includes('alert-2026-0007') || contextId === 'alert-2026-0007') {
    if (lowercasePrompt.includes('risk') || lowercasePrompt.includes('why')) {
      responseText = assistantScripts['risk-explanation'];
    } else {
      responseText = assistantScripts['summarize-alert-0007'];
    }
  } else if (lowercasePrompt.includes('compliance') || lowercasePrompt.includes('cert-in')) {
    responseText = assistantScripts['compliance-status'];
  }

  yield* streamTokens(responseText);
}
