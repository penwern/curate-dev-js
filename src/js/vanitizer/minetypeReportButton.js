var lbs = [];
var dats = [];
var tokenP;
let counter = 0;
let lastcount;
let noChanges = 0;
let numChecks = 0;
var uniquetypes = [];
var nooftypes = {};
var sizeTypes = {};
let repSize = 0;
let lastRep = 0;
let re = /(?:\.([^.]+))?$/;
let glob = [];
var tempy = [];
var dataarr = [];

function rBadMeta(inputArr) {
  for (var c in inputArr.MetaStore) {
    inputArr.MetaStore[c] = inputArr.MetaStore[c].replace('"', "").replace('"', "");
    if (c == "name") {
      inputArr.MetaStore.filename = "objects/" + inputArr.MetaStore[c];
      delete inputArr.MetaStore.name;
    }
    if (!c.includes("mime") || !c.includes("Size")) {
      delete inputArr.MetaStore[c];
    }
    if (c.includes("Children")) {
      inputArr.MetaStore.mime = "Directory";
    }
  }
  if (inputArr.hasOwnProperty("Type") && inputArr.Type == "COLLECTION") {
    inputArr.MetaStore.mime = "Directory";
  }
  if (inputArr.MetaStore.mime == undefined) {
    inputArr.MetaStore.mime = re.exec(inputArr.Path)[1];
  }
  let r = inputArr.MetaStore;
  r.Size = inputArr.Size;
  return r;
}

function deal(ye) {
  for (var x in ye) {
    glob.push(ye[x]);
    delete ye[x].filename;
  }
  getty();
  MimeChart.data.labels = lbs;
  MimeChart.data.datasets.forEach((dataset) => {
    dataset.data = dats;
  });
  MimeChart.update();
  document.querySelector(
    "body > div.swal2-container.swal2-center.swal2-backdrop-show > div",
  ).style.background = "#fff";
  loadspinner.style.display = "none";
}

function aListener() {
  var tempy = [];
  var rep;
  rep = JSON.parse(this.responseText).Nodes;
  for (var x in rep) {
    tempy.push(rBadMeta(rep[x]));
  }

  return deal(tempy);
}

function bListener() {
  var rep;
  var childCollections = [];
  counter = counter + 1;
  rep = JSON.parse(this.responseText);
  document.querySelector(
    "body > div.swal2-container.swal2-center.swal2-backdrop-show > div",
  ).style.background = "#fff";
  if (rep.Nodes) {
    repSize = rep.Nodes.length;
    if (repSize > 90) {
      repSize = repSize * 6;
    }
  }
  for (var node in rep.Nodes) {
    tempy.push(rBadMeta(rep.Nodes[node]));
    if (rep.Nodes[node].Type == "COLLECTION") {
      childCollections.push(rep.Nodes[node].Path + "/*");
    }
  }
  if (childCollections.length > 0) {
    //x = new PydioApi.getRestClient()

    //var value = window.x.get().AccessToken
    return getLayer(tokenP, buildJsn(childCollections));
  }

  deal(tempy);
}

function getFirstLayer(tokenvar, jsn) {
  loadspinner.style.display = "block";
  var aReq = new XMLHttpRequest();
  aReq.addEventListener("load", aListener);
  let u = window.location.origin + "/a/meta/bulk/get";
  aReq.open("POST", u);
  aReq.setRequestHeader("Authorization", "Bearer " + tokenvar);
  aReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  aReq.send(JSON.stringify(jsn));
}

function getLayer(tokenvar, jsn) {
  loadspinner.style.display = "block";
  let u = window.location.origin + "/a/meta/bulk/get";
  var metaArr = [];
  var pArr = [];
  var bReq = new XMLHttpRequest();
  bReq.addEventListener("load", bListener);
  bReq.open("POST", u);
  bReq.setRequestHeader("Authorization", "Bearer " + tokenvar);
  bReq.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  bReq.send(JSON.stringify(jsn));
}

function selectionToPaths(rec) {
  var selectedNodes = window.pydio._dataModel._selectedNodes;
  var appendage;
  var nodeList = [];
  selectedNodes.forEach(function (node) {
    if (!node._isLeaf && rec == 1) {
      //if the node is a directory and recursive mode is enabled make it's search recursive
      //nodeList.push("appraisal-space"+node._path)
      appendage = "/*";
      var tpath = Curate.workspaces.getOpenWorkspace() + node._path + appendage;
      nodeList.push(tpath); //add node path to array
    } else {
      appendage = "";
    }
    if (rec !== 1) {
      var tpath = Curate.workspaces.getOpenWorkspace() + node._path + appendage;
      nodeList.push(tpath); //add node path to array
    }
  });
  return nodeList;
}

function buildJsn(nodeList) {
  var jsnBody = {
    //build json of requests
    AllMetaProviders: true,
    NodePaths: nodeList,
  };
  return jsnBody;
}

function f(array, value) {
  var n = 0;
  for (i = 0; i < array.length; i++) {
    if (array[i] == value) {
      n++;
    }
  }
  return n;
}

function createStringArray(arr, prop) {
  var result = [];
  for (var i = 0; i < arr.length; i += 1) {
    result.push(arr[i][prop]);
  }
  return result;
}
function check() {
  if (lastcount == counter && counter > 0) {
    if (repSize == lastRep) {
      noChanges = noChanges + (2 - repSize / 1000);
    }

    if (noChanges >= 15) {
    }
  } else {
    noChanges = 0;
  }

  lastcount = counter;
  lastRep = repSize;
  numChecks = numChecks + 1;
}

