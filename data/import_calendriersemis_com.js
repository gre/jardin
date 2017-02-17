// script to import data from https://calendriersemis.com/ html
// @greweb 2017

var rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

var gap,
    indent,
    meta = { // table of character substitutions
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '"': '\\"',
      '\\': '\\\\'
    },
    rep;

function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string)
        ? '"' + string.replace(rx_escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"'
        : '"' + string + '"';
}


function str(key, holder, limit) {

// Produce a string from holder[key].

    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }

// What happens next depends on the value's type.

    switch (typeof value) {
    case 'string':
        return quote(value);

    case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

        return isFinite(value)
            ? String(value)
            : 'null';

    case 'boolean':
    case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

        return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

    case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

        if (!value) {
            return 'null';
        }

// Make an array to hold the partial results of stringifying this object value.

        gap += indent;
        partial = [];

// Is the value an array?

        if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

            length = value.length;
            for (i = 0; i < length; i += 1) {
                partial[i] = str(i, value, limit) || 'null';
            }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

            v = partial.length === 0
                ? '[]'
                : gap
                    ? (
                      gap.length + partial.join(', ').length + 4 > limit ?
                      '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                      '[ ' + partial.join(', ') + ' ]'
                    )
                    : '[' + partial.join(',') + ']';
            gap = mind;
            return v;
        }

// If the replacer is an array, use it to select the members to be stringified.

        if (rep && typeof rep === 'object') {
            length = rep.length;
            for (i = 0; i < length; i += 1) {
                if (typeof rep[i] === 'string') {
                    k = rep[i];
                    v = str(k, value, limit);
                    if (v) {
                        partial.push(quote(k) + (
                            gap
                                ? ': '
                                : ':'
                        ) + v);
                    }
                }
            }
        } else {

// Otherwise, iterate through all of the keys in the object.

            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = str(k, value, limit);
                    if (v) {
                        partial.push(quote(k) + (
                            gap
                                ? ': '
                                : ':'
                        ) + v);
                    }
                }
            }
        }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

        v = partial.length === 0
            ? '{}'
            : gap
                ? (
                  gap.length + partial.join(', ').length + 4 > limit ?
                  '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                  '{ ' + partial.join(', ') + ' }'
                )
                : '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}


function beautify (value, replacer, space, limit) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

  var i;
  gap = '';
  indent = '';

  if (!limit) limit = 0;

  if (typeof limit !== "number")
    throw new Error("beaufifier: limit must be a number");

// If the space parameter is a number, make an indent string containing that
// many spaces.

  if (typeof space === 'number') {
      for (i = 0; i < space; i += 1) {
          indent += ' ';
      }

// If the space parameter is a string, it will be used as the indent string.

  } else if (typeof space === 'string') {
      indent = space;
  }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

  rep = replacer;
  if (replacer && typeof replacer !== 'function' &&
          (typeof replacer !== 'object' ||
          typeof replacer.length !== 'number')) {
      throw new Error('beautifier: wrong replacer parameter');
  }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

  return str('', {'': value}, limit);
}

function trim (str) {
  return str.replace(/^\s+|\s+$/g, '');
}

function slugify (str) { // https://gist.github.com/mathewbyrne/1280286
  str = trim(str).toLowerCase();
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to   = "aaaaeeeeiiiioooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++)
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  str = str.replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return str;
}

function inferTypes (name) {
  name = name.toLowerCase();
  if (name.indexOf("fruit")!==-1) {
    return ["fruit"];
  }
  if (name.indexOf("légumineu")!==-1) {
    return ["fruit"];
  }
  if (name.indexOf("feuille")!==-1) {
    return ["leaf"];
  }
  if (name.indexOf("chou")!==-1) {
    return ["root"];
  }
  if (name.indexOf("herb")!==-1) {
    return ["leaf"];
  }
  if (name.indexOf("racine")!==-1) {
    return ["root"];
  }
  if (name.indexOf("blanchis")!==-1) {
    return ["root"];
  }
  if (name.indexOf("oignon")!==-1) {
    return ["root"];
  }
  if (name.indexOf("fleur")!==-1) {
    return ["flower"];
  }
  return [];
}

function parseCalendarFromJanCell (td) {
  const arr = [];
  for (let i = 1; td; i++, td = td.nextElementSibling) {
    if (td.getAttribute("bgcolor")) {
      arr.push(i);
    }
  }
  return arr;
}

function parseCalendar (tr) {
  const td = tr.querySelector("td:first-child");
  const name = trim(
    td.children.length === 0
    ? td.textContent
    : td.firstChild===td.lastChild
      ? ""
      : td.lastChild.textContent
  );
  const seedling_indoors_months = parseCalendarFromJanCell(tr.querySelector("td:nth-child(2)"));
  const seedling_outdoors_or_planting_months = parseCalendarFromJanCell(tr.nextElementSibling.querySelector("td"));
  const harvest_months =  parseCalendarFromJanCell(tr.nextElementSibling.nextElementSibling.querySelector("td"));
  return {
    name,
    seedling_indoors_months,
    seedling_outdoors_or_planting_months,
    harvest_months,
  }
}

