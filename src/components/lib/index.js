const hljs = require('./highlight.code');

hljs.registerLanguage('javascript', require('./languages/languages-javascript'));
hljs.registerLanguage('css', require('./languages/languages-css'));
hljs.registerLanguage('xml', require('./languages/languages-xml'));
hljs.registerLanguage('sql', require('./languages/languages-sql'));
hljs.registerLanguage('typescript', require('./languages/languages-typescript'));
hljs.registerLanguage('markdown', require('./languages/languages-markdown'));
hljs.registerLanguage('c++', require('./languages/languages-cpp'));
hljs.registerLanguage('c', require('./languages/languages-c'));

module.exports = hljs;
