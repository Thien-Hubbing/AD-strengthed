import { isDecimal } from "../utility/type-check";

window.BE = function BE(value) {
  return new Decimal(value);
};

function isEND() {
  const threshold = GameEnd.endState >= END_STATE_MARKERS.END_NUMBERS
    ? 1
    : (GameEnd.endState - END_STATE_MARKERS.FADE_AWAY) / 2;
  // Using the Pelle.isDoomed getter here causes this to not update properly after a game restart
  return player.celestials.pelle.doomed && Math.random() < threshold;
}

window.otherFormat = function format(value, places = 0, placesUnder1000 = 0) {
  if (isEND()) return "END";
  // eslint-disable-next-line no-param-reassign
  if (!isDecimal(value)) value = new Decimal(value);
  if (value.lt("e9e15")) return Notations.current.format(value, places, placesUnder1000, 3);
  return LNotations.current.formatLDecimal(value, places);
};

window.formatInt = function formatInt(value) {
  if (isEND()) return "END";
  // Suppress painful formatting for Standard because it's the most commonly used and arguably "least painful"
  // of the painful notations. Prevents numbers like 5004 from appearing imprecisely as "5.00 K" for example
  if (Notations.current.isPainful && Notations.current.name !== "Standard") {
    return format(value, 2);
  }
  if (typeof value === "number") {
    return value > 1e9 ? format(value, 2, 2) : formatWithCommas(value.toFixed(0));
  }
  return (!(value instanceof Decimal) || value.lt(1e9))
    ? formatWithCommas(value instanceof Decimal ? value.toNumber().toFixed(0) : 1) : format(value, 2, 2);
};

window.formatFloat = function formatFloat(value, digits) {
  if (isEND()) return "END";
  if (Notations.current.isPainful) {
    return format(value, Math.max(2, digits), digits);
  }
  return formatWithCommas(value.toFixed(digits));
};

window.formatPostBreak = function formatPostBreak(value, places, placesUnder1000) {
  if (isEND()) return "END";
  // This is basically just a copy of the format method from notations library,
  // with the pre-break case removed.
  if (typeof value === "number" && !Number.isFinite(value)) {
    return "Infinity";
  }

  return format(value, places, placesUnder1000);
};

window.formatX = function formatX(value, places, placesUnder1000) {
  return `×${format(value, places, placesUnder1000)}`;
};

window.formatPow = function formatPow(value, places, placesUnder1000) {
  return `^${format(value, places, placesUnder1000)}`;
};

window.formatPercents = function formatPercents(value, places) {
  return `${format(Decimal.mul(value, 100), 2, places)}%`;
};

window.formatRarity = function formatRarity(value) {
  // We can, annoyingly, have rounding error here, so even though only rarities
  // are passed in, we can't trust our input to always be some integer divided by 10.
  const places = value.mod(1).eq(0) ? 0 : 1;
  return `${format(value, 2, places)}%`;
};

// We assume 2/0, 2/2 decimal places to keep parameter count sensible; this is used very rarely
window.formatMachines = function formatMachines(realPart, imagPart) {
  if (isEND()) return "END";
  const parts = [];
  if (Decimal.neq(realPart, 0)) parts.push(format(realPart, 2));
  if (Decimal.neq(imagPart, 0)) parts.push(`${format(imagPart, 2, 2)}i`);
  // This function is used for just RM and just iM in a few spots, so we have to push both parts conditionally
  // Nonetheless, we also need to special-case both zero so that it doesn't end up displaying as an empty string
  if (Decimal.eq(realPart, 0) && Decimal.eq(imagPart, 0)) return format(0);
  return parts.join(" + ");
};

window.formatTet = function formatTet(value, places, placesUnder1000) {
  return `^^${format(value, places, placesUnder1000)}`;
};

