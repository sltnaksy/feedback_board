import http from "http";

const request = http.request(
  {
    host: "localhost",
    port: 3000,
    path: "/health",
    timeout: 3000
  },
  (response) => {
    if (response.statusCode === 200) {
      process.exit(0);
    }

    process.exit(1);
  }
);

request.on("error", () => process.exit(1));
request.on("timeout", () => {
  request.destroy();
  process.exit(1);
});

request.end();