function getty() {
  var grapharr = [];
  document.querySelector(
    "body > div.swal2-container.swal2-center.swal2-backdrop-show > div > div.swal2-actions > button.swal2-confirm.swal2-styled",
  ).style.margin = "20px";
  grapharr = glob;
  for (var i in grapharr) {
    delete grapharr[i].filename;
  }
  var temp = createStringArray(grapharr, "mime");
  let tarr = [...new Set(temp)];

  for (var type in grapharr) {
    if (!uniquetypes.includes(grapharr[type].mime)) {
      uniquetypes.push(grapharr[type].mime);
    }
    //nooftypes.push(f(grapharr, uniquetypes[type]))
    var numOfTrue = 0;
    var tS = 0;
    for (var studentAge of grapharr) {
      if (studentAge.mime == grapharr[type].mime) {
        numOfTrue++;
      }
    }
    if (uniquetypes.includes(grapharr[type].mime)) {
      nooftypes[grapharr[type].mime] = numOfTrue;
    }
  }
  var combgraphobj = {};
  combgraphobj = Object.fromEntries(uniquetypes.map((_, i) => [uniquetypes[i], nooftypes[i]]));
  var lA = Object.keys(nooftypes);
  for (let t in lA) {
    lA[t] = lA[t] + ":" + grapharr[t].Size;
  }
  lbs = Object.keys(nooftypes);
  //lbs = lA
  dats = Object.values(nooftypes);
  document.getElementById("saveCSV").removeAttribute("hidden");
}

function dlCSV() {
  var csvgrapharr = [];
  var nooftypes2 = [];
  csvgrapharr = glob;
  for (var i in csvgrapharr) {
    delete csvgrapharr[i].filename;
  }
  var temp = createStringArray(csvgrapharr, "mime");
  var uniquetypes2 = [...new Set(temp)];
  for (var type2 in uniquetypes2) {
    //nooftypes.push(f(grapharr, uniquetypes[type]))
    var numOfTrue = temp.filter((x) => x === uniquetypes2[type2]).length;
    nooftypes2.push(numOfTrue);
  }

  var result = uniquetypes2.reduce(
    (str, name, i) => `${str}${name},${nooftypes2[i]}\n`,
    "Type,Magnitude\n",
  );
  var blob = new Blob([result], { type: "text/csv" });
  var url = window.URL.createObjectURL(blob);
  //var url = window.URL.createObjectURL(result)
  const link = document.createElement("a");
  const date = new Date();
  link.href = url;
  link.download =
    "Curate Mimetype Report(" +
    date.toLocaleString("en-UK", { timeZone: "Europe/London" }) +
    ").csv";
  link.target = "_blank";
  link.click();
  //window.URL.revokeObjectURL(url);
}

function loadc() {
  var guesstime = window.pydio._dataModel._selectedNodes;
  var firstLayerJson = buildJsn(selectionToPaths(0));
  var jsnBody = buildJsn(selectionToPaths(1));

  var x = new window.PydioApi.getRestClient();

  tokenP = x.authentications.oauth2.accessToken;

  document.getElementById("saveCSV").addEventListener("click", dlCSV, false);
  document.querySelector(
    "body > div.swal2-container.swal2-center.swal2-backdrop-show > div",
  ).style.backgroundRepeat = "no-repeat";
  document.querySelector(
    "body > div.swal2-container.swal2-center.swal2-backdrop-show > div",
  ).style.backgroundPosition = "center";

  getLayer(tokenP, jsnBody);
  getFirstLayer(tokenP, firstLayerJson);
}
function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
//main

//var checky = setInterval(check, 100);

Swal.fire({
  title:
    'Unique mimetypes in selection</br> <img id="loadspinner" src="https://i.postimg.cc/FsRzbpFq/Dual-Ring-1s-108px.gif">',
  background: "#fff",
  html: '<canvas id="displaycanv" width="650" height="650" margin="50"></canvas></br><button hidden id="saveCSV" class="cta"><span>Download CSV</span><svg viewBox="0 0 13 10" height="10px" width="15px"><path d="M1,5 L11,5"></path><polyline points="8 1 12 5 8 9"></polyline></svg></button>',
  showCloseButton: true,
  focusConfirm: false,
  confirmButtonText: "Ok",
  confirmButtonAriaLabel: "Ok",
  width: "650",
  padding: "20px",
  allowEscapeKey: true,
  allowEnterKey: true,
  confirmButtonColor: "#9fd0c7",
});

window.colourArray = [
  "khaki",
  "lavender",
  "lavenderblush",
  "aquamarine",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgreen",
  "lightsalmon",
  "lightseagreen",
  "lightslategrey",
  "lightsteelblue",
  "linen",
  "mediumaquamarine",
  "mediumturquoise",
  "moccasin",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "coral",
  "plum",
  "cadetblue",
  "rosybrown",
  "salmon",
];
window.colourArray.sort((a, b) => 0.5 - Math.random());
var displaycanv = document.createElement("canvas");
displaycanv.id = "displaycanv";
displaycanv.style.cssText = "width: 650px height: 650px !important";
var loadspinner = document.getElementById("loadspinner");
//loadspinner.style.marginTop = "-50px";
loadspinner.style.marginRight = "600px";
loadspinner.style.marginBottom = "-90px";
loadspinner.style.display = "none";
loadspinner.style.position = "relative";
loadspinner.style.top = "-73px";
loadspinner.style.left = "-20px";
waitForElm("#displaycanv").then((elm) => {
  var ctx = document.querySelector("#displaycanv").getContext("2d");
  lbs = [1];
  dats = [1];
  window.MimeChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: lbs,
      datasets: [
        {
          backgroundColor: colourArray,
          data: dats,
        },
      ],
    },
    options: {
      layout: {
        padding: {
          bottom: 15,
        },
      },
      hoverOffset: 20,
      title: {
        display: true,
        text: "",
      },
    },
  });

  loadc();
});

uniquetypes = [];