window.formatEffectPos = function formatEffectPos(effect, effectedValue, tet = true) {
  if (effect.lt(1000)) {
    // eslint-disable-next-line prefer-template
    return formatInt(effect, 2, 4) + "%";
  }
  if (effect.lt("1e100000") || effectedValue.lt(2)) {
    return formatX(effect, 2, 2);
  }
  if ((effect.lt("10^^100") && tet || effect.lt("10^^4")) || effectedValue.lt(10)) {
    return formatPow(effect.log10(), 2, 2);
  }
  if (tet) {
    // Not perfect, but idc
    return formatTet(value.slog(10), 2, 2);
  }
  val = new Decimal(effect);
  val.layer = 1;
  // eslint-disable-next-line prefer-template
  return formatInt(Math.floor(effect.slog() - 1)) + "th Expo " + formatPow(val, 2, 2);
};

// Does not take negative numbers fyi, just ints between 0-1 (excluding)
window.formatEffectNeg = function formatEffectNeg(effect, effectedValue) {
  if (effect.gt(0.001)) {
    // eslint-disable-next-line prefer-template
    return formatInt(effect, 2, 4) + "%";
  }
  if (effect.lt("1e100000") || effectedValue.lt(2)) {
    // eslint-disable-next-line prefer-template
    return "/" + format(effect.recip(), 2, 2);
  }
  if (effect.recip().lt("10^^4") || effectedValue.lt(10)) {
    return formatPow(effect.log10(), 2, 2);
  }
  val = new Decimal(effect);
  val.layer = 1;
  // eslint-disable-next-line prefer-template
  return formatInt(Math.floor(effect.recip().slog().toNumber() - 1)) + "th Expo " + formatPow(val, 2, 2);
};

window.formatEffectAuto = function formatEffectAuto(value, effectedValue) {
  if (value.gt(1)) {
    return formatEffectPos(value, effectedValue);
  }
  return formatEffectNeg(value, effectedValue, false);
};


window.timeDisplay = function timeDisplay(ms) {
  return TimeSpan.fromMilliseconds(ms).toString();
};

window.timeDisplayNoDecimals = function timeDisplayNoDecimals(ms) {
  return TimeSpan.fromMilliseconds(ms).toStringNoDecimals();
};

window.timeDisplayShort = function timeDisplayShort(ms) {
  return TimeSpan.fromMilliseconds(ms).toStringShort();
};

const commaRegexp = /\B(?=(\d{3})+(?!\d))/gu;
window.formatWithCommas = function formatWithCommas(value) {
  const decimalPointSplit = value.toString().split(".");
  decimalPointSplit[0] = decimalPointSplit[0].replace(commaRegexp, ",");
  return decimalPointSplit.join(".");
};

// Some letters in the english language pluralize in a different manner than simply adding an 's' to the end.
// As such, the regex match should be placed in the first location, followed by the desired string it
// should be replaced with. Note that $ refers to the EndOfLine for regex, and should be included if the plural occurs
// at the end of the string provided, which will be 99% of times. Not including it is highly likely to cause mistakes,
// as it will select the first instance that matches and replace that.
const PLURAL_HELPER = new Map([
  [/y$/u, "ies"],
  [/x$/u, "xes"],
  [/$/u, "s"]
]);

// Some terms require specific (or no) handling when plural. These terms should be added, in Word Case, to this Map.
// Words will be added to this Map when a valid plural for it is found on being run through the pluralize function.
const pluralDatabase = new Map([
  ["Antimatter", "Antimatter"],
  ["Dilated Time", "Dilated Time"],
]);

/**
 * A function that pluralizes a word based on a designated amount
 * @param  {string} word           - word to be pluralized
 * @param  {number|Decimal} amount - amount to be used to determine if the value is plural
 * @param  {string} [plural]       - if defined, a specific plural to override the generated plural
 * @return {string} - if the {amount} is anything other than one, return the {plural} provided or the
 *                    plural form of the input {word}. If the {amount} is singular, return {word}
 */
window.pluralize = function pluralize(word, amount, plural) {
  if (word === undefined || amount === undefined) throw "Arguments must be defined";

  if (Decimal.eq(amount, 1)) return word;
  const existingPlural = plural ?? pluralDatabase.get(word);
  if (existingPlural !== undefined) return existingPlural;

  const newWord = generatePlural(word);
  pluralDatabase.set(word, newWord);
  return newWord;
};

/**
 * Creates a new plural based on PLURAL_HELPER and adds it to pluralDatabase
 * @param  {string} word - a word to be pluralized using the regex in PLURAL_HELPER
 * @return {string} - returns the pluralized word. if no pluralized word is found, simply returns the word itself.
 */
window.generatePlural = function generatePlural(word) {
  for (const [match, replaceWith] of PLURAL_HELPER.entries()) {
    const newWord = word.replace(match, replaceWith);
    if (word !== newWord) return newWord;
  }
  return word;
};

/**
 * Returns the formatted value followed by a name, pluralized based on the value input.
 * @param  {string} name                  - name to pluralize and display after {value}
 * @param  {number|Decimal} value         - number to {format}
 * @param  {number} [places]              - number of places to display for the mantissa
 * @param  {number} [placesUnder1000]     - number of decimal places to display
 * @param  {function} [formatType=format] - how to format the {value}. defaults to format
 * @return {string} - the formatted {value} followed by the {name} after having been pluralized based on the {value}
 */
// eslint-disable-next-line max-params
window.quantify = function quantify(name, value, places, placesUnder1000, formatType = format) {
  if (name === undefined || value === undefined) throw "Arguments must be defined";

  const number = formatType(value, places, placesUnder1000);
  const plural = pluralize(name, value);
  return `${number} ${plural}`;
};

/**
 * Returns the value formatted to formatInt followed by a name, pluralized based on the value input.
 * @param  {string} name                  - name to pluralize and display after {value}
 * @param  {number|Decimal} value         - number to format
 * @return {string} - the formatted {value} followed by the {name} after having been pluralized based on the {value}
 */
window.quantifyInt = function quantifyInt(name, value) {
  if (name === undefined || value === undefined) throw "Arguments must be defined";

  const number = formatInt(value);
  const plural = pluralize(name, value);
  return `${number} ${plural}`;
};

/**
 * Creates an enumated string, using the oxford comma, such that "a"; "a and b"; "a, b, and c"
 * @param  {string[]} items - an array of items to enumerate
 * @return {string} - a string of {items}, separated by commas and/or and as needed.
 */
window.makeEnumeration = function makeEnumeration(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  const commaSeparated = items.slice(0, items.length - 1).join(", ");
  const last = items[items.length - 1];
  return `${commaSeparated}, and ${last}`;
};

function exponentialFormat(num, precision, mantissa = true) {
  let e = num.log10().floor();
  let m = num.div(Decimal.pow(10, e));
  if (m.toStringWithDecimalPlaces(precision) === "10") {
    m = BE(1);
    e = e.add(1);
  }
  e = (e.gte(1e9) ? format(e, 3) : (e.gte(10000) ? commaFormat(e, 0) : e.toStringWithDecimalPlaces(0)));
  if (mantissa) return `${m.toStringWithDecimalPlaces(precision)}e${e}`;
  return `e${e}`;
}

function commaFormat(num, precision) {
  if (num === null || num === undefined) return "NaN";
  if (num.mag < 0.001) return (0).toFixed(precision);
  const init = num.toStringWithDecimalPlaces(precision);
  const portions = init.split(".");
  portions[0] = portions[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/gu, "$1,");
  if (portions.length === 1) return portions[0];
  return `${portions[0]}.${portions[1]}`;
}


function regularFormat(num, precision) {
  if (num === null || num === undefined) return "NaN";
  if (num.mag < 0.0001) return (0).toFixed(precision);
  if (num.mag < 0.1 && precision !== 0) precision = Math.max(precision, 4);
  return num.toStringWithDecimalPlaces(precision);
}

