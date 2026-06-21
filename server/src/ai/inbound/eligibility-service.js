export async function checkEligibility({
  platform,
  chat,
  agent,
  message,
  humanTakeoverActive,
}) {
  if (!platform || !platform.enabled) {
    return { eligible: false, reason: 'platform_disabled' };
  }

  if (!message) {
    return { eligible: false, reason: 'no_message' };
  }

  if (humanTakeoverActive) {
    return { eligible: false, reason: 'human_takeover_active' };
  }

  if (!agent || agent.status !== 'active') {
    return { eligible: false, reason: 'no_active_agent' };
  }

  if (!chat) {
    return { eligible: false, reason: 'no_chat' };
  }

  return { eligible: true, reason: null };
}
