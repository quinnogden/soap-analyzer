import { parseString } from 'xml2js';
import { stripPrefix } from 'xml2js/lib/processors';
import * as cheerio from 'cheerio';

export const isSOAPRequest = (request) => {
  const { headers } = request.request;
  // Header names are case-insensitive, and HTTP/2 sends them lowercased
  const contentType = headers.find((header) => {
    return header.name.toLowerCase() === 'content-type';
  });
  if(contentType) {
    //If the content type header contains 'text/xml'
    if(contentType.value.indexOf('text/xml') > -1) {
      return true;
    }
  }
  return false;
};

// Matches the Network tab: HTTP errors, and requests that never got a response
export const isFailedRequest = (request) => {
  const { status, _error } = request.response;
  return status >= 400 || status <= 0 || !!_error;
};

// The response body, or '' when there's none: the request got no response, or
// DevTools dropped the body when the page navigated before it was asked for
export const getResponseContent = (request) => {
  return new Promise((resolve) => {
    request.getContent((content) => resolve(content || ''));
  });
};

export const getWebServiceName = async (xml) => {
  return new Promise((resolve, reject) => {
    const parseConfig = {
      // Attributes on Body would otherwise appear as a '$' key ahead of the service name
      ignoreAttrs: true,
      tagNameProcessors: [stripPrefix]
    };
    parseString(xml, parseConfig, (err, result) => {
      if(err) {
        reject(err);
      } else {
        const SOAPBody = result.Envelope.Body[0];
        const webServiceName = Object.getOwnPropertyNames(SOAPBody)[0];
        resolve(webServiceName);
      }
    });
  });
};

// Values of the request's InterfaceName elements, in order and without repeats.
// Services that send them use them to name the screen or form a call is for.
export const getInterfaceNames = (xml) => {
  const $ = cheerio.load(xml, { xmlMode: true });
  const names = $('*')
    .filter((i, elem) => elem.name.split(':').pop() === 'InterfaceName')
    .map((i, elem) => $(elem).text().trim())
    .get()
    .filter((name) => name);
  return [...new Set(names)];
};

// What the service list shows for a service, which is also what the filter matches
export const getListNames = (service, showInterfaceNames) => {
  if(showInterfaceNames && service.interfaceNames.length) {
    return service.interfaceNames;
  }
  return [service.name];
};

export const removeXmlns = (xml) => {
  const $ = cheerio.load(xml, { xmlMode: true });
  $('*').each((i, elem) => {
    Object.keys(elem.attribs).forEach(key => {
      if(key.startsWith('xmlns')) {
        delete elem.attribs[key];
      }
    });
  });
  return $.xml();
};

export const getSoapBodyContents = (xml) => {
  const $ = cheerio.load(xml, { xmlMode: true });
  // Match Body regardless of the envelope's namespace prefix (SOAP:, soapenv:, s:, ...)
  const body = $('*').filter((i, elem) => elem.name.split(':').pop() === 'Body').first();
  return $.xml(body.children().first());
};

const INDENT = '  ';

const localName = (elem) => elem.name.split(':').pop();

const childElements = (elem) => elem.children.filter((child) => child.type === 'tag');

// All the text inside an element, including CDATA sections
const getText = (elem) => elem.children.map((child) => {
  if(child.type === 'text') return child.data;
  return child.children ? getText(child) : '';
}).join('');

// Trims the blank lines around text, and a single line's spaces
const cleanText = (text) => {
  const trimmed = text.replace(/\r\n?/g, '\n').replace(/^\s*\n/, '').trimEnd();
  return trimmed.includes('\n') ? trimmed : trimmed.trim();
};

// A "name: value" line. A value with several lines goes below it, each marked with a |
const addEntry = (lines, depth, name, value = '') => {
  const indent = INDENT.repeat(depth);
  if(!value.includes('\n')) {
    lines.push(`${indent}${name}:${value ? ` ${value}` : ''}`);
    return;
  }
  lines.push(`${indent}${name}:`);
  value.split('\n').forEach((line) => {
    lines.push(`${indent}${INDENT}|${line.trim() ? ` ${line.trimEnd()}` : ''}`);
  });
};

