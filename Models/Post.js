var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const Post = mongoose.model(
  "Post",
  new mongoose.Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      title: String,
      link: String,
      upVote: [
        {
          username: String,
        },
      ],
      description: String,
      createdAt: Date,
      updatedAt: Date,
      comments: [
        {
          username: String,
          content: String,
          createdAt: Date,
        },
      ],
    },
    {
      timestamps: true,
    }
  )
);

module.exports = Post;
