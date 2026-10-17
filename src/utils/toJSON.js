// Shared JSON shape: _id -> id, hide internals, and <name>Cents -> <name> in dollars.
module.exports = (schema) => {
  schema.set('toJSON', {
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.password;
      delete ret.tokenVersion;
      for (const key of Object.keys(ret)) {
        if (key.endsWith('Cents') && typeof ret[key] === 'number') {
          ret[key.slice(0, -5)] = ret[key] / 100;
          delete ret[key];
        }
      }
      return ret;
    },
  });
};
