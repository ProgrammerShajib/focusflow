// Design tokens live here: change a colour once, the whole app follows.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { mist: "#EEF2F6", ink: "#1B2430", calm: "#0E7C7B", calmsoft: "#D6ECEB", drift: "#C9822B", driftsoft: "#F6E7D1", line: "#D5DCE4" },
    fontFamily: { sans: ["Manrope", "system-ui", "sans-serif"] },
  } },
};
