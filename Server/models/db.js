const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionHistorySchema = new Schema({
    description: String,
    amount: Number},
    {timestamps: true 
});

const UserSchema = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    account_number: {
        type: String,
        required: true

    },

    email: {
         type: String,
         unique: true,
         required: true,
    },
    password: {
         type: String,
         required: true,
    },
      
    phone_number :{
        type: String,
        required:true
    },

    balance :{
        type: Number,
        required:true
    },

    transactionHistory: [TransactionHistorySchema]
           
});
// Method to set salt and hash the password for a user 
UserSchema.methods.setPassword = function(password) { 
     
    // Creating a unique salt for a particular user 
       this.salt = crypto.randomBytes(16).toString('hex'); 
     
       // Hashing user's salt and password with 1000 iterations, 
        
       this.hash = crypto.pbkdf2Sync(password, this.salt,  
       1000, 64, `sha512`).toString(`hex`); 
   }; 
     
   // Method to check the entered password is correct or not 
   UserSchema.methods.validPassword = function(password) { 
       var hash = crypto.pbkdf2Sync(password,  
       this.salt, 1000, 64, `sha512`).toString(`hex`); 
       return this.hash === hash; 
   }; 
     

const Users = mongoose.model("Users", UserSchema);
module.exports = Users;