const addAttributes = (lines, depth, elem) => {
  Object.keys(elem.attribs)
    // Namespace declarations and xsi:type only describe the XML itself
    .filter((name) => !name.startsWith('xmlns') && !name.startsWith('xsi:'))
    .forEach((name) => {
      addEntry(lines, depth, `@${name.split(':').pop()}`, cleanText(elem.attribs[name]));
    });
};

// The child that names a form item in place of its tag, as in
// <Item><ItemDescription>EMAIL</ItemDescription><Value><ValueInString>...</ValueInString></Value></Item>
// or <Item><Name>DISPOSITION_TYPE</Name><Value>LOC</Value></Item>
const getItemLabel = (children) => {
  const names = children.map(localName);
  let label;
  if(names.includes('ItemDescription')) {
    label = children[names.indexOf('ItemDescription')];
  } else if(names.length === 2 && names.includes('Name') && names.includes('Value')) {
    label = children[names.indexOf('Name')];
  }
  if(label && !childElements(label).length && getText(label).trim()) {
    return label;
  }
  return null;
};

// A Value's text, held directly or in one typed element such as ValueInString.
// Null when it holds more than that, so it's shown in full instead.
const getValueText = (value) => {
  const children = childElements(value);
  if(!children.length) return cleanText(getText(value));
  if(children.length === 1 && !childElements(children[0]).length) return cleanText(getText(children[0]));
  return null;
};

const isSimpleValue = (elem) => localName(elem) === 'Value' && getValueText(elem) !== null;

const addElement = (lines, depth, elem) => {
  const children = childElements(elem);
  const label = getItemLabel(children);
  if(label) {
    addItem(lines, depth, elem, children, label);
    return;
  }
  addEntry(lines, depth, localName(elem), children.length ? '' : cleanText(getText(elem)));
  addAttributes(lines, depth + 1, elem);
  children.forEach((child) => addElement(lines, depth + 1, child));
};

// A form item as "label: value", with the items in its ItemList nested below it
const addItem = (lines, depth, elem, children, label) => {
  const name = getText(label).trim().replace(/\s+/g, ' ');
  const values = [];
  const nested = [];
  children.filter((child) => child !== label).forEach((child) => {
    const childName = localName(child);
    const listed = childName === 'ValueList' ? childElements(child) : [child];
    if((childName === 'Value' || childName === 'ValueList') && listed.every(isSimpleValue)) {
      values.push(...listed.map(getValueText));
    } else if(childName === 'ItemList') {
      nested.push(...childElements(child));
    } else {
      nested.push(child);
    }
  });
  // Each of several values gets its own line, like repeated XML elements would
  (values.length ? values : ['']).forEach((value) => addEntry(lines, depth, name, value));
  addAttributes(lines, depth + 1, elem);
  nested.forEach((child) => addElement(lines, depth + 1, child));
};

// XML as indented "name: value" lines, without namespaces, and with form items
// listed by their descriptions
export const toReadable = (xml) => {
  const $ = cheerio.load(xml, { xmlMode: true });
  const lines = [];
  $.root().children().each((i, elem) => addElement(lines, 0, elem));
  // Anything that isn't XML, like a plain text error, is shown as it is
  return lines.length ? lines.join('\n') : xml;
};

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Every place query appears in text, ignoring case, as the row and columns
// Ace would give it. Lines are split the same way Ace splits them.
export const findMatches = (text, query) => {
  if(!text || !query) return [];
  const pattern = new RegExp(escapeRegExp(query), 'gi');
  const matches = [];
  text.split(/\r\n|\r|\n/).forEach((line, row) => {
    let match;
    while((match = pattern.exec(line))) {
      matches.push({ row, start: match.index, end: match.index + match[0].length });
    }
  });
  return matches;
};