window.format = function format(value, precision = 2, placesUnder1000 = 2, small) {
  let decimal = new Decimal(value);
  if (isNaN(decimal.sign) || isNaN(decimal.layer) || isNaN(decimal.mag)) {
    player.hasNaN = true;
    return "NaN";
  }
  if (decimal.sign < 0) return `-${format(decimal.neg(), precision, small)}`;
  if (decimal.mag === Number.POSITIVE_INFINITY) return "Infinity";
  if (decimal.gte("eeeee1000")) {
    const slog = decimal.slog();
    if (slog.gte(1e6)) return `F${format(slog.floor())}`;
    return `${Decimal.pow(10, slog.sub(slog.floor())).toStringWithDecimalPlaces(3)}F${commaFormat(slog.floor(), 0)}`;
  }
  if (decimal.gte("e1e9")) return exponentialFormat(decimal, 0, false);
  if (decimal.gte("1e1000000")) return exponentialFormat(decimal, 0);
  if (decimal.gte(1e9)) return exponentialFormat(decimal, precision);
  if (decimal.gte(1e3)) return commaFormat(decimal, 0);
  if (decimal.gte(0.0001) || !small) return regularFormat(decimal, placesUnder1000);
  if (decimal.eq(0)) return (0).toFixed(placesUnder1000);

  decimal = invertOOM(decimal);
  let val = "";
  if (decimal.lt("1e1000")) {
    val = exponentialFormat(decimal, precision);
    return val.replace(/([^(?:e|F)]*)$/u, "-$1");
  }
  return `${format(decimal, precision)}⁻¹`;

}

function formatWhole(decimal) {
  decimal = new Decimal(decimal);
  if (decimal.gte(1e9)) return format(decimal, 2);
  if (decimal.lte(0.99) && !decimal.eq(0)) return format(decimal, 2);
  return format(decimal, 0);
}

window.formatTime = function formatTime(value, useHMS = true) {
  const s = new Decimal(value);
  if (s.lt(1e-30)) return `${format(s.mul(5.391247e44))} tP`;
  if (s.lt(1e-27)) return `${format(s.mul(1e30))} qs`;
  if (s.lt(1e-24)) return `${format(s.mul(1e27))} rs`;
  if (s.lt(1e-21)) return `${format(s.mul(1e24))} ys`;
  if (s.lt(1e-18)) return `${format(s.mul(1e21))} zs`;
  if (s.lt(1e-15)) return `${format(s.mul(1e18))} as`;
  if (s.lt(1e-12)) return `${format(s.mul(1e15))} fs`;
  if (s.lt(1e-9)) return `${format(s.mul(1e12))} ps`;
  if (s.lt(1e-6)) return `${format(s.mul(1e9))} ns`;
  if (s.lt(1e-3)) return `${format(s.mul(1e6))} μs`;
  if (s.lt(1)) return `${format(s.mul(1e3))} ms`;
  if (s.lt(60)) return `${format(s)} s`;
  if (s.lt(3600)) {
    return useHMS
      ? `${formatWhole(s.div(60).floor())}:${format(s.mod(60))}`
      : `${format(s.div(60))} minutes`;
  }
  if (s.lt(86400)) {
    return useHMS
      ? `${formatWhole(s.div(3600).floor())}:${format(s.div(60).floor().mod(60))}:${format(s.mod(60))}`
      : `${format(s.div(3600).floor())} hours, ${format(s.div(60).mod(60))} minutes`;
  }
  if (s.lt(31536000)) {
    return `${formatWhole(s.div(86400).floor())} days, ${formatWhole(s.div(3600).floor().mod(24))} hours,
    ${formatWhole(s.vi(60).mod(60))} minutes`;
  }
  if (s.lt(4351968e11)) {
    return `${formatWhole(s.div(31536000).floor())} years, ${formatWhole(s.div(86400).mod(365))} days`;
  }
  return `${format(s.div(4351968e11))} unis`;
};

function toPlaces(x, precision, maxAccepted) {
  x = new Decimal(x);
  let result = x.toStringWithDecimalPlaces(precision);
  if (new Decimal(result).gte(maxAccepted)) {
    result = new Decimal(maxAccepted - Math.pow(0.1, precision)).toStringWithDecimalPlaces(precision);
  }
  return result;
}

// Will also display very small numbers
function formatSmall(x, precision = 2) {
  return format(x, precision, true);
}

function invertOOM(x) {
  let e = x.log10().ceil();
  const m = x.div(Decimal.pow(10, e));
  e = e.neg();
  x = new Decimal(10).pow(e).times(m);

  return x;
}