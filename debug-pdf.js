const pdf = require('pdf-parse');
console.log('Keys of pdf-parse module:', Object.keys(pdf));
console.log('Type of pdf:', typeof pdf);
if (typeof pdf === 'function') {
    console.log('pdf is a function');
} else if (pdf.default && typeof pdf.default === 'function') {
    console.log('pdf.default is a function');
}
