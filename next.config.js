const path = require("path");
const withTM = require('next-transpile-modules')(['@ledgerhq/react-ui']); // pass the modules you would like to see transpiled


module.exports = withTM();