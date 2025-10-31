// Import all external libraries from node_modules to bundle them
// This eliminates the need for CSP entries for external CDNs

import he from 'he';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import Chart from 'chart.js/auto';
import SparkMD5 from 'spark-md5';

// Make libraries available globally for legacy code that expects them
window.he = he;
window.Swal = Swal;
window.Papa = Papa;
window.Chart = Chart;
window.SparkMD5 = SparkMD5;

// Note: replaywebpage needs special handling - check where it's used
// and import it properly in those specific modules
