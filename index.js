const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./Models/User.js");
const Post = require("./Models/Post.js");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
const app = express();
const PORT = 5050;

//Database connection
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/hackernews");
  console.log("MongoDB connected");
})();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

//routes

//api to get all posts
app.get("/", async (req, res) => {
  try {
    let data = await Post.find({});
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
});

//api to get specific post
app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id);
    return res.status(200).json(post);
  } catch (error) {
    return res.status(404).json({ error: "ID not found" });
  }
});

//api to post a comment and upvote
app.post("/post/:id", async (req, res) => {
  const token = req.body.token;
  let flag = false;
  if (token) {
    flag = jwt.verify(token, process.env.JWT_SECRET);
  }
  if (flag) {
    if (req.body.requestFor === "comment") {
      const { id } = req.params;
      const commentObject = {
        content: req.body.comment,
        username: req.body.username,
        date: new Date(),
      };
      try {
        const post = await Post.findById(id);
        post.comments.push(commentObject);
        const returningPost = await post.save();
        return res.status(200).json(returningPost);
      } catch (error) {
        return res
          .status(500)
          .json({ error: "Comment can not be added this time." });
      }
    }
    if (req.body.requestFor === "upvote") {
      const { id } = req.params;
      const upVote = {
        username: req.body.username,
      };
      try {
        const post = await Post.findById(id);
        for (let i = 0; i < post.upVote.length; i++) {
          if (post.upVote[i].username === upVote.username) {
            return res
              .status(500)
              .json({ error: "Upvote can not be added twice." });
          }
        }
        post.upVote.push(upVote);
        const returningPost = await post.save();
        return res.status(200).json(returningPost);
      } catch (error) {
        return res.status(500).json({ error: "Can not upvote this time." });
      }
    }
  } else {
    return res.status(500).json({ error: "Unauthorized user request" });
  }
});

//api to create a new post
app.post("/addpost", async (req, res) => {
  const token = req.body.token;
  let flag = false;
  if (token) {
    flag = jwt.verify(token, process.env.JWT_SECRET);
  }
  if (flag) {
    try {
      const newPost = new Post({ ...req.body });
      const insertPost = await newPost.save();
      return res.status(201).json(insertPost);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Post can not be created at this time." });
    }
  } else {
    return res.status(500).json({ error: "Unauthorized user request" });
  }
});

//api to update a post
app.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id };
    const update = req.body;
    await Post.findOneAndUpdate(filter, update);
    const updatePost = await Post.findById(id);
    return res.status(200).json(updatePost);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Post can not be updated at this time." });
  }
});

//api to fetch post of specific user
app.get("/profile/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.find({ user: id });
    return res.status(200).json(post);
  } catch (error) {
    return res.status(404).json({ error: "user id not found" });
  }
});

// Handling user signup
const signUp = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "Please Provide Required Information",
    });
  }

  const hash_password = await bcrypt.hash(password, 10);

  const userData = {
    email,
    hash_password,
  };

  const user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({
      message: "User already registered",
    });
  } else {
    User.create(userData).then((data, err) => {
      if (err) res.status(400).json({ err });
      else res.status(200).json({ message: "User created Successfully" });
    });
  }
};

const signIn = async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      res.status(400).json({
        message: "Please enter email and password",
      });
    }

    const user = await User.findOne({ email: req.body.email });
    const authenticated = await user.authenticate(req.body.password);

    if (user) {
      if (authenticated) {
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "30d",
        });
        const { _id, email } = user;
        res.status(200).json({
          token,
          user: { _id, email },
        });
      } else {
        res.status(400).json({
          message: "Something went wrong!",
        });
      }
    } else {
      res.status(404).json({
        message: "User does not exist..!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
};

app.post("/signup", signUp);
app.post("/login", signIn);

// function isLoggedIn(req, res, next) {
//   if (req.isAuthenticated()) return next();
//   res.redirect("/login");
// }

// Showing secret page
// app.get("/secret", isLoggedIn, function (req, res) {
//   res.render("secret");
// });

// start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
