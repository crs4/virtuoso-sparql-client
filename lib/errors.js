class ResponseFormatError extends Error {
  constructor(format){
    super(`The '${format}' response format is unacceptable for insert query`);
    this.format = format;
    this.name = 'ResponseFormatError';
  }
  inCatchMessage(){
    return `
    WARNING -> ResponseFormatError caught: "${this.message}"
    System set the query format to 'application/json'
  `;
  }
}
class EmptyGraphError extends Error {
  constructor(){
    super(`Graph name is empty.\nUse the methods 'setDefaultGraph()' or 'setQueryGraph()' to set it`);
    this.name = 'EmptyGraphError';
  }
}

module.exports = {
  ResponseFormatError,
  EmptyGraphError
}
