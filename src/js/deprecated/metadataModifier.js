var dcVals = {},
    isadVals = {};
const dcFields = ["dc-title", "dc-creator", "dc-description", "dc-contributor", "dc-coverage", "dc-date", "dc-format", "dc-identifier", "dc-language", "dc-publisher", "dc-relation", "dc-rights", "dc-source", "dc-subject", "dc-type"],
    isadFields = ["isadg-reference-codes", "isadg-title", "isadg-dates", "isadg-level-of-description", "isadg-extent-and-medium-of-the-unit-of-description", "isadg-name-of-creators", "isadg-administrativebibliographical-history", "isadg-archival-history", "isadg-immediate-source-of-acquisition-or-transfer", "isadg-scope-and-content", "isadg-appraisal-destruction-and-scheduling-information", "isadg-accruals", "isadg-system-of-arrangement", "isadg-conditions-governing-access", "isadg-conditions-governing-reproduction", "isadg-languagescripts-of-material", "isadg-physical-characteristics-and-technical-requirements", "isadg-finding-aids", "isadg-existence-and-location-of-originals", "isadg-existence-and-location-of-copies", "isadg-related-units-of-description", "isadg-publication-note", "isadg-note", "isadg-archivists-note", "isadg-rules-or-conventions", "isadg-dates-of-descriptions"],
    isadDCMap = {
        "dc-title": "isadg-title",
        "dc-creator": "isadg-name-of-creators",
        "dc-description": "isadg-scope-and-content",
        "dc-contributor": "",
        "dc-coverage": "",
        "dc-date": "isadg-dates",
        "dc-format": "isadg-extent-and-medium-of-the-unit-of-description",
        "dc-identifier": "isadg-reference-codes",
        "dc-langauge": "",
        "dc-publisher": "",
        "dc-relation": "",
        "dc-rights": "",
        "dc-source": "",
        "dc-subject": "",
        "dc-type": ""
    };

function fA(e, t) {
    e.style.visibility = "visible", e.textContent = t, setTimeout(function() {
        e.classList.add("flyAway"), setTimeout(function() {
            e.remove()
        }, 2e3)
    }, 1)
}

function mTog(e, t) {
    document.querySelector("#fanm") && document.querySelector("#fanm").remove();
    let i = document.createElement("div");
    i.id = "fanm", i.style = "visiblity:hidden;position:relative;top:-1em;left:0.7em;transition:transform 0.5s ease,opacity 2s ease-out;font-size:10pt;width:max-content;", e.srcElement.parentElement.prepend(i);
    let a = document.querySelector("#" + e.srcElement.id),
        n = e.srcElement.parentElement.previousElementSibling.lastElementChild.value,
        l = e.srcElement.parentElement.nextElementSibling.lastElementChild.id.substring(1);
    "LINKED" == a.alt ? (a.src = "https://i.ibb.co/kD5R0vy/UNLINKED.png", a.alt = "UNLINKED", fA(i, "Unlinked"), e.srcElement.parentElement.nextElementSibling.lastElementChild.value = t[l]) : (a.src = "https://i.ibb.co/Jj9psth/LINKED.png", a.alt = "LINKED", fA(i, "Linked"), e.srcElement.parentElement.nextElementSibling.lastElementChild.value = n)
}

