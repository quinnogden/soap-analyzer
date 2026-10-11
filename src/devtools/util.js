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
