export class FixedClock {
  constructor(initialTime = new Date('2026-06-20T00:00:00Z')) {
    this._now = new Date(initialTime);
  }

  now() {
    return new Date(this._now);
  }

  toISOString() {
    return this._now.toISOString();
  }

  toUnixMs() {
    return this._now.getTime();
  }

  advance(ms) {
    this._now = new Date(this._now.getTime() + ms);
  }

  advanceMinutes(minutes) {
    this.advance(minutes * 60 * 1000);
  }

  advanceHours(hours) {
    this.advance(hours * 60 * 60 * 1000);
  }

  advanceDays(days) {
    this.advance(days * 24 * 60 * 60 * 1000);
  }

  setTime(date) {
    this._now = new Date(date);
  }
}
