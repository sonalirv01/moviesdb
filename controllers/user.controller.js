const db = require("../models");
const User = db.users;
const TokenGenerator = require("uuid-token-generator");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

// Create and Save a new User (Sign Up)
exports.signUp = async (req, res) => {
  const {
    email_address,
    password,
    first_name,
    last_name,
    username,
    mobile_number,
    role,
    coupens,
    bookingRequests,
  } = req.body;

  if (!email_address || !password || !first_name || !last_name) {
    return res.status(400).json({
      message: "Email, password, first name, and last name are required!",
    });
  }

  try {
    const highestUser = await User.findOne().sort({ userid: -1 });
    const nextUserId = highestUser ? highestUser.userid + 1 : 1;

    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const newUser = new User({
      userid: nextUserId,
      email: email_address,
      first_name,
      last_name,
      username: username || `${first_name}${last_name}`.toLowerCase(),
      contact: mobile_number,
      password: hashedPassword,
      role: role || "user",
      isLoggedIn: false,
      uuid: "",
      accesstoken: "",
      coupens: coupens || [],
      bookingRequests: bookingRequests || [],
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ message: err.message || "Error creating the user." });
  }
};

// User Login
exports.login = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Basic ")) {
    return res.status(400).json({ message: "Authentication header is required!" });
  }

  const [username, password] = Buffer.from(authHeader.split(" ")[1], "base64")
    .toString("ascii")
    .split(":");

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required!" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const uuid = uuidv4();
    const token = new TokenGenerator(256, TokenGenerator.BASE62).generate();

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { isLoggedIn: true, uuid, accesstoken: token },
      { new: true }
    );

    res
      .header("access-token", token)
      .json({
        id: updatedUser.uuid,
        username: updatedUser.username,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        isLoggedIn: updatedUser.isLoggedIn,
        "access-token": token,
      });
  } catch (err) {
    res.status(500).json({ message: "Error processing login" });
  }
};

// Logout User
exports.logout = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uuid: req.params.id },
      { isLoggedIn: false, uuid: "", accesstoken: "" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: `User not found with uuid=${req.params.id}` });
    }

    res.json({ message: "User logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error logging out user" });
  }
};

// Get All Users
exports.findAll = async (req, res) => {
  try {
    const users = await User.find();
    res.json({
      users,
      page: 1,
      limit: users.length,
      total: users.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error retrieving users." });
  }
};

// Get Single User by ID, UUID, Username, or MongoDB _id
exports.findOne = async (req, res) => {
  const { id } = req.params;
  const query = {
    $or: [
      ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
      { userid: parseInt(id) || -1 },
      { username: id },
      { uuid: id },
    ],
  };

  try {
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: `User not found with id=${id}` });
    }

    res.json({
      user,
      coupens: user.coupens || [],
      bookingRequests: user.bookingRequests || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving user with id=" + id });
  }
};

// Get User by Token
exports.getUserByToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token is required!" });
  }

  try {
    const user = await User.findOne({ accesstoken: token });

    if (!user) {
      return res.status(404).json({ message: "User not found with provided token" });
    }

    res.json({
      id: user.uuid,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      isLoggedIn: user.isLoggedIn,
    });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving user by token" });
  }
};

// Update User by MongoDB _id
exports.update = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "Data to update cannot be empty!" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: `User not found with id=${req.params.id}` });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Error updating user with id=" + req.params.id });
  }
};

// Delete User by MongoDB _id
exports.delete = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndRemove(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ message: `User not found with id=${req.params.id}` });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Could not delete user with id=" + req.params.id });
  }
};

// Get Coupons for User
exports.getCouponCode = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: `User not found with id=${req.params.id}` });
    }

    if (!user.isLoggedIn) {
      return res.status(401).json({ message: "User must be logged in to get coupons" });
    }

    const coupons = user.coupens || [];
    res.json({
      coupens: coupons,
      page: 1,
      limit: coupons.length,
      total: coupons.length,
    });
  } catch (err) {
    res.status(500).json({ message: "Error retrieving coupons for user with id=" + req.params.id });
  }
};
