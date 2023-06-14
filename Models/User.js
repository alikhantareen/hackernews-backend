var mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = new mongoose.Schema(
  {
    email: String,
    hash_password: String,
  },
  {
    timestamps: true,
  }
);

// const User = mongoose.model(
//     'User',
//     new mongoose.Schema(
//         {
//           email: String,
//           password: String
//         },
//         {
//           timestamps: true,
//         }
//       )
// )

User.method({
  async authenticate(password) {
    const passmatch = await bcrypt.compare(password, this.hash_password);
    return passmatch;
  },
});

// User.plugin(passportLocalMongoose);

// module.exports = User;

module.exports = mongoose.model("User", User);
