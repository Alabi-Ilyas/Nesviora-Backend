const mongoose = require('mongoose');
const toJSON = require('../utils/toJSON');

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    country: { type: String, default: '', trim: true, maxlength: 60 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    date: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

testimonialSchema.plugin(toJSON);

module.exports = mongoose.model('Testimonial', testimonialSchema);
