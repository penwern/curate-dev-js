const externalScripts = [
  {
    name: "he",
    url: "https://cdn.jsdelivr.net/npm/he@1.2.0/he.min.js",
  },
  {
    name: "swal",
    url: "https://cdn.jsdelivr.net/npm/sweetalert2@11",
  },
  {
    name: "papaparse",
    url: "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js",
  },
  {
    name: "chart.js",
    url: "https://cdn.jsdelivr.net/npm/chart.js",
  },
  {
    name: "spark-md5",
    url: "https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js",
  },
  {
    name: "replaywebpage",
    url: "https://cdn.jsdelivr.net/npm/replaywebpage@2.3.14/ui.js",
  },
];
function applyScripts(scripts) {
  scripts.forEach((script) => {
    // Create a <script> element
    let s = document.createElement("script");

    // Set the source attribute to the CDN URL of the library
    s.src = script.url;
    s.onerror = function () {
      console.error(
        "Failed to load external library: ",
        script.name,
        "please reload the page or contact your admin if the issue persists."
      );
    };
    // Append the <script> element to the <head> section of the document
    document.head.appendChild(s);
  });
}
applyScripts(externalScripts);
