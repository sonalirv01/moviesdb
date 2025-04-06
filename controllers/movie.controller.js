const db = require("../models");
const Movie = db.movies;

// Find all Movies
exports.findAllMovies = async (req, res) => {
  try {
    const { status, title, genres, artists, start_date, end_date } = req.query;
    const condition = {};

    if (status) {
      const statusLower = status.toLowerCase();
      if (statusLower === 'published') condition.published = true;
      else if (statusLower === 'released') condition.released = true;
    }

    if (title) {
      condition.title = { $regex: new RegExp(title, 'i') };
    }

    if (genres) {
      const genreList = genres.split(',').map(g => g.trim()).filter(Boolean);
      if (genreList.length > 0) {
        condition.genres = { $elemMatch: { $in: genreList } };
      }
    }

    if (artists) {
      const artistList = artists.split(',').map(a => a.trim()).filter(Boolean);
      if (artistList.length > 0) {
        condition.artists = { $elemMatch: { $in: artistList } };
      }
    }

    if (start_date || end_date) {
      condition.release_date = {};
      if (start_date) condition.release_date.$gte = start_date;
      if (end_date) condition.release_date.$lte = end_date;
    }

    const movies = await Movie.find(condition);

    res.json({
      movies,
      page: 1,
      limit: movies.length,
      total: movies.length
    });
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving movies",
      error: err.message
    });
  }
};

// Find one movie
exports.findOne = async (req, res) => {
  const movieId = parseInt(req.params.id, 10);
  if (isNaN(movieId)) {
    return res.status(400).json({ message: "Invalid movie ID format" });
  }

  try {
    const movie = await Movie.findOne({ movieid: movieId });
    if (!movie) {
      return res.status(404).json({ message: `Movie not found with id ${movieId}` });
    }

    const safeMovie = {
      ...movie.toObject(),
      genres: Array.isArray(movie.genres) ? movie.genres : [],
      critics_rating: movie.critic_rating ?? 0,
      storyline: movie.story_line || "No storyline available"
    };

    res.json(safeMovie);
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving movie",
      error: err.message
    });
  }
};

// Find shows for a specific movie
exports.findShows = async (req, res) => {
  const movieId = parseInt(req.params.id, 10);
  if (isNaN(movieId)) {
    return res.status(400).json({ message: "Invalid movie ID format" });
  }

  try {
    const movie = await Movie.findOne({ movieid: movieId });
    if (!movie) {
      return res.status(404).json({ message: `Movie not found with id ${movieId}` });
    }

    const shows = (movie.shows || []).map(show => ({
      theatre: {
        city: show.theatre?.city || "Unknown",
        name: show.theatre?.name || "Unknown"
      },
      language: show.language || "Unknown",
      show_timing: show.show_timing || "Unknown",
      unit_price: show.unit_price ?? 0,
      available_seats: parseInt(show.available_seats, 10) || 0
    }));

    res.json(shows);
  } catch (err) {
    res.status(500).json({
      message: "Error retrieving shows",
      error: err.message
    });
  }
};

// Create a new movie
exports.create = async (req, res) => {
  const { title, movieid } = req.body;

  if (!title || !movieid) {
    return res.status(400).json({ message: "Movie title and ID are required" });
  }

  const movie = new Movie({
    movieid,
    title,
    published: req.body.published || false,
    released: req.body.released || false,
    poster_url: req.body.poster_url || '',
    release_date: req.body.release_date || null,
    publish_date: req.body.publish_date || null,
    artists: req.body.artists || [],
    genres: Array.isArray(req.body.genres) ? req.body.genres : [],
    duration: req.body.duration || 0,
    critics_rating: req.body.critic_rating || 0,
    trailer_url: req.body.trailer_url || '',
    wiki_url: req.body.wiki_url || '',
    storyline: req.body.story_line || '',
    shows: req.body.shows || []
  });

  try {
    const savedMovie = await movie.save();
    res.status(201).json({
      message: "Movie created successfully",
      movie: savedMovie
    });
  } catch (err) {
    res.status(500).json({
      message: "Error creating movie",
      error: err.message
    });
  }
};

// Update a movie
exports.update = async (req, res) => {
  const movieId = parseInt(req.params.id, 10);
  if (isNaN(movieId)) {
    return res.status(400).json({ message: "Invalid movie ID format" });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: "Update data cannot be empty" });
  }

  if (req.body.genres && !Array.isArray(req.body.genres)) {
    req.body.genres = [];
  }

  try {
    const updatedMovie = await Movie.findOneAndUpdate(
      { movieid: movieId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({
        message: `Cannot update Movie with id=${movieId}. Movie not found.`
      });
    }

    res.json({
      message: "Movie updated successfully",
      movie: updatedMovie
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating movie",
      error: err.message
    });
  }
};

// Delete a movie
exports.delete = async (req, res) => {
  const movieId = parseInt(req.params.id, 10);
  if (isNaN(movieId)) {
    return res.status(400).json({ message: "Invalid movie ID format" });
  }

  try {
    const deletedMovie = await Movie.findOneAndRemove({ movieid: movieId });
    if (!deletedMovie) {
      return res.status(404).json({
        message: `Cannot delete Movie with id=${movieId}. Movie not found.`
      });
    }

    res.json({
      message: "Movie deleted successfully",
      movie: deletedMovie
    });
  } catch (err) {
    res.status(500).json({
      message: "Could not delete movie",
      error: err.message
    });
  }
};