function cMEl(e, t) {
    let i = document.createElement("tr");
    i.style.marginBottom = "1em";
    let a = document.createElement("td");
    a.className = "dcisadTd";
    let n = document.createElement("label");
    n.style.whiteSpace = "nowrap", n.style.overflow = "hidden", n.style.width = "230px", n.style.position = "relative", n.style.top = "0.2em", n.style.textOverflow = "ellipsis", n.style.display = "inline-block", n.for = "r" + t[1];
    let l = t[1].replace("isadg", "isad(g)").split("-");
    l = l[0].toUpperCase() + "-" + l[1].charAt(0).toUpperCase() + l[1].slice(1) + " " + l.slice(2).join(" "), n.textContent = l;
    let d = document.createElement("input");
    d.id = "r" + t[1], d.style.width = "inherit", d.disabled = !0, d.value = t[0], d.style.paddingLeft = "0.2em", a.appendChild(n), a.appendChild(d);
    let r = document.createElement("td");
    r.className = "dcisadLTd";
    let s = document.createElement("img");
    s.id = e.replace("-", "") + "Link", s.src = "https://i.ibb.co/Jj9psth/LINKED.png", s.alt = "LINKED", s.className = "dcisadL";
    var o = {};
    for (let c in dcFields) o[document.querySelector("#" + dcFields[c]).id] = document.querySelector("#" + dcFields[c]).value;
    s.addEventListener("click", function() {
        mTog(event, o)
    }), s.border = "0", r.appendChild(s);
    let p = document.createElement("td");
    p.className = "dcisadTd";
    let u = document.createElement("label");
    u.for = "r" + e, l = (l = e.split("-"))[0].toUpperCase() + "-" + l[1].charAt(0).toUpperCase() + l[1].slice(1), u.textContent = l;
    let m = document.createElement("input");
    return m.disabled = !0, m.id = "r" + e, m.style.width = "inherit", m.value = t[0], m.style.paddingLeft = "0.2em", p.appendChild(u), p.appendChild(m), i.appendChild(a), i.appendChild(r), i.appendChild(p), i
}

function sugGH(e) {
    let t = document.createElement("table");
    for (let i in t.className = "mWTable", e) "no value" != e[i] && "no map" != e[i] && t.appendChild(cMEl(i, e[i]));
    cwSwal(t)
}

function cwSwal(e) {
    swal.fire({
        title: "Select terms to crosswalk",
        html: e,
        width: 800,
        showCloseButton: !0,
        confirmButtonText: "Save mapping",
        padding: "2em",
        preConfirm: function() {
            let e = document.querySelector("#swal2-html-container > table").rows;
            for (var t of e) document.querySelector("#" + t.lastChild.textContent.toLowerCase()).value = t.lastChild.lastChild.value;
            saveHandler()
        }
    })
}

function isTDCdW() {
    let e = JSON.parse(JSON.stringify(isadDCMap));
    for (let t in isadDCMap)
        if ("" !== isadDCMap[t]) {
            let i = document.querySelector("#" + isadDCMap[t]).value;
            "" !== i ? e[t] = [i, isadDCMap[t]] : e[t] = "no value"
        } else console.log("no mapping established"), e[t] = "no map";
    sugGH(e)
}

function cWB() {
    if (null == document.querySelector("#cWB")) {
        let e = document.createElement("button");
        e.id = "cWB", e.innerHTML = '<i class="icon-link menu-icons" style="color:gray";></i>', e.classList.add("pBtnStyle2"), e.onclick = function() {
            var e = [];
            for (let t in isTDCdW(), isadFields) e.push(document.querySelector("#" + isadFields[t]).value)
        };
        let t = document.createElement("text");
        t.textContent = "Crosswalk from ISAD", t.classList.add("cwT"), e.append(t);
        let i = document.createElement("div");
        i.append(e), document.querySelector("#dc-container > ul").prepend(i)
    }
}

function isadDivs(e) {
    for (var t in e) {
        let i = document.createElement("div");
        i.id = "isad-" + e[t].replaceAll(" ", "-") + "-area";
        let a = document.createElement("input"),
            n = document.createElement("label"),
            l = document.createElement("span"),
            d = document.createElement("ul");
        d.className = "mdsSlide", l.id = "mdsSpan-" + e[t].replaceAll(" ", "-"), l.setAttribute("state-icon", "+"), l.className = "mdsSpan2", l.textContent = e[t], n.appendChild(l), a.type = "checkbox", a.name = "schema-" + e[t], a.className = "checkbox-isadg2", a.id = "checkbox-isadg" + t, a.addEventListener("change", function() {
            let e = a.checked;
            !0 == e ? l.setAttribute("state-icon", "-") : !1 == e && l.setAttribute("state-icon", "+")
        }), n.htmlFor = a.id, i.appendChild(n), i.appendChild(a), i.appendChild(d), document.querySelector("#isadg-container").lastChild.appendChild(i)
    }
}

