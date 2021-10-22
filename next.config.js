const withTM = require('next-transpile-modules')(['@ledgerhq/react-ui']); // pass the modules you would like to see transpiled
const { i18n } = require('./next-i18next.config');

module.exports = withTM({ i18n });
