const json2html = require('node-json2html');
const fs = require('fs');

/**
 * With the help of: https://gist.github.com/joviano-dias/f9bfb8af690a89bcf7d83213e6009b13
 * and https://www.w3schools.com/html/tryit.asp?filename=tryhtml_table_intro
 */

let template_table_header = {
    '<>': 'tr',
    html: [
        { '<>': 'th', html: 'Name' },
        { '<>': 'th', html: 'Url' },
        { '<>': 'th', html: 'licenseName' },
        { '<>': 'th', html: 'licenseText' },
    ],
};

let template_table_body = {
    '<>': 'tr',
    html: [
        { '<>': 'td', html: '${name}' },
        { '<>': 'td', html: '${url}' },
        { '<>': 'td', html: '${licenseName}' },
        { '<>': 'td', html: '${licenseText}' },
    ],
};

let data = require('./frontend/src/assets/source-code/THIRD-PARTY-LICENSE-ACKNOWLEDGEMENTS.json');

let inspired_by_or_copied_from_data = fs
    .readFileSync('./inspired-by-or-copied-from-list.html')
    .toString();

let inspired_by_or_copied_from =
    `<h1>List of links used for inspiration or copied from or as guidance</h1>
                <a>If you want to know, where these where used search inside the source code for this specific URL <a href="assets/source-code/fuesim-digital.zip">here</a>.</a>
                ` + inspired_by_or_copied_from_data;

let table_header = json2html.render(data[0], template_table_header);
let table_body = json2html.render(data, template_table_body);

let style = `<style>
            table {
                border-collapse: collapse;
                width: 100%;
            }
            th {
                border: 1px solid #dddddd;
            }
            tr:nth-child(even) {
                background: #dddddd;
            }
            tr:nth-child(even) td {
                border: 1px solid white;
            }
            tr:nth-child(odd) td {
                border: 1px solid #dddddd;
            }
            td:last-child {
                white-space:pre-wrap;
            }
        </style>`;

let header =
    '<!DOCTYPE html>' +
    '<html lang="en">\n' +
    '<head><title>Third Party Licenses</title>' +
    style +
    '</head>';
let body =
    '<input type="button" value="Zur&uuml;ck" onclick="history.back()">' +
    inspired_by_or_copied_from +
    '<h1>Third Party Licenses</h1><br><table>\n<thead>' +
    table_header +
    '\n</thead>\n<tbody>\n' +
    table_body +
    '\n</tbody>\n</table>';
body = '<body>' + body + '</body>';
let html = header + body + '</html>\n';

fs.writeFileSync(
    './frontend/src/assets/source-code/THIRD-PARTY-LICENSE-ACKNOWLEDGEMENTS.html',
    html
);
console.log('THIRD-PARTY-LICENSE-ACKNOWLEDGEMENTS.html created');
