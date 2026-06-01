export class RateLimiter {
  constructor(key = 'rate-limiter-checklist') {
    this.key = key;
    this.limitCount = 5; // Trigger at 6 items (meaning 5 attempts are fine, the 6th in 5 seconds triggers it)
    this.limitWindowMs = 5000; // 5 seconds
    this.initialCooldownMs = 3000; // 3 seconds
  }

  getState() {
    if (typeof window === 'undefined') {
      return { attempts: [], cooldownExpiry: 0, penaltyMultiplier: 1 };
    }
    try {
      const data = localStorage.getItem(this.key);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          attempts: parsed.attempts || [],
          cooldownExpiry: parsed.cooldownExpiry || 0,
          penaltyMultiplier: parsed.penaltyMultiplier || 1
        };
      }
    } catch (e) {
      console.error('Error reading rate limiter state', e);
    }
    return { attempts: [], cooldownExpiry: 0, penaltyMultiplier: 1 };
  }

  saveState(state) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving rate limiter state', e);
    }
  }

  checkLimit() {
    const now = Date.now();
    const state = this.getState();

    // Check if currently inside active cooldown
    if (now < state.cooldownExpiry) {
      const remaining = Math.ceil((state.cooldownExpiry - now) / 1000);
      return { isLimited: true, remainingSeconds: remaining, cooldownExpiry: state.cooldownExpiry };
    }

    // Filter attempts within the 5-second window
    const windowStart = now - this.limitWindowMs;
    const activeAttempts = state.attempts.filter(timestamp => timestamp > windowStart);

    // If 5 items already added and we try to add another (making it 6 in 5 seconds), trigger cooldown
    if (activeAttempts.length >= this.limitCount) {
      const multiplier = state.penaltyMultiplier;
      const cooldownDuration = this.initialCooldownMs * multiplier;
      const newExpiry = now + cooldownDuration;

      // Update state: set cooldown and double the multiplier for consecutive spams
      const nextMultiplier = Math.min(multiplier * 2, 64); // Cap dynamic penalty at 64x (192 seconds) to avoid permanent block
      
      this.saveState({
        attempts: activeAttempts,
        cooldownExpiry: newExpiry,
        penaltyMultiplier: nextMultiplier
      });

      return {
        isLimited: true,
        remainingSeconds: Math.ceil(cooldownDuration / 1000),
        cooldownExpiry: newExpiry
      };
    }

    return { isLimited: false, remainingSeconds: 0 };
  }

  recordAttempt() {
    const now = Date.now();
    const state = this.getState();

    // If in cooldown, do not record or allow action
    if (now < state.cooldownExpiry) {
      return false;
    }

    const windowStart = now - this.limitWindowMs;
    const activeAttempts = state.attempts.filter(timestamp => timestamp > windowStart);
    
    activeAttempts.push(now);

    // If the last cooldown expired more than 10 seconds ago, reset the spam multiplier back to 1
    let penaltyMultiplier = state.penaltyMultiplier;
    if (state.cooldownExpiry > 0 && (now - state.cooldownExpiry > 10000)) {
      penaltyMultiplier = 1;
    }

    this.saveState({
      attempts: activeAttempts,
      cooldownExpiry: state.cooldownExpiry,
      penaltyMultiplier
    });

    return true;
  }

  reset() {
    this.saveState({ attempts: [], cooldownExpiry: 0, penaltyMultiplier: 1 });
  }
}
