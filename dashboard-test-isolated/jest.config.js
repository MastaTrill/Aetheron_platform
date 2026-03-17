module.exports = {
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [
    '/node_modules/(?!@exodus/bytes|jsdom|whatwg-encoding|abab|domexception|html-encoding-sniffer)',
  ],
};
