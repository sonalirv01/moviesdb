const db = require("../models");
const Genre = db.genres;

/**
 * GET /genres
 * Retrieve all genres with optional search query.
 */
exports.findAllGenres = async (req, res) => {
  try {
    const { search } = req.query;
    const condition = search
      ? { genre: { $regex: new RegExp(search, 'i') } }
      : {};

    const genres = await Genre.find(condition);
    res.json({ genres });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving genres",
      error: err.message
    });
  }
};

/**
 * POST /genres
 * Create a new genre.
 */
exports.create = async (req, res) => {
  try {
    const { genre, genreid } = req.body;

    // Validation
    if (!genre) {
      return res.status(400).json({ message: "Genre name is required" });
    }
    if (!genreid) {
      return res.status(400).json({ message: "Genre ID is required" });
    }

    const newGenre = new Genre({ genreid, genre });
    const savedGenre = await newGenre.save();

    res.status(201).json({
      message: "Genre created successfully",
      genre: savedGenre
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating genre",
      error: err.message
    });
  }
};

/**
 * GET /genres/:id
 * Retrieve a single genre by its genreid.
 */
exports.findOne = async (req, res) => {
  try {
    const genreId = parseInt(req.params.id, 10);

    if (isNaN(genreId)) {
      return res.status(400).json({ message: "Invalid genre ID format" });
    }

    const genre = await Genre.findOne({ genreid: genreId });

    if (!genre) {
      return res.status(404).json({ message: `Genre not found with id ${req.params.id}` });
    }

    res.json({ genre });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving genre",
      error: err.message
    });
  }
};

/**
 * PUT /genres/:id
 * Update a genre by its genreid.
 */
exports.update = async (req, res) => {
  try {
    const genreId = parseInt(req.params.id, 10);

    if (isNaN(genreId)) {
      return res.status(400).json({ message: "Invalid genre ID format" });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Update data cannot be empty" });
    }

    const updatedGenre = await Genre.findOneAndUpdate(
      { genreid: genreId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedGenre) {
      return res.status(404).json({
        message: `Cannot update Genre with id=${req.params.id}. Genre not found.`
      });
    }

    res.json({
      message: "Genre updated successfully",
      genre: updatedGenre
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating genre",
      error: err.message
    });
  }
};

/**
 * DELETE /genres/:id
 * Delete a genre by its genreid.
 */
exports.delete = async (req, res) => {
  try {
    const genreId = parseInt(req.params.id, 10);

    if (isNaN(genreId)) {
      return res.status(400).json({ message: "Invalid genre ID format" });
    }

    const deletedGenre = await Genre.findOneAndRemove({ genreid: genreId });

    if (!deletedGenre) {
      return res.status(404).json({
        message: `Cannot delete Genre with id=${req.params.id}. Genre not found.`
      });
    }

    res.json({
      message: "Genre deleted successfully",
      genre: deletedGenre
    });
  } catch (err) {
    res.status(500).json({
      message: "Could not delete genre",
      error: err.message
    });
  }
};
