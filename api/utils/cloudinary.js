const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'dkfaglomz', 
  api_key: '624314576263951', 
  api_secret: 'BOIKewUQLMD6ao4cqKCZ1fdYPR8' 
});
module.exports = cloudinary;