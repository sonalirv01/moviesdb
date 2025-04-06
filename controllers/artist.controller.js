const db = require("../models");
const Artist = db.artists;

// Find all Artists
exports.findAllArtists = async (req, res) => {
  const { search, name } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const skip = (page - 1) * limit;

  const condition = {};

  if (search) {
    condition.$or = [
      { first_name: { $regex: new RegExp(search, 'i') } },
      { last_name: { $regex: new RegExp(search, 'i') } }
    ];
  }

  if (name) {
    const [firstName, lastName] = name.trim().split(' ');
    if (firstName) condition.first_name = { $regex: new RegExp(firstName, 'i') };
    if (lastName) condition.last_name = { $regex: new RegExp(lastName, 'i') };
  }

  try {
    const [artists, total] = await Promise.all([
      Artist.find(condition).skip(skip).limit(limit),
      Artist.countDocuments(condition)
    ]);

    res.json(artists);
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving artists",
      error: err.message
    });
  }
};

// Create a new Artist
exports.create = async (req, res) => {
  const { first_name, last_name, artistid } = req.body;

  if (!first_name) {
    return res.status(400).json({ message: "First name is required" });
  }
  if (!last_name) {
    return res.status(400).json({ message: "Last name is required" });
  }
  if (!artistid) {
    return res.status(400).json({ message: "Artist ID is required" });
  }

  const newArtist = new Artist({
    artistid,
    first_name,
    last_name,
    wiki_url: req.body.wiki_url || '',
    profile_url: req.body.profile_url || '',
    movies: Array.isArray(req.body.movies) ? req.body.movies : []
  });

  try {
    const savedArtist = await newArtist.save();
    res.status(201).json({
      message: "Artist created successfully",
      artist: savedArtist
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating artist",
      error: err.message
    });
  }
};

// Find a single Artist by Id
exports.findOne = async (req, res) => {
  const artistId = parseInt(req.params.id, 10);

  if (isNaN(artistId)) {
    return res.status(400).json({ message: "Invalid artist ID format" });
  }

  try {
    const artist = await Artist.findOne({ artistid: artistId });
    if (!artist) {
      return res.status(404).json({
        message: `Artist not found with id ${artistId}`
      });
    }

    res.json({ artist });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving artist",
      error: err.message
    });
  }
};

// Update an Artist by Id
exports.update = async (req, res) => {
  const artistId = parseInt(req.params.id, 10);

  if (isNaN(artistId)) {
    return res.status(400).json({ message: "Invalid artist ID format" });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Update data cannot be empty" });
  }

  if (req.body.movies && !Array.isArray(req.body.movies)) {
    req.body.movies = [];
  }

  try {
    const updatedArtist = await Artist.findOneAndUpdate(
      { artistid: artistId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedArtist) {
      return res.status(404).json({
        message: `Cannot update Artist with id=${artistId}. Artist not found.`
      });
    }

    res.json({
      message: "Artist updated successfully",
      artist: updatedArtist
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating artist",
      error: err.message
    });
  }
};

// Delete an Artist by Id
exports.delete = async (req, res) => {
  const artistId = parseInt(req.params.id, 10);

  if (isNaN(artistId)) {
    return res.status(400).json({ message: "Invalid artist ID format" });
  }

  try {
    const deletedArtist = await Artist.findOneAndRemove({ artistid: artistId });

    if (!deletedArtist) {
      return res.status(404).json({
        message: `Cannot delete Artist with id=${artistId}. Artist not found.`
      });
    }

    res.json({
      message: "Artist deleted successfully",
      artist: deletedArtist
    });
  } catch (err) {
    res.status(500).json({
      message: "Could not delete artist",
      error: err.message
    });
  }
};
