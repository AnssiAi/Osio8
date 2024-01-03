const mongoose = require('mongoose')

//Poistettu käytöstä koska ei ole yhteensopiva mongoose 8.0 kanssa
//const uniqueValidator = require('mongoose-unique-validator')

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 4,
  },
  born: {
    type: Number,
  },
})

//schema.plugin(uniqueValidator)

module.exports = mongoose.model('Author', schema)