function isadMap(e) {
    let t = {
            0: "identity statement",
            1: "context",
            2: "content and structure",
            3: "conditions of access and use",
            4: "allied materials",
            5: "notes",
            6: "description control"
        },
        i = [{
            element: "reference code(s)",
            areaId: 0
        }, {
            element: "title",
            areaId: 0
        }, {
            element: "date(s)",
            areaId: 0
        }, {
            element: "level of description",
            areaId: 0
        }, {
            element: "extent and medium of the unit of description",
            areaId: 0
        }, {
            element: "name of creator(s)",
            areaId: 1
        }, {
            element: "administrative/bibliographical history",
            areaId: 1
        }, {
            element: "archival history",
            areaId: 1
        }, {
            element: "immediate source of acquisition or transfer",
            areaId: 1
        }, {
            element: "scope and content",
            areaId: 2
        }, {
            element: "appraisal, destruction and scheduling information",
            areaId: 2
        }, {
            element: "accruals",
            areaId: 2
        }, {
            element: "system of arrangement",
            areaId: 2
        }, {
            element: "conditions governing access",
            areaId: 3
        }, {
            element: "conditions governing reproduction",
            areaId: 3
        }, {
            element: "language/scripts of material",
            areaId: 3
        }, {
            element: "physical characteristics and technical requirements",
            areaId: 3
        }, {
            element: "finding aids",
            areaId: 3
        }, {
            element: "existence and location of originals",
            areaId: 4
        }, {
            element: "existence and location of copies",
            areaId: 4
        }, {
            element: "related units of description",
            areaId: 4
        }, {
            element: "publication note",
            areaId: 4
        }, {
            element: "note",
            areaId: 5
        }, {
            element: "archivists note",
            areaId: 6
        }, {
            element: "rules or conventions",
            areaId: 6
        }, {
            element: "date(s) of descriptions",
            areaId: 6
        }];
    for (var a in isadDivs(t), e)
        for (var n in checkT = e[a].firstChild.innerHTML.toLowerCase(), i)
            if (checkT.includes(i[n].element.toLowerCase())) {
                let l = "#isad-" + t[i[n].areaId].replaceAll(" ", "-") + "-area";
                document.querySelector(l).lastChild.appendChild(e[a])
            }
}

function getDc() {
    let e = {};
    for (let t in dcFields) {
        let i = document.querySelector("#" + dcFields[t]).value;
        e[dcFields[t]] = i
    }
    return e
}

function getIsad() {
    let e = {};
    for (let t in isadFields) {
        let i = document.querySelector("#" + isadFields[t]).value;
        e[isadFields[t]] = i
    }
    return e
}

function saveListener(e) {
    e.status = 200, console.log("saved"), document.querySelector("#mdsSave") && document.querySelector("#mdsSave").parentElement.remove()
}

function compareGet(e, t) {
    for (var i in cO = {}, e) t[i] != e[i] && (cO[i] = JSON.stringify(t[i]));
    return cO
}

function saveHandler(e) {
    let t = {};
    Object.assign(t, getDc(), getIsad());
    let i = {};
    Object.assign(i, dcVals, isadVals);
    let a = compareGet(i, t),
        n = Object.fromEntries(pydio._dataModel._selectedNodes[0]._metadata).uuid,
        l = [],
        d = {},
        r = {},
        s = "usermeta-" + Object.fromEntries(pydio._dataModel._selectedNodes[0]._metadata).uuid;
    for (var o in a) {
        let c = "usermeta-" + o.toLowerCase(),
            p = a[o];
        pydio._dataModel._selectedNodes[0]._metadata.set(c, p), r[o] = p;
        let u = {
            NodeUuid: n,
            Namespace: c,
            JsonValue: p,
            Policies: [{
                Action: "READ",
                Effect: "allow",
                Subject: "*"
            }, {
                Action: "WRITE",
                Effect: "allow",
                Subject: "*"
            }]
        };
        l.push(u)
    }
    sessionStorage.setItem(s, JSON.stringify(r)), d.MetaDatas = l, d.Operation = "PUT";
    let m = new XMLHttpRequest;
    m.addEventListener("load", saveListener), m.open("PUT", "/a/user-meta/update"), m.setRequestHeader("Content-Type", "application/json"), m.setRequestHeader("Authorization", "Bearer " + PydioApi._PydioRestClient.authentications.oauth2.accessToken), m.send(JSON.stringify(d))
}

function inputHandler(e) {
    let t = document.querySelector("#mdsCont");
    if (!t.parentNode.lastChild.innerHTML.includes("Save")) {
        let i = document.createElement("div");
        i.innerHTML = '<div id=mdsSave style="padding: 2px; text-align: right; border-top: 1px solid rgb(224, 224, 224);"><button tabindex="0" type="button" style="border: 10px; box-sizing: border-box; display: inline-block; font-family: Roboto, sans-serif; -webkit-tap-highlight-color: rgba(0, 0, 0, 0); cursor: pointer; text-decoration: none; margin: 0px; padding: 0px; outline: none; font-size: inherit; font-weight: inherit; position: relative; height: 36px; line-height: 36px; min-width: 88px; color: rgba(0, 0, 0, 0.87); transition: all 450ms cubic-bezier(0.23, 1, 0.32, 1) 0ms; border-radius: 2px; user-select: none; overflow: hidden; background-color: rgba(0, 0, 0, 0); text-align: center;"><div><span>You have unsaved changes!<span style="position: relative; padding-left: 16px; padding-right: 16px; vertical-align: middle; letter-spacing: 0px; text-transform: uppercase; font-weight: 500; font-size: 14px;">Save meta</span></div></button></div>', i.addEventListener("click", saveHandler), t.parentNode.appendChild(i)
    }
}

function schemaToLi(e, t, i) {
    let a = [];
    for (let n in i) {
        let l = document.createElement("li");
        if ("object" == typeof i[n]) {
            if (i[n].innerHTML.includes("DC") && "dc" == e) {
                let d = i[n].cloneNode(!0),
                    r = d.firstChild.firstChild.textContent.toLowerCase();
                if (d.addEventListener("input", inputHandler), "INPUT" == d.firstChild.children[1].nodeName) {
                    d.firstChild.children[1].id = r;
                    var s = d.firstChild.children[1].value
                } else if ("TEXTAREA" == d.firstChild.children[1].lastChild.nodeName) {
                    d.firstChild.children[1].lastChild.id = r;
                    var s = d.firstChild.children[1].lastChild.value
                }
                dcVals[r] = s, l.appendChild(d), t.appendChild(l)
            } else if (i[n].innerHTML.includes("ISAD") && "isadg" == e) {
                let o = i[n].cloneNode(!0),
                    c = o.firstChild.firstChild.textContent.replaceAll("(G)", "G").replaceAll("(s)", "s").replaceAll(" ", "-").replaceAll("/", "").replaceAll(",", "").replaceAll("'", "").toLowerCase();
                if (o.addEventListener("input", inputHandler), o.firstChild.firstChild.textContent = o.firstChild.firstChild.textContent.replace("ISAD(G)-", ""), "INPUT" == o.firstChild.children[1].nodeName) {
                    o.firstChild.children[1].id = c;
                    var s = o.firstChild.children[1].value
                } else if ("TEXTAREA" == o.firstChild.children[1].lastChild.nodeName) {
                    o.firstChild.children[1].lastChild.id = c;
                    var s = o.firstChild.children[1].lastChild.value
                }
                isadVals[c] = s, l.style.marginLeft = "15px", l.style.paddingLeft = "15px", l.appendChild(o), a.push(l)
            }
        }
    }
    return "isadg" == e && isadMap(a), t
}

function clearFields() {
    dcFields.concat(isadFields).forEach(function(e) {
        document.querySelector("#" + e).value = ""
    })
}

function tM(e) {
    if (e.target.parentNode.innerHTML.includes("down"));
    else {
        let t = document.querySelector("#info_panel > div > div.scrollarea-content > div");
        for (var i in t.children)
            if ("object" == typeof t.children[i] && t.children[i].innerHTML.includes("Meta Data")) {
                var a = t.children[i];
                a.removeChild(a.lastChild)
            }
    }
}

function cyB() {
    if (null == document.querySelector("#cyB")) {
        let e = document.createElement("input");
        e.type = "button", e.value = "&#x1F4CB;"
    }
}

function uDfC(e) {
    let t = "usermeta-" + Object.fromEntries(e._metadata).uuid;
    try {
        i = JSON.parse(sessionStorage.getItem(t) || "{}");
    } catch (err) {
        console.error("Error parsing session storage data:", err);
        i = {};
    }
    setTimeout(function() {
        for (var e in i) {
            try {
                document.querySelector("#" + e.replace("usermeta-", "")).value = JSON.parse(i[e]);
            } catch (err) {
                console.error("Error parsing individual metadata value:", err);
                document.querySelector("#" + e.replace("usermeta-", "")).value = i[e] || "";
            }
        }
    }, 10)
}

function oHm(e) {
    setTimeout(function() {
        document.querySelector("#checkbox-dc") ? e && (oH(), cWB()) : setTimeout(function() {
            try {
                "panelContent" == document.querySelector("#info_panel > div > div > div > div:nth-child(3)").lastChild.className || document.querySelector("#info_panel > div > div > div > div:nth-child(3)").firstElementChild.click(), oH(), cWB()
            } catch (e) {}
        }, 200)
    }, 50)
}

function oH(e) {
    let t = document.querySelector("#info_panel > div > div.scrollarea-content > div");
    for (var i in t.children)
        if ("object" == typeof t.children[i] && t.children[i].innerHTML.includes("Meta Data")) {
            var a = t.children[i],
                n = t.children[i].lastChild.firstChild;
            if ("mdsCont" == a.lastChild.id) {
                let l = Object.fromEntries(pydio._dataModel._selectedNodes[0]._metadata);
                for (let d in clearFields(), l)
                    if (d.includes("usermeta-dc") || d.includes("usermeta-isad")) {
                        let r = d.replace("usermeta-", "");
                        document.querySelector("#" + r).value = l[d]
                    }
            } else {
                var s = ["dc", "isadg"],
                    o = document.createElement("div");
                o.id = "mdsContainer";
                var c = [],
                    p = n.children;
                for (let u = p.length - 1; u >= 0; u--) {
                    let m = p[u].textContent.toLowerCase();
                    m.includes("dc-") || m.includes("isad(g)-") ? (c.push(p[u].cloneNode(!0)), p[u].remove()) : m.includes("custom") || p[u].remove()
                }
                for (let f in a.appendChild(o), s) {
                    let h = document.createElement("div");
                    h.id = s[f] + "-container";
                    let g = document.createElement("input"),
                        v = document.createElement("label"),
                        C = document.createElement("span");
                    C.onclick = function() {
                        "+" == C.getAttribute("state-icon") ? C.setAttribute("state-icon", "-") : C.setAttribute("state-icon", "+")
                    };
                    let y = document.createElement("ul");
                    if (y.className = "mdsSlide", C.id = "mdsSpan-" + f.replaceAll(" ", "-"), C.setAttribute("state-icon", "+"), C.className = "mdsSpan", C.textContent = s[f].toUpperCase(), v.appendChild(C), g.type = "checkbox", g.name = "schema-" + s[f], g.id = "checkbox-" + s[f], v.htmlFor = g.id, h.appendChild(v), h.appendChild(g), h.appendChild(y), o.appendChild(h), o.id = "mdsCont", y = schemaToLi(s[f], y, c), 0 == window.rBlock) {
                        a.firstChild.firstChild.remove();
                        let b = a.firstChild.cloneNode();
                        b.innerText = "Meta Data", b.style.cursor = "default", a.firstChild.replaceWith(b), t.children[i].querySelector(".panelContent").firstChild.style.overflowY = ""
                    }
                }
            }
        }
}

function storeRMeta() {
    let e = {};
    return pydio._dataModel._selectedNodes[0]._metadata.forEach(function(t, i) {
        i.includes("usermeta") && !i.includes("virus") && (e[i] = t)
    }), e
}
window.addEventListener("load", function() {
    window.rBlock = 0, setTimeout(function() {
        pydio._dataModel.observe("selection_changed", function() {
            oHm(event)
        }), pydio.observe("context_changed", function() {
            window.rBlock = 0
        })
    }, 500)
});
