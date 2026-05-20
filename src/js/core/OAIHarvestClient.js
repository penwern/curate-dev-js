async function harvestOAI({ baseUrl, verb, identifier, metadataPrefix, oaiVersion }) {
  var parser = new DOMParser();
  const encodedVerb = encodeURIComponent(verb);
  const encodedIdentifier = encodeURIComponent(identifier);

  const availableSchemasUrl = `${baseUrl}?verb=${encodeURIComponent("ListMetadataFormats")}`;

  const schemaResponse = await fetch(availableSchemasUrl);
  if (!schemaResponse.ok) {
    throw new Error(`Failed to fetch ${availableSchemasUrl}: ${schemaResponse.statusText}`);
  }
  const availableSchemas = await schemaResponse.text();
  const schemaXml = parser.parseFromString(availableSchemas, "text/xml");
  const schemas = Array.from(schemaXml.getElementsByTagName("metadataFormat"));
  var activeSchema;
  for (let x = 0; x < schemas.length; x++) {
    if (
      schemas[x]
        .getElementsByTagName("metadataPrefix")[0]
        .textContent.includes(metadataPrefix.toLowerCase())
    ) {
      metadataPrefix = schemas[x].getElementsByTagName("metadataPrefix")[0].textContent;
      activeSchema = schemas[x].getElementsByTagName("schema")[0].textContent;
    }
  }
  const encodedMetadataPrefix = encodeURIComponent(metadataPrefix);
  const requestUrl = `${baseUrl}?verb=${encodedVerb}&metadataPrefix=${encodedMetadataPrefix}&identifier=${encodedIdentifier}`;
  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${requestUrl}: ${response.statusText}`);
  }
  const content = await response.text();
  return xmlToJson(xmlToMetadata(content), metadataPrefix);
}
function xmlToMetadata(xmlStr) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, "text/xml");
  const metadataNodes = xmlDoc.getElementsByTagName("metadata");
  if (metadataNodes.length === 0) {
    return "No metadata found in the XML string.";
  }
  const metadataXml = metadataNodes[0].cloneNode(true);
  return metadataXml;
}
function xmlToJson(xml, prefix) {
  try {
    const metadataPrefix = prefix;
    if (metadataPrefix === "oai_dc" || metadataPrefix === "dc") {
      // convert OAI-PMH DC metadata response to DC JSON
      const dcElements = Array.from(
        xml.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "*"),
      );
      const json = {};
      for (let i = 0; i < dcElements.length; i++) {
        const element = dcElements[i];
        const name = element.localName;
        const text = element.textContent;
        if (json[name]) {
          if (Array.isArray(json[name])) {
            json[name].push(text);
          } else {
            json[name] = [json[name], text];
          }
        } else {
          json[name] = text;
        }
      }
      return json;
    } else if (metadataPrefix === "oai_ead" || metadataPrefix === "ead") {
      // convert OAI-PMH EAD metadata response to EAD JSON
      const ead = xml.getElementsByTagName("ead")[0];
      const eadheader = ead.getElementsByTagName("eadheader")[0];
      const eadidSec = eadheader.getElementsByTagName("eadid")[0];
      const archdesc = ead.getElementsByTagName("archdesc")[0];
      const did = archdesc.getElementsByTagName("did")[0];
      const physdesc = did.getElementsByTagName("physdesc")[0];
      const json = {};
      const vars = {
        "reference-codes": ["identifier", "countrycode", "mainagencycode"],
        title: ["unittitle"],
        dates: ["unitdate"],
        "level-of-description": ["level", "c level"],
        "extent-and-medium-of-the-unit-of-description": [
          "physdesc",
          "extent",
          "dimensions",
          "genreform",
          "physfacet",
        ],
        "name-of-creator": ["origination"],
        "administrativebibliographical-history": ["bioghist"],
        "archival-history": ["custodhist"],
        "immediate-source-of-acquisition-or-transfer": ["acqinfo"],
        "scope-and-content": ["scopecontent"],
        appraisal: ["appraisal"],
        accruals: ["accruals"],
        "system-of-arrangement": ["arrangement"],
        "conditions-governing-access": ["accessrestrict"],
        "conditions-governing-reproduction": ["langmaterial"],
        "languagescripts-of-material": ["langmaterial"],
        "physical-characteristics-and-technical-requirements": ["phystech"],
        "finding-aids": ["otherfindaid"],
        "existence-and-location-of-originals": ["originalsloc"],
        "existence-and-location-of-copies": ["altformavail"],
        "related-units-of-description": ["relatedmaterial", "seperatedmaterial"],
        "publication-note": ["bibliography"],
        note: ["odd", "note"],
        "archivists-note": ["arrangement"],
        "rules-or-conventions": ["altformavail"],
        "dates-of-descriptions": ["processinfo"],
      };
      for (let isadVar in vars) {
        var eadVars = vars[isadVar];
        var v = [];
        if (isadVar == "isadg-reference-codes") {
          for (let x = 0; x < eadVars.length; x++) {
            v.push(eadidSec.getAttribute(eadVars[x]));
          }
          v = v.join(", ");
        } else if (isadVar == "isadg-level-of-description") {
          v = [
            archdesc.getAttribute("level"),
            ead.getElementsByTagName("c")[0].getAttribute("level"),
          ].join(", ");
        } else if (isadVar == "isadg-extent-and-medium-of-the-unit-of-description") {
          var tags = ["extent", "dimensions", "genreform", "physfacet"];
          v = [physdesc.textContent];
          tags.forEach(function (tag) {
            if (archdesc.getElementsByTagName(tag).length > 0) {
              v.push(archdesc.getElementsByTagName(tag)[0].textContent);
            }
          });
          v = v.join(", ");
        } else {
          for (let x = 0; x < eadVars.length; x++) {
            try {
              v += ead.getElementsByTagName(eadVars[x])[0].textContent;
            } catch {
              continue;
            }
          }
        }
        if (v.length > 0) {
          json[isadVar] = v;
        } else {
          json[isadVar] = "";
        }
      }
      return json;
    }
  } catch (err) {
    console.log("err: ", err);
  }
}
