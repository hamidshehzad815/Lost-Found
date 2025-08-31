function dmsToDecimal(dms) {
  // Example input: 31°28'36.3"N
  const regex = /(\d+)°(\d+)'([\d.]+)"?([NSEW])/i;
  const match = dms.match(regex);

  if (!match) throw new Error("Invalid DMS format");

  let degrees = parseInt(match[1], 10);
  let minutes = parseInt(match[2], 10);
  let seconds = parseFloat(match[3]);
  let direction = match[4].toUpperCase();

  // Convert to decimal
  let decimal = degrees + minutes / 60 + seconds / 3600;

  // South and West are negative
  if (direction === "S" || direction === "W") {
    decimal *= -1;
  }

  return decimal;
}

function decimalToDms(decimal, type = "lat") {
  const absDecimal = Math.abs(decimal);
  const degrees = Math.floor(absDecimal);
  const minutesFloat = (absDecimal - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = ((minutesFloat - minutes) * 60).toFixed(1);

  let direction;
  if (type === "lat") {
    direction = decimal >= 0 ? "N" : "S";
  } else {
    direction = decimal >= 0 ? "E" : "W";
  }

  return `${degrees}°${minutes}'${seconds} ${direction}`;
}

export { dmsToDecimal, decimalToDms };
