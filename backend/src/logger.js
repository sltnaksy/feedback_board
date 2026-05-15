export function log(level, message, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: String(level).toUpperCase(),
    service: "backend",
    message,
    ...details
  };

  console.log(JSON.stringify(entry));
}