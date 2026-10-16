// Shared JSON shape: _id -> id, hide internals.
module.exports = (schema) => {
  schema.set('toJSON', {
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.password;
      delete ret.tokenVersion;
      return ret;
    },
  });
};
