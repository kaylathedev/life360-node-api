const assert = require('chai').assert;
const life360 = require('../index.js');

let credentials;
try {
  credentials = require('./credentials.js');
} catch (e) {
  if (e.constructor === Error && e.code === 'MODULE_NOT_FOUND') {
    console.error('IMPORTANT');
    console.error('Copy the "credentials-example.json" file and rename it to "credentials.json" before running any tests.');
    console.error('Make sure you add your email or phone, and password to the credentials.js file!');
    return;
  } else {
    throw e;
  }
}

(async () => {

  try {
    await life360.login(credentials);
    var circles = await life360.circles();
    debugger;
  } catch (e) {
    debugger;
  }

})();