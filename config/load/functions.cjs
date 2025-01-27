const { randomUUID } = require('node:crypto');

function uuid(ctx, ee, next) {
  ctx.vars['uuid'] = randomUUID();

  return next();
}

module.exports = {
  uuid,
};
