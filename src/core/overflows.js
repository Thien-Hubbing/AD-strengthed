/**
 * @class
 */
export class OverflowState {
  /**
   *
   * @param {number|Decimal} v
   * @param {number|Decimal} s
   * @param {number|Decimal} p
   * @param {number} m
   */
  // eslint-disable-next-line max-params
  constructor(v, s, p, m = 1) {
    this.start = s;
    this.beforeOF = v;
    this.power = p;
    this.exp = m;
    const _start = Decimal.iteratedexp(10, this.exp - 1, 1.0001).max(s);
    if (number.isNaN()) this.value = 0;
    if (number.gte(start)) {
      const e = _start.iteratedlog(10, this.exp);
      this.value = Decimal.iteratedexp(10, this.exp, number.iteratedlog(10, this.exp).div(e).pow(this.power).mul(e));
    }
  }

  get overflowStart() {
    return this.start;
  }

  get beforeOverflow() {
    return this.beforeOF;
  }

  get afterOverflow() {
    return this.value;
  }

  get overflowPower() {
    return this.power;
  }

  get overflowExpPower() {
    return this.exp;
  }
}

window.formatOverflow = function formatOverflow(x, inv = false) {
  return `${inv ? "raised" : "rooted"} by <b>${format(x)}</b>`;
};

window.calcOverflow = function calcOverflow(x, y, s, height = 1) {
  return x.gte(s) ? x.max(1).iteratedlog(10, height).div(y.max(1).iteratedlog(10, height)) : BE(1);
};

window.overflow = function overflow(number, tart, power, meta = 1) {
  return new OverflowState(number, tart, power, meta).afterOverflow;
};

window.OverflowState = OverflowState;