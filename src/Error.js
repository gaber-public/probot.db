class ProError extends Error {
  constructor(args) {
    super(args);
    this.name = 'ProBotDB Error';
  }
}

module.exports = ProError;