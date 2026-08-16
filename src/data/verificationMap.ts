/* ============================================================
   Verification Map — SPEC-004 §9
   FRONTEND ASSUMPTION: This hardcodes the mapping between
   remediations and their acceptance tests.
   ============================================================ */

export interface VerificationMapping {
  remediation_id: string;
  verification_ids: string[];
  confidence: 'high' | 'low';
}

export const VERIFICATION_MAP: Record<string, VerificationMapping> = {
  'rem-ticket-classification': {
    remediation_id: 'rem-ticket-classification',
    verification_ids: ['verify-ticket-classification'],
    confidence: 'high',
  },
  'rem-block-device-code': {
    remediation_id: 'rem-block-device-code',
    verification_ids: ['verify-device-code-policy'],
    confidence: 'high',
  },
  'rem-retire-ropc': {
    remediation_id: 'rem-retire-ropc',
    verification_ids: ['verify-ropc-retirement'],
    confidence: 'high',
  },
  'rem-block-legacy-auth': {
    remediation_id: 'rem-block-legacy-auth',
    verification_ids: [],
    confidence: 'low', // No dedicated acceptance test defined
  },
  'rem-phishing-resistant-mfa': {
    remediation_id: 'rem-phishing-resistant-mfa',
    verification_ids: ['verify-phishing-resistant-mfa'],
    confidence: 'high',
  },
  'rem-incident-containment': {
    remediation_id: 'rem-incident-containment',
    verification_ids: ['verify-containment', 'verify-rogue-device', 'verify-spo-od-exfil'],
    confidence: 'high',
  },
  'rem-sharing-least-privilege': {
    remediation_id: 'rem-sharing-least-privilege',
    verification_ids: ['verify-sharing-config'],
    confidence: 'high',
  },
  'rem-kali365-hunt': {
    remediation_id: 'rem-kali365-hunt',
    verification_ids: ['verify-kali365-ioc-hunt', 'verify-octolink-behavior', 'verify-kali365-service-scope'],
    confidence: 'high',
  },
};
