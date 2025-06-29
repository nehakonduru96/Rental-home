const mongoose = require('mongoose')More actions

const propertyModel = mongoose.Schema({
   ownerId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
   },
   propertyType:{
      type:String,
      required:[true,'Please provide a Property Type'],
      enum: ['house', 'duplex', 'flat']
   },
   bhkType:{
      type: String,
      enum: ['1BHK', '2BHK', '3BHK'],
      required: function() {
         return this.propertyType === 'flat';
      }
   },
   propertyAdType:{
      type: String,
      required:[true,'Please provide a Property Ad Type']
   },
   propertyAddress:{
      type: String,
      required:[true,"Please Provide an Address"]
   },
   ownerContact:{
      type: Number,
      required: [true, 'Please provide owner contact']
   },
   propertyAmt:{
      type :Number ,
      default: 0,
   },
   propertyImage: {
      type: Object
   },
   additionalInfo:{
      type: String,
   },
   ownerName: {
      type: String,
   }
},{
   strict: false,
})

const propertySchema = mongoose.model('propertyschema', propertyModel)

module.exports = propertySchema
