
const express = require("express");
const mongoose = require("mongoose");
const Recipe = require("../models/Recipe");

const router = express.Router();

// GET: Get all recipes
router.get("/", async (req, res) => {
  try {
    const recipes = await Recipe.find().sort({ createdAt: -1 });
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Get a single recipe by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid recipe ID" });
    }

    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.status(200).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST: Create a new recipe
router.post("/", async (req, res) => {
  try {
    const { name, category, ingredients, steps, cookingTime } = req.body;

    const recipe = await Recipe.create({
      name,
      category,
      ingredients,
      steps,
      cookingTime: Number(cookingTime),
    });

    res.status(201).json({
      message: "Recipe created successfully!",
      recipe,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create recipe",
      error: error.message,
    });
  }
});

// PUT: Update an existing recipe
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid recipe ID" });
    }

    const { name, category, ingredients, steps, cookingTime } = req.body;

    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        ingredients,
        steps,
        cookingTime: Number(cookingTime),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.status(200).json({
      message: "Recipe updated successfully!",
      recipe,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update recipe",
      error: error.message,
    });
  }
});

// DELETE: Delete a recipe
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid recipe ID" });
    }

    const recipe = await Recipe.findByIdAndDelete(req.params.id);

    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    res.status(200).json({
      message: "Recipe deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
