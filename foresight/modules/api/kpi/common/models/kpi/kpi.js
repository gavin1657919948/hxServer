'use strict'

module.exports = function (KPI) {
  KPI.echo = value => Promise.resolve(value)

  KPI.remoteMethod('echo', {
    accepts: { arg: 'value', type: 'string' },
    returns: { arg: 'result', type: 'string' },
  })
}
