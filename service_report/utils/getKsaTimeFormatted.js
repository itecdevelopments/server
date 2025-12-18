function getKsaTimeFormatted() {
  const ksaTimeZone = 'Asia/Riyadh';
  const now = new Date();

  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false,
    timeZone: ksaTimeZone
  };

  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const ksaTimeString = formatter.format(now).replace(', ', 'T');

  return new Date(ksaTimeString + "+03:00");  // FIX
}

module.exports = getKsaTimeFormatted;
