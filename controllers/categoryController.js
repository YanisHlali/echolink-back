const pool = require("../config/db");

exports.createCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const [existingCategory] = await pool.query("SELECT * FROM categories WHERE name = ?", [name]);
    if (existingCategory.length > 0) {
      return res.status(400).json({ message: "Category already exists" });
    }

    await pool.query("INSERT INTO categories (name) VALUES (?)", [name]);
    res.status(201).json({ message: "Category created successfully" });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const [categories] = await pool.query("SELECT * FROM categories");
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const [categories] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);
    if (categories.length === 0) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(categories[0]);
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const [result] = await pool.query("UPDATE categories SET name = ? WHERE id = ?", [name, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ message: "Server error" });
  }
};