function splitFrenchEnumeration (str) {
  return trim(str)
  .split(/,| et | ou /)
  .map(word => trim(
    trim(word)
    .replace(/–$/, "")
    .replace("’", "'")
    .replace(/^de /, "")
    .replace(/^l'/, "")
    .replace(/^(du|des|la|le|les) /, "")
  ))
  .filter(word => word);
}

function importCompagnonnage () {
  const compagnonnage = [];
  [...document.querySelectorAll("tr")].forEach(tr => {
    const [ tdName, tdValue ] = tr.children;
    const rawName = trim(tdName.textContent);
    const bgcolor = tdName.getAttribute("bgcolor");
    const isLikes = bgcolor==="#23FF23";
    const isHates = bgcolor==="#FF3333";
    if (!isLikes && !isHates) return;
    splitFrenchEnumeration(rawName).map(name => {
      let compagnon = compagnonnage.find(item => item.name === name);
      if (!compagnon) {
        compagnon = {
          name,
          likes: [],
          hates: [],
        };
        compagnonnage.push(compagnon);
      }
      let values = splitFrenchEnumeration(
        tdValue.textContent.replace(/^(avec|après)/, "")
      );
      if (isLikes) {
        compagnon.likes = values;
      }
      if (isHates) {
        compagnon.hates = values;
      }
    });
  });
  return compagnonnage;
}

function slugCompagnon (compagnonName) {
  return slugify(
    compagnonName
    .split(/[\s]+/)
    .map(word => word.replace(/(x|s)$/, ""))
    .join(" ")
  );
}

function importSemis () {
  const table = document.querySelectorAll(".tables")[0];
  let currentCat, family, families = [];
  [...table.querySelectorAll('tr')].forEach(tr => {
    const b = tr.querySelector("b");
    if (b) {
      const height = tr.querySelector("td").getAttribute("height");
      const trimmed = trim(b.textContent);
      if (height && height!=="33" && trimmed && trimmed!=="janv.") {
        currentCat = trimmed;
      }
    }
    else {
      const tds = tr.querySelectorAll("td");
      const link = tds[0].querySelector("a");
      const children = [...tr.children];
      if (children.length !== 16) return;
      if (link) { // entering new family in that case...
        if (family) families.push(family);
        const name = trim(link.textContent);
        const id = slugify(name);
        const types = inferTypes(currentCat);
        const calendars = [ parseCalendar(tr) ];
        const germination_days = parseInt(children[13].textContent);
        const harvest_days = parseInt(children[14].textContent);
        const spacing_cm = parseInt(children[15].textContent);
        family = {
          id,
          name,
          wikipedia: link.href,
          types,
          calendars,
          germination_days,
          harvest_days,
          spacing_cm,
        };
      }
      else {
        family.calendars.push(parseCalendar(tr));
      }
    }
  });
  if (family) families.push(family);
  return families;
}


function joinCompagnonnage (families, compagnonnage) {
  families = families.map(o => Object.assign({}, o));
  const compagnonAliasToFamily = {};
  compagnonnage.forEach(item => {
    [ item.name ].concat(item.likes).concat(item.hates).forEach(name => {
      compagnonAliasToFamily[slugCompagnon(name)] = [];
    });
  });
  families.forEach(family => {
    Object.keys(compagnonAliasToFamily).forEach(slug => {
      if (slugCompagnon(family.name).indexOf(slug)!==-1) {
        compagnonAliasToFamily[slug].push(family.id);
      }
    });
  });
  families.forEach(family => {
    const slugs = [];
    Object.keys(compagnonAliasToFamily).forEach(slug => {
      compagnonAliasToFamily[slug].map(id => {
        if (id === family.id) {
          slugs.push(slug);
        }
      });
    });
    const genList = field => slugs.reduce((acc, slug) => {
      const maybeCompagnon = compagnonnage.find(c => slugCompagnon(c.name)===slug);
      if (!maybeCompagnon) return acc;
      return acc.concat(
        maybeCompagnon[field]
        .reduce((acc, cat) =>
          acc.concat(compagnonAliasToFamily[slugCompagnon(cat)]),
          []
        )
      );
    }, []);
    const likes = genList("likes");
    const hates = genList("hates");
    family.likes = likes;
    family.hates = hates;
  });
  return families.sort((a,b)=> a.id < b.id ?-1 : 1);
}

//JSON.stringify(importSemis())
// JSON.stringify(importCompagnonnage())


beautify(
  joinCompagnonnage(
// vegs
[{"id":"chicoree-endive","name":"Chicorée endive","wikipedia":"http://fr.wikipedia.org/wiki/Chicor%C3%A9e_endive","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5,6,7],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[7,8,9,10,11]}],"germination_days":15,"harvest_days":90,"spacing_cm":30},{"id":"artichaut","name":"Artichaut","wikipedia":"http://fr.wikipedia.org/wiki/Artichaut","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[5],"harvest_months":[8,9]}],"germination_days":20,"harvest_days":180,"spacing_cm":75},{"id":"laitue-romaine","name":"Laitue romaine","wikipedia":"http://fr.wikipedia.org/wiki/Laitue_romaine","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4,5,6,7],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[6,7,8,9]}],"germination_days":12,"harvest_days":90,"spacing_cm":25},{"id":"laitue-cultivee","name":"Laitue cultivée","wikipedia":"http://fr.wikipedia.org/wiki/Lactuca_sativa","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5,6,7],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[6,7,8,9,10,11]}],"germination_days":12,"harvest_days":75,"spacing_cm":40},{"id":"salade-de-jardin","name":"Salade de jardin","wikipedia":"http://fr.wikipedia.org/wiki/Salade_(plante)","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[5,6,7,8],"harvest_months":[5,6,7,8,9,10,11]}],"germination_days":12,"harvest_days":65,"spacing_cm":30},{"id":"cardamines","name":"Cardamines","wikipedia":"http://fr.wikipedia.org/wiki/Cardamine","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4,5,6,7,8],"harvest_months":[5,6,7,8,9,10,11]}],"germination_days":14,"harvest_days":90,"spacing_cm":30},{"id":"moutarde","name":"Moutarde","wikipedia":"http://fr.wikipedia.org/wiki/Moutarde_blanche","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5,6,7,8],"seedling_outdoors_or_planting_months":[3,4,5,6,7,8,9,10],"harvest_months":[4,5,6,7,8,9,10]}],"germination_days":4,"harvest_days":90,"spacing_cm":15},{"id":"tetragonia","name":"Tetragonia","wikipedia":"http://fr.wikipedia.org/wiki/Tetragonia","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[6,7],"harvest_months":[6,7,8,9,10,11]}],"germination_days":30,"harvest_days":100,"spacing_cm":40},{"id":"capucine","name":"Capucine","wikipedia":"http://fr.wikipedia.org/wiki/Grande_capucine","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[4,5,6],"harvest_months":[7,8,9]}],"germination_days":14,"harvest_days":85,"spacing_cm":50},{"id":"pourpier","name":"Pourpier","wikipedia":"http://fr.wikipedia.org/wiki/Portulaca_oleracea","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[4,5,6,7,8],"seedling_outdoors_or_planting_months":[7,8],"harvest_months":[7,8,9]}],"germination_days":3,"harvest_days":28,"spacing_cm":0},{"id":"rhubarbe","name":"Rhubarbe","wikipedia":"http://fr.wikipedia.org/wiki/Rheum_rhabarbarum","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[4,5],"seedling_outdoors_or_planting_months":[9,10,11,12],"harvest_months":[4,5,6,7,8]}],"germination_days":8,"harvest_days":360,"spacing_cm":50},{"id":"brocoli-rave","name":"Brocoli-rave","wikipedia":"http://fr.wikipedia.org/wiki/Brocoli-rave","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[1,2],"seedling_outdoors_or_planting_months":[3,4,5],"harvest_months":[5,6,7,8,9,10,11]}],"germination_days":3,"harvest_days":35,"spacing_cm":8},{"id":"laitue","name":"Laitue","wikipedia":"http://fr.wikipedia.org/wiki/Laitue_cultiv%C3%A9e","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4,5,6,7,8],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[5,6,7,8,9,10]}],"germination_days":10,"harvest_days":65,"spacing_cm":30},{"id":"blette","name":"Blette","wikipedia":"http://fr.wikipedia.org/wiki/Blette_(plante)","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5,6,7,8],"seedling_outdoors_or_planting_months":[3,4,5,6,7,8,9,10,11],"harvest_months":[5,6,7,8,9,10,11]}],"germination_days":10,"harvest_days":70,"spacing_cm":20},{"id":"rutabaga","name":"Rutabaga","wikipedia":"http://fr.wikipedia.org/wiki/Rutabaga","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[1,2,11,12],"seedling_outdoors_or_planting_months":[3,4,5,6,7,8],"harvest_months":[3,4,5,6,7,8,9]}],"germination_days":10,"harvest_days":100,"spacing_cm":10},{"id":"coupe-laitue","name":"Coupe laitue","wikipedia":"http://fr.wikipedia.org/wiki/Laitue_cultiv%C3%A9e","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3],"seedling_outdoors_or_planting_months":[4,5,6,7,8,9],"harvest_months":[4,5,6,7,8,9,10,11]}],"germination_days":15,"harvest_days":45,"spacing_cm":5},{"id":"epinard","name":"Épinard","wikipedia":"http://fr.wikipedia.org/wiki/%C3%89pinard","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[1,2],"seedling_outdoors_or_planting_months":[1,2,3,4,5,6,7,8],"harvest_months":[4,5,6,7,8,9,10,11]}],"germination_days":10,"harvest_days":35,"spacing_cm":5},{"id":"laitue-chinoise","name":"laitue chinoise","wikipedia":"http://fr.wikipedia.org/wiki/Laitue_cultiv%C3%A9e","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4,5,6,7],"harvest_months":[7,8,9,10]}],"germination_days":10,"harvest_days":60,"spacing_cm":20},{"id":"cresson-alenois","name":"Cresson alénois","wikipedia":"https://fr.wikipedia.org/wiki/Cresson_al%C3%A9nois","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[1,2,3,4,5,6,7,8,9,10,11,12],"seedling_outdoors_or_planting_months":[3,4,5,6,7,8,9,10],"harvest_months":[1,2,3,4,5,6,7,8,9,10,11,12]}],"germination_days":3,"harvest_days":12,"spacing_cm":0},{"id":"mache","name":"Mâche","wikipedia":"http://fr.wikipedia.org/wiki/Valerianella_locusta","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4,5,6,7,8,9],"harvest_months":[4,5,6,7,8,9,10,11,12]}],"germination_days":15,"harvest_days":75,"spacing_cm":5},{"id":"rorippa","name":"Rorippa","wikipedia":"https://fr.wikipedia.org/wiki/Rorippa","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4,5,6],"harvest_months":[4,5,6,7,8,9,10,11]}],"germination_days":15,"harvest_days":50,"spacing_cm":20},{"id":"claytone-de-cuba","name":"Claytone de Cuba","wikipedia":"http://fr.wikipedia.org/wiki/Claytonia_perfoliata","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[7,8,9,10],"seedling_outdoors_or_planting_months":[8,9,10],"harvest_months":[1,2,3,10,11,12]}],"germination_days":3,"harvest_days":30,"spacing_cm":0},{"id":"pomme-de-terre","name":"Pomme de terre","wikipedia":"http://fr.wikipedia.org/wiki/Pomme_de_terre","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[4,5,6],"harvest_months":[7,8,9]}],"germination_days":20,"harvest_days":120,"spacing_cm":40},{"id":"topinambour","name":"Topinambour","wikipedia":"http://fr.wikipedia.org/wiki/Topinambour","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4],"harvest_months":[10,11]}],"germination_days":10,"harvest_days":300,"spacing_cm":40},{"id":"betterave-potagere","name":"Betterave potagère","wikipedia":"http://fr.wikipedia.org/wiki/Betterave_potag%C3%A8re","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[2,3],"harvest_months":[4,5,6]}],"germination_days":15,"harvest_days":85,"spacing_cm":10},{"id":"celeri-rave","name":"Céleri-rave","wikipedia":"http://fr.wikipedia.org/wiki/C%C3%A9leri-rave","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[2,3],"seedling_outdoors_or_planting_months":[4,5],"harvest_months":[9,10,11,12]}],"germination_days":20,"harvest_days":260,"spacing_cm":35},{"id":"rutabaga","name":"Rutabaga","wikipedia":"http://fr.wikipedia.org/wiki/Rutabaga","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[4,5,6],"harvest_months":[10,11,12]}],"germination_days":15,"harvest_days":135,"spacing_cm":35},{"id":"panais","name":"Panais","wikipedia":"http://fr.wikipedia.org/wiki/Panais","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[3],"seedling_outdoors_or_planting_months":[4],"harvest_months":[10,11,12]}],"germination_days":15,"harvest_days":260,"spacing_cm":30},{"id":"navet","name":"Navet","wikipedia":"http://fr.wikipedia.org/wiki/Navet","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4,5],"harvest_months":[7,8,9,10]}],"germination_days":12,"harvest_days":70,"spacing_cm":10},{"id":"radis","name":"Radis","wikipedia":"http://fr.wikipedia.org/wiki/Raphanus_sativus","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[3],"seedling_outdoors_or_planting_months":[4,5,6,7,8,9],"harvest_months":[4,5,6,7,8,9,10]}],"germination_days":10,"harvest_days":40,"spacing_cm":5},{"id":"radis-noir","name":"Radis noir","wikipedia":"http://fr.wikipedia.org/wiki/Radis_noir","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5,6,7,8],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[5,6,7,8,9,10,11,12]}],"germination_days":10,"harvest_days":90,"spacing_cm":15},{"id":"scorsonere-despagne","name":"Scorsonère d’Espagne","wikipedia":"http://fr.wikipedia.org/wiki/Scorzonera_hispanica","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[4,5],"harvest_months":[1,2,10,11,12]}],"germination_days":15,"harvest_days":200,"spacing_cm":10},{"id":"carotte","name":"Carotte","wikipedia":"http://fr.wikipedia.org/wiki/Carotte","types":["root"],"calendars":[{"name":"Carotte hiver","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[8,9,10,11,12]},{"name":"Carotte d’été","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[4,5,6],"harvest_months":[6,7,8,9]}],"germination_days":15,"harvest_days":240,"spacing_cm":20},{"id":"persil","name":"Persil","wikipedia":"http://fr.wikipedia.org/wiki/Petroselinum_crispum","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[4],"harvest_months":[10,11]}],"germination_days":10,"harvest_days":130,"spacing_cm":10},{"id":"poireau","name":"Poireau","wikipedia":"http://fr.wikipedia.org/wiki/Poireau","types":["root"],"calendars":[{"name":"Cultures d’été","seedling_indoors_months":[1],"seedling_outdoors_or_planting_months":[3],"harvest_months":[7,8,9]},{"name":"Cultures d’automne","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3],"harvest_months":[10,11,12]},{"name":"Culture d’hiver","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[4],"harvest_months":[1,2,3]}],"germination_days":20,"harvest_days":170,"spacing_cm":15},{"id":"oignon-rocambole","name":"Oignon rocambole","wikipedia":"http://en.wikipedia.org/wiki/Tree_onion","types":["root"],"calendars":[{"name":"(en)","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3],"harvest_months":[6,7,8]}],"germination_days":12,"harvest_days":90,"spacing_cm":15},{"id":"loignon-cebette","name":"L’oignon cébette","wikipedia":"https://fr.wikipedia.org/wiki/C%C3%A9bette","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4,5,6],"seedling_outdoors_or_planting_months":[4,5,6,7],"harvest_months":[6,7,8,9]}],"germination_days":16,"harvest_days":100,"spacing_cm":15},{"id":"ail-cultive","name":"Ail cultivé","wikipedia":"http://fr.wikipedia.org/wiki/Ail_cultiv%C3%A9","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[1,2,3,4,10,11,12],"harvest_months":[6,7]}],"germination_days":20,"harvest_days":180,"spacing_cm":15},{"id":"echalotte","name":"Échalotte","wikipedia":"http://fr.wikipedia.org/wiki/%C3%89chalote","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4],"harvest_months":[7,8]}],"germination_days":10,"harvest_days":130,"spacing_cm":10},{"id":"oignon-semis","name":"Oignon semis","wikipedia":"http://fr.wikipedia.org/wiki/Oignon","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[1,2,3],"seedling_outdoors_or_planting_months":[4,5],"harvest_months":[7,8,9,10]}],"germination_days":20,"harvest_days":170,"spacing_cm":2},{"id":"loignon-ensemencement","name":"L’oignon ensemencement","wikipedia":"http://fr.wikipedia.org/wiki/Oignon","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[1,2,3],"seedling_outdoors_or_planting_months":[4],"harvest_months":[9]}],"germination_days":15,"harvest_days":220,"spacing_cm":5},{"id":"oignon-plante-1ere-annee","name":"Oignon plante 1ère année","wikipedia":"http://fr.wikipedia.org/wiki/Oignon","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[4],"harvest_months":[8]}],"germination_days":15,"harvest_days":220,"spacing_cm":5},{"id":"oignon-plante-2e-annee","name":"Oignon plante 2e année","wikipedia":"http://fr.wikipedia.org/wiki/Oignon","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4],"harvest_months":[8]}],"germination_days":15,"harvest_days":220,"spacing_cm":5},{"id":"oignons-dhiver","name":"Oignons d’hiver","wikipedia":"http://fr.wikipedia.org/wiki/Oignon","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[8],"harvest_months":[5,6]}],"germination_days":15,"harvest_days":220,"spacing_cm":5},{"id":"oignon-blanc","name":"Oignon blanc","wikipedia":"http://fr.wikipedia.org/wiki/Oignon","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4,5],"harvest_months":[7,8]}],"germination_days":15,"harvest_days":220,"spacing_cm":5},{"id":"chou-frise","name":"Chou frisé","wikipedia":"http://fr.wikipedia.org/wiki/Chou_fris%C3%A9","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[5,6],"seedling_outdoors_or_planting_months":[7],"harvest_months":[1,2,8,9,10,11,12]}],"germination_days":10,"harvest_days":160,"spacing_cm":75},{"id":"chou-fleur","name":"Chou-fleur","wikipedia":"http://fr.wikipedia.org/wiki/Chou-fleur","types":["root"],"calendars":[{"name":"Culture précoce","seedling_indoors_months":[2],"seedling_outdoors_or_planting_months":[4],"harvest_months":[7]},{"name":"Cultures d’été","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4,5],"harvest_months":[8,9]},{"name":"Cultures d’automne","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[6,7],"harvest_months":[10,11]},{"name":"Culture d’hiver","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[7,8],"harvest_months":[4,5]}],"germination_days":15,"harvest_days":175,"spacing_cm":60},{"id":"brocoli","name":"Brocoli","wikipedia":"http://fr.wikipedia.org/wiki/Brocoli","types":["root"],"calendars":[{"name":"Cultures d’été","seedling_indoors_months":[2,3,4],"seedling_outdoors_or_planting_months":[6],"harvest_months":[8]},{"name":"Culture d’hiver","seedling_indoors_months":[4],"seedling_outdoors_or_planting_months":[6],"harvest_months":[1,2,3,4,10,11,12]}],"germination_days":8,"harvest_days":100,"spacing_cm":50},{"id":"pe-tsai","name":"Pe-tsaï","wikipedia":"http://fr.wikipedia.org/wiki/Pe-tsa%C3%AF","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5,6,7],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[6,7,8,9,10]}],"germination_days":15,"harvest_days":90,"spacing_cm":30},{"id":"chou-romanesco","name":"Chou romanesco","wikipedia":"http://fr.wikipedia.org/wiki/Chou_romanesco","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[4,5,6,7],"seedling_outdoors_or_planting_months":[4,5,6,7],"harvest_months":[7,8,9,10,11]}],"germination_days":10,"harvest_days":110,"spacing_cm":60},{"id":"chou-rave","name":"Chou-rave","wikipedia":"http://fr.wikipedia.org/wiki/Chou-rave","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5,6,7],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[6,7,8,9,10,11]}],"germination_days":8,"harvest_days":85,"spacing_cm":25},{"id":"bok-choy","name":"Bok choy","wikipedia":"http://fr.wikipedia.org/wiki/Bok_choy","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5,6,7,8],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[5,6,7,8,9,10]}],"germination_days":10,"harvest_days":90,"spacing_cm":25},{"id":"chou-rouge","name":"Chou rouge","wikipedia":"http://fr.wikipedia.org/wiki/Chou_rouge","types":["root"],"calendars":[{"name":"Culture précoce","seedling_indoors_months":[1],"seedling_outdoors_or_planting_months":[4],"harvest_months":[5,6]},{"name":"Cultures d’été","seedling_indoors_months":[3],"seedling_outdoors_or_planting_months":[5],"harvest_months":[7,8]},{"name":"Cultures d’automne","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[4],"harvest_months":[9,10,11]}],"germination_days":15,"harvest_days":160,"spacing_cm":50},{"id":"chou-cabus","name":"Chou cabus","wikipedia":"http://fr.wikipedia.org/wiki/Chou_cabus","types":["root"],"calendars":[{"name":"Culture précoce","seedling_indoors_months":[1],"seedling_outdoors_or_planting_months":[4],"harvest_months":[5,6]},{"name":"Cultures d’été","seedling_indoors_months":[3],"seedling_outdoors_or_planting_months":[5],"harvest_months":[7,8]},{"name":"Cultures d’automne","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[4],"harvest_months":[9,10,11]},{"name":"Culture d’hiver","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[8],"harvest_months":[4,5]}],"germination_days":15,"harvest_days":120,"spacing_cm":50},{"id":"chou-de-milan","name":"Chou de Milan","wikipedia":"http://fr.wikipedia.org/wiki/Chou_de_Milan","types":["root"],"calendars":[{"name":"Culture précoce","seedling_indoors_months":[1],"seedling_outdoors_or_planting_months":[4],"harvest_months":[5,6]},{"name":"Cultures d’été","seedling_indoors_months":[3],"seedling_outdoors_or_planting_months":[5],"harvest_months":[7,8]},{"name":"Cultures d’automne","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[4],"harvest_months":[9,10,11]},{"name":"Culture d’hiver","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[8],"harvest_months":[4,5]}],"germination_days":15,"harvest_days":160,"spacing_cm":60},{"id":"chou-de-bruxelles","name":"Chou de Bruxelles","wikipedia":"http://fr.wikipedia.org/wiki/Chou_de_Bruxelles","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[9,10,11,12]}],"germination_days":15,"harvest_days":250,"spacing_cm":60},{"id":"lotier","name":"Lotier","wikipedia":"http://fr.wikipedia.org/wiki/Lotier","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4,5,6],"harvest_months":[7,8,9]}],"germination_days":12,"harvest_days":120,"spacing_cm":5},{"id":"pois-gris","name":"Pois gris","wikipedia":"http://fr.wikipedia.org/wiki/Pisum_sativum","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[2],"seedling_outdoors_or_planting_months":[3],"harvest_months":[7]}],"germination_days":10,"harvest_days":70,"spacing_cm":5},{"id":"pois","name":"Pois","wikipedia":"http://fr.wikipedia.org/wiki/Pisum_sativum","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[2,3],"seedling_outdoors_or_planting_months":[4,5],"harvest_months":[6,7]}],"germination_days":10,"harvest_days":70,"spacing_cm":5},{"id":"pois-de-neige","name":"Pois de neige","wikipedia":"http://fr.wikipedia.org/wiki/Pois","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[3],"seedling_outdoors_or_planting_months":[4],"harvest_months":[6,7]}],"germination_days":10,"harvest_days":70,"spacing_cm":5},{"id":"haricot-despagne","name":"Haricot d’Espagne","wikipedia":"http://fr.wikipedia.org/wiki/Haricot_d'Espagne","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[8,9]}],"germination_days":12,"harvest_days":90,"spacing_cm":5},{"id":"haricot-vert","name":"Haricot vert","wikipedia":"http://fr.wikipedia.org/wiki/Haricot_vert","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[8,9]}],"germination_days":14,"harvest_days":70,"spacing_cm":10},{"id":"haricot","name":"Haricot","wikipedia":"http://fr.wikipedia.org/wiki/Haricot_vert","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4],"harvest_months":[9]}],"germination_days":14,"harvest_days":70,"spacing_cm":10},{"id":"haricot-rouge","name":"Haricot rouge","wikipedia":"http://fr.wikipedia.org/wiki/Haricot","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[7,8,9]}],"germination_days":14,"harvest_days":70,"spacing_cm":10},{"id":"tribu-haricot","name":"Tribu Haricot","wikipedia":"http://fr.wikipedia.org/wiki/Haricot","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[3,4],"harvest_months":[7,8,9]}],"germination_days":14,"harvest_days":70,"spacing_cm":10},{"id":"pole-haricot","name":"Pôle haricot","wikipedia":"http://fr.wikipedia.org/wiki/Haricot","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[5],"seedling_outdoors_or_planting_months":[6],"harvest_months":[7,8,9]}],"germination_days":14,"harvest_days":70,"spacing_cm":10},{"id":"pole-haricots-verts","name":"Pôle haricots verts","wikipedia":"http://fr.wikipedia.org/wiki/Haricot_vert","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[8,9]}],"germination_days":14,"harvest_days":70,"spacing_cm":10},{"id":"lendive-ou-chicon","name":"L’endive ou chicon","wikipedia":"http://fr.wikipedia.org/wiki/Endive","types":["root"],"calendars":[{"name":"","seedling_indoors_months":[4],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[1,9,10,11,12]}],"germination_days":15,"harvest_days":280,"spacing_cm":10},{"id":"fraisiers","name":"Fraisiers","wikipedia":"http://fr.wikipedia.org/wiki/Fragaria","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[8,9],"harvest_months":[6,7,8,9,10]}],"germination_days":20,"harvest_days":170,"spacing_cm":35},{"id":"cornichon","name":"Cornichon","wikipedia":"http://fr.wikipedia.org/wiki/Cornichon","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[4],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[7,8,9]}],"germination_days":10,"harvest_days":90,"spacing_cm":15},{"id":"fraisier-des-bois","name":"Fraisier des bois","wikipedia":"http://fr.wikipedia.org/wiki/Fraisier_des_bois","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[],"harvest_months":[5,6,7]}],"germination_days":null,"harvest_days":null,"spacing_cm":null},{"id":"rubus","name":"Rubus","wikipedia":"http://fr.wikipedia.org/wiki/Rubus","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[],"harvest_months":[7,8,9,10]}],"germination_days":null,"harvest_days":null,"spacing_cm":null},{"id":"courgette","name":"Courgette","wikipedia":"http://fr.wikipedia.org/wiki/Courgette","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[4,5,6],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[9,10,11]}],"germination_days":10,"harvest_days":95,"spacing_cm":100},{"id":"framboise","name":"Framboise","wikipedia":"http://fr.wikipedia.org/wiki/Framboise","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[],"seedling_outdoors_or_planting_months":[],"harvest_months":[7,8,9,10]}],"germination_days":null,"harvest_days":null,"spacing_cm":null},{"id":"concombre","name":"Concombre","wikipedia":"https://fr.wikipedia.org/wiki/Concombre","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[4],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[7,8,9]}],"germination_days":10,"harvest_days":100,"spacing_cm":15},{"id":"mais","name":"Maïs","wikipedia":"http://fr.wikipedia.org/wiki/Ma%C3%AFs","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[4,5],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[6,7,8,9]}],"germination_days":15,"harvest_days":130,"spacing_cm":40},{"id":"melon","name":"Melon","wikipedia":"http://fr.wikipedia.org/wiki/Melon_(plante)","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[4,5,6],"seedling_outdoors_or_planting_months":[6],"harvest_months":[8,9,10]}],"germination_days":10,"harvest_days":150,"spacing_cm":30},{"id":"citrouille","name":"Citrouille","wikipedia":"http://fr.wikipedia.org/wiki/Citrouille","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[4],"seedling_outdoors_or_planting_months":[5],"harvest_months":[8,9]}],"germination_days":20,"harvest_days":140,"spacing_cm":100},{"id":"poivrier-noir","name":"Poivrier noir","wikipedia":"http://fr.wikipedia.org/wiki/Poivrier_noir","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[6],"harvest_months":[8,9,10]}],"germination_days":15,"harvest_days":180,"spacing_cm":45},{"id":"mais-doux","name":"Maïs doux","wikipedia":"http://fr.wikipedia.org/wiki/Ma%C3%AFs_doux","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[4,5],"seedling_outdoors_or_planting_months":[6],"harvest_months":[8,9,10]}],"germination_days":15,"harvest_days":130,"spacing_cm":40},{"id":"tomate","name":"Tomate","wikipedia":"http://fr.wikipedia.org/wiki/Tomate","types":["fruit"],"calendars":[{"name":"","seedling_indoors_months":[2,3],"seedling_outdoors_or_planting_months":[5],"harvest_months":[7,8,9,10]}],"germination_days":10,"harvest_days":130,"spacing_cm":45}]
.concat(
// herbs
[{"id":"anis-vert","name":"Anis vert","wikipedia":"http://fr.wikipedia.org/wiki/Anis_vert","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[4,5],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[7,8,9,10]}],"germination_days":15,"harvest_days":120,"spacing_cm":25},{"id":"basilic","name":"Basilic","wikipedia":"https://fr.wikipedia.org/wiki/Basilic_(plante)","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5,6],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[6,7,8,9,10]}],"germination_days":14,"harvest_days":90,"spacing_cm":30},{"id":"ciboulette","name":"Ciboulette","wikipedia":"http://fr.wikipedia.org/wiki/Ciboulette_(botanique)","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[6,7,8,9,10]}],"germination_days":18,"harvest_days":90,"spacing_cm":25},{"id":"persil","name":"Persil","wikipedia":"http://fr.wikipedia.org/wiki/Persil","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4,5,6,7],"seedling_outdoors_or_planting_months":[4,5,6,7],"harvest_months":[5,6,7,8,9,10]}],"germination_days":30,"harvest_days":90,"spacing_cm":30},{"id":"loseille-sanguine","name":"L’Oseille sanguine","wikipedia":"https://fr.wikipedia.org/wiki/Rumex","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[7,8,9,10]}],"germination_days":12,"harvest_days":60,"spacing_cm":5},{"id":"ciboule-de-chine","name":"Ciboule de Chine","wikipedia":"http://fr.wikipedia.org/wiki/Ciboule_de_Chine","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4],"seedling_outdoors_or_planting_months":[4,5,6],"harvest_months":[7,8,9,10]}],"germination_days":18,"harvest_days":150,"spacing_cm":25},{"id":"basilic-citron","name":"Basilic citron","wikipedia":"http://fr.wikipedia.org/wiki/Basilic_(plante)","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[6,7,8,9]}],"germination_days":14,"harvest_days":90,"spacing_cm":25},{"id":"citronnelle","name":"Citronnelle","wikipedia":"http://fr.wikipedia.org/wiki/Citronnelle","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4,5],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[7,8,9,10]}],"germination_days":21,"harvest_days":90,"spacing_cm":25},{"id":"melisse-officinale","name":"Mélisse officinale","wikipedia":"http://fr.wikipedia.org/wiki/M%C3%A9lisse_officinale","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[7,8,9],"harvest_months":[7,8,9]}],"germination_days":21,"harvest_days":120,"spacing_cm":30},{"id":"lail-des-ours","name":"L’Ail des ours","wikipedia":"http://fr.wikipedia.org/wiki/Allium_ursinum","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[4],"seedling_outdoors_or_planting_months":[4,5,6],"harvest_months":[3,4,5,6,7,8,9,10,11,12]}],"germination_days":365,"harvest_days":90,"spacing_cm":10},{"id":"aneth","name":"Aneth","wikipedia":"http://fr.wikipedia.org/wiki/Aneth","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[4],"seedling_outdoors_or_planting_months":[4,5,6,7],"harvest_months":[7,8,9]}],"germination_days":15,"harvest_days":60,"spacing_cm":15},{"id":"moutarde","name":"Moutarde","wikipedia":"http://fr.wikipedia.org/wiki/Moutarde_(condiment)","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[4,5],"seedling_outdoors_or_planting_months":[5,6,7,8],"harvest_months":[7,8,9,10,11]}],"germination_days":10,"harvest_days":90,"spacing_cm":15},{"id":"camomille","name":"Camomille","wikipedia":"http://fr.wikipedia.org/wiki/Matricaria_recutita","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[5,6,7,8]}],"germination_days":18,"harvest_days":60,"spacing_cm":25},{"id":"cerfeuil-commun","name":"Cerfeuil commun","wikipedia":"http://fr.wikipedia.org/wiki/Cerfeuil_commun","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[5,6,7,8],"harvest_months":[6,7,8,9,10]}],"germination_days":14,"harvest_days":90,"spacing_cm":10},{"id":"bourrache","name":"Bourrache","wikipedia":"http://fr.wikipedia.org/wiki/Bourrache_officinale","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[4],"seedling_outdoors_or_planting_months":[4,5,6,7],"harvest_months":[7,8,9,10]}],"germination_days":10,"harvest_days":60,"spacing_cm":20},{"id":"coriandre","name":"Coriandre","wikipedia":"http://fr.wikipedia.org/wiki/Coriandre","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[7,8,9,10]}],"germination_days":16,"harvest_days":120,"spacing_cm":25},{"id":"menthe-verte","name":"Menthe verte","wikipedia":"http://fr.wikipedia.org/wiki/Mentha_spicata","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[4,5,6,7,8],"harvest_months":[7,8,9,10]}],"germination_days":21,"harvest_days":120,"spacing_cm":30},{"id":"ail","name":"Ail","wikipedia":"http://fr.wikipedia.org/wiki/Ail_cultiv%C3%A9","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[12],"seedling_outdoors_or_planting_months":[2,3,4,9,10,11],"harvest_months":[6,7,8]}],"germination_days":30,"harvest_days":120,"spacing_cm":3},{"id":"lavandula","name":"Lavandula","wikipedia":"http://fr.wikipedia.org/wiki/Lavandula","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4,5],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[6,7,8,9]}],"germination_days":20,"harvest_days":120,"spacing_cm":35},{"id":"lasperule-odorante","name":"L’Aspérule odorante","wikipedia":"http://fr.wikipedia.org/wiki/Galium_odoratum","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3],"seedling_outdoors_or_planting_months":[3,4,5,6,7,10,11],"harvest_months":[5,6,7]}],"germination_days":50,"harvest_days":180,"spacing_cm":20},{"id":"liveche","name":"Livèche","wikipedia":"http://fr.wikipedia.org/wiki/Liv%C3%A8che","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[6,7,8,9,10]}],"germination_days":21,"harvest_days":90,"spacing_cm":50},{"id":"marjolaine-lorigan","name":"Marjolaine, l’Origan","wikipedia":"http://fr.wikipedia.org/wiki/Origanum_vulgare","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[6,7,8,9]}],"germination_days":15,"harvest_days":130,"spacing_cm":25},{"id":"menthe-pouliot","name":"Menthe pouliot","wikipedia":"https://fr.wikipedia.org/wiki/Menthe_pouliot","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[5,6,7,8],"harvest_months":[6,7,8,9,10]}],"germination_days":20,"harvest_days":90,"spacing_cm":35},{"id":"estragon","name":"Estragon","wikipedia":"http://fr.wikipedia.org/wiki/Estragon","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[6,7,8,9]}],"germination_days":21,"harvest_days":90,"spacing_cm":50},{"id":"arroche-des-jardins","name":"Arroche des jardins","wikipedia":"http://fr.wikipedia.org/wiki/Arroche_des_jardins","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[4,5],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[7,8,9]}],"germination_days":14,"harvest_days":60,"spacing_cm":30},{"id":"romarin","name":"Romarin","wikipedia":"http://fr.wikipedia.org/wiki/Romarin","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4,5],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[5,6,7,8,9]}],"germination_days":30,"harvest_days":90,"spacing_cm":40},{"id":"sauge","name":"Sauge","wikipedia":"http://fr.wikipedia.org/wiki/Sauge","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4],"seedling_outdoors_or_planting_months":[4,5,6],"harvest_months":[6,7,8,9,10]}],"germination_days":25,"harvest_days":120,"spacing_cm":35},{"id":"celeri-a-couper","name":"Céleri à couper","wikipedia":"http://fr.wikipedia.org/wiki/C%C3%A9leri","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[4,5,6,7],"harvest_months":[7,8,9,10]}],"germination_days":20,"harvest_days":120,"spacing_cm":30},{"id":"thym","name":"Thym","wikipedia":"http://fr.wikipedia.org/wiki/Thym","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[5,6,7],"harvest_months":[6,7,8,9]}],"germination_days":18,"harvest_days":90,"spacing_cm":25},{"id":"rumex","name":"Rumex","wikipedia":"http://fr.wikipedia.org/wiki/Oseille_commune","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[7,8,9,10]}],"germination_days":10,"harvest_days":45,"spacing_cm":3},{"id":"rorippa","name":"Rorippa","wikipedia":"http://fr.wikipedia.org/wiki/Rorippa","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4,5],"seedling_outdoors_or_planting_months":[5,6],"harvest_months":[6,7,8,9,10]}],"germination_days":16,"harvest_days":30,"spacing_cm":10},{"id":"persil-tubereux","name":"Persil tubéreux","wikipedia":"https://fr.wikipedia.org/wiki/Persil","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3,4],"seedling_outdoors_or_planting_months":[4,5],"harvest_months":[9,10,11]}],"germination_days":30,"harvest_days":210,"spacing_cm":25},{"id":"sarriette","name":"Sarriette","wikipedia":"http://fr.wikipedia.org/wiki/Sarriette","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[2,3],"seedling_outdoors_or_planting_months":[3,4,5,6],"harvest_months":[6,7,8,9]}],"germination_days":18,"harvest_days":60,"spacing_cm":20},{"id":"oseille","name":"Oseille","wikipedia":"http://fr.wikipedia.org/wiki/Oseille","types":["leaf"],"calendars":[{"name":"","seedling_indoors_months":[3,4],"seedling_outdoors_or_planting_months":[4,5],"harvest_months":[7,8,9,10]}],"germination_days":16,"harvest_days":120,"spacing_cm":30}]
)
  ,
  [{"name":"Pomme de terre","likes":["soucis","pois","haricots","ail","tournesols"],"hates":[]},{"name":"Fraises","likes":["soucis","haricots nains","laitue","épinards","ail","bourrache"],"hates":["chou"]},{"name":"Endive","likes":["fenouil"],"hates":[]},{"name":"Asperges","likes":["tomate","persil","soucis"],"hates":[]},{"name":"Aubergines","likes":["marjolaine"],"hates":[]},{"name":"Chou-fleur","likes":["origan"],"hates":["épinards"]},{"name":"Haricots","likes":["céleri","sauge","carottes","chou-fleur","laitue","pommes de terre"],"hates":["fenouil","oignon","échalote","ail","glaïeuls"]},{"name":"Betterave","likes":["oignons","haricots nains","aneth","céleri","chou-rave","ail"],"hates":[]},{"name":"Aneth","likes":["carottes","poireaux","navets","sauge","fenouil","céleri"],"hates":[]},{"name":"Pois","likes":["haricots","carottes","poireaux","navets","sauge","fenouil","céleri"],"hates":["oignon","ail","rue"]},{"name":"Chou-rave","likes":["céleri"],"hates":[]},{"name":"Concombre","likes":["aneth","ail","céleri","fenouil"],"hates":[]},{"name":"Melon","likes":["ail","capucines"],"hates":[]},{"name":"Poireaux","likes":["haricots","carottes","petits pois","navets"],"hates":[]},{"name":"Radis","likes":["persil"],"hates":[]},{"name":"Navets","likes":["haricots","carottes","poireaux","persil"],"hates":[]},{"name":"Céleri","likes":["poireaux","choux","basilic"],"hates":[]},{"name":"Laitue","likes":["cerfeuil","aneth","fenouil","carottes","navets","ail"],"hates":["persil"]},{"name":"Épinards","likes":["céleri"],"hates":[]},{"name":"Piments","likes":["basilic","ail","ciboulette"],"hates":[]},{"name":"Tomates","likes":["persil","basilic","ciboulette à l'ail","soucis"],"hates":["fenouil","chou-rave"]},{"name":"Fèves","likes":["aneth","sarriette"],"hates":[]},{"name":"Oignons","likes":["carottes","betteraves","tomates","camomille","sarriette","persil"],"hates":["haricots","chou"]},{"name":"Carottes","likes":["laitue","pois","aneth","ciboulette","ail"],"hates":[]},{"name":"Pommes de terre","likes":[],"hates":["tomates","romarin","menthe","thym","camomille"]},{"name":"ail","likes":[],"hates":["haricots","chou"]}]
  )
, null, 2, 80);
