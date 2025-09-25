import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
export const createCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).send({ 
        success: false,
        message: "Category name is required and cannot be empty" 
      });
    }
    
    const trimmedName = name.trim();
    const existingCategory = await categoryModel.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } // Case-insensitive check
    });
    
    if (existingCategory) {
      return res.status(409).send({
        success: false,
        message: "Category already exists",
      });
    }
    
    const category = await new categoryModel({
      name: trimmedName,
      slug: slugify(trimmedName, { lower: true }),
    }).save();
    
    res.status(201).send({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error creating category",
    });
  }
};

//update category
export const updateCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).send({
        success: false,
        message: "Category name is required"
      });
    }
    
    // Check if category exists
    const existingCategory = await categoryModel.findById(id);
    if (!existingCategory) {
      return res.status(404).send({
        success: false,
        message: "Category not found"
      });
    }
    
    const trimmedName = name.trim();
    const category = await categoryModel.findByIdAndUpdate(
      id,
      { name: trimmedName, slug: slugify(trimmedName, { lower: true }) },
      { new: true }
    );
    
    res.status(200).send({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error updating category",
    });
  }
};

// get all cat
export const categoryControlller = async (req, res) => {
  try {
    const category = await categoryModel.find({});
    res.status(200).send({
      success: true,
      message: "All Categories List",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting all categories",
    });
  }
};

// single category
export const singleCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }
    
    res.status(200).send({
      success: true,
      message: "Category retrieved successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error retrieving category",
    });
  }
};

//delete category
export const deleteCategoryController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedCategory = await categoryModel.findByIdAndDelete(id);
    
    if (!deletedCategory) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }
    
    res.status(200).send({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
};
