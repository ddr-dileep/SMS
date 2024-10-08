import { Request, Response } from "express";
import blogModel from "../models/blog.models";
import apiResponse from "../utils/api.response";

export const getAllBlogController = async (req: Request, res: Response) => {
  try {
    const blogs = await blogModel.find();
    res
      .status(200)
      .json(
        apiResponse.SUCCESS(
          { count: blogs.length, blogs },
          "Blogs fetched successfully"
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(apiResponse.ERROR("server_error", "something went wrong"));
  }
};

export const getLastestBlogController = async (req: Request, res: Response) => {
  try {
    const blogs = await blogModel.find().sort({ createdAt: -1 }).limit(1);
    res
      .status(200)
      .json(
        apiResponse.SUCCESS(
          { count: blogs.length, blogs },
          "Lastest blog fetched successfully"
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(apiResponse.ERROR("server_error", "something went wrong"));
  }
};

export const createBlogController = async (
  req: Request | any,
  res: Response
) => {
  try {
    const existingBlog = await blogModel.findOne({
      title: req.body.title,
      author: req.user._id,
    });

    if (existingBlog) {
      return res
        .status(400)
        .json(
          apiResponse.ERROR(
            "duplicate_post",
            "Blog with the same title of author already exists"
          )
        );
    }

    const newBlog = new blogModel({ ...req.body, author: req.user._id });
    await newBlog.save();
    await newBlog.populate("author", "_id profilePicture username");

    res
      .status(201)
      .json(
        apiResponse.SUCCESS({ blog: newBlog }, "Blog created successfully")
      );
  } catch (error) {
    res.status(400).json(apiResponse.OTHER(error));
  }
};

export const updateBlogController = async (
  req: Request | any,
  res: Response
) => {
  try {
    const { blogId } = req.params;

    const existingBlog: any = await blogModel.findOne({
      title: req.body.title,
      author: req.user._id,
    });

    if (existingBlog && existingBlog._id.toString() !== blogId) {
      return res
        .status(400)
        .json(
          apiResponse.ERROR(
            "duplicate_post",
            "Blog with the same title of author already exists"
          )
        );
    }

    const updatedBlog = await blogModel.findByIdAndUpdate(blogId, req.body, {
      new: true,
    });

    if (!updatedBlog) {
      return res
        .status(404)
        .json(apiResponse.ERROR("not_found", "Blog not found"));
    }

    await updatedBlog.populate("author", "_id profilePicture username");

    res
      .status(200)
      .json(
        apiResponse.SUCCESS({ blog: updatedBlog }, "Blog updated successfully")
      );
  } catch (error) {
    res.status(400).json(apiResponse.OTHER(error));
  }
};

export const getOneBlogByIdController = async (
  req: Request | any,
  res: Response
) => {
  try {
    const { blogId } = req.params;
    const blog = await blogModel.findById(blogId);

    if (!blog) {
      return res
        .status(404)
        .json(apiResponse.ERROR("not_found", "Blog not found"));
    }

    await blog.populate("author", "_id profilePicture username");

    res
      .status(200)
      .json(apiResponse.SUCCESS({ blog }, "Blog fetched successfully"));
  } catch (error) {
    res.status(400).json(apiResponse.OTHER(error));
  }
};

export const deleteOneBlogByIdController = async (
  req: Request | any,
  res: Response
) => {
  try {
    const { blogId } = req.params;
    const author = req.user._id;

    const blog = await blogModel.findById(blogId);
    if (!blog) {
      return res
        .status(404)
        .json(apiResponse.ERROR("not_found", "Blog not found"));
    }
    if (blog.author.toString() !== author) {
      return res
        .status(403)
        .json(
          apiResponse.ERROR(
            "forbidden",
            "You are not authorized to delete this blog"
          )
        );
    }

    await blog.deleteOne();
    res.status(200).json(apiResponse.SUCCESS({}, "Blog deleted successfully"));
  } catch (error) {
    res.status(400).json(apiResponse.OTHER(error));
  }
};

export const getAllBlogOfAuthorController = async (
  req: Request | any,
  res: Response
) => {
  try {
    const authorId = req.user._id;
    const blogs = await blogModel.find({ author: authorId });

    res
      .status(200)
      .json(
        apiResponse.SUCCESS(
          { count: blogs.length, blogs },
          "Blogs fetched successfully"
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(apiResponse.ERROR("server_error", "something went wrong"));
  }
};

export const searchBlogPostController = async (
  req: Request | any,
  res: Response
) => {
  try {
    const { title, content, tags, author, category } = req.query;

    const filter: any = {};

    if (title) {
      filter.title = { $regex: title, $options: "i" };
    }

    if (content) {
      filter.content = { $regex: content, $options: "i" };
    }

    if (tags) {
      filter.tags = { $in: tags.split(",") };
    }

    if (author) {
      filter.author = author;
    }

    if (category) {
      filter.category = category;
    }

    const blogs = await blogModel
      .find(filter)
      .populate("author", "_id username profilePicture")
      .populate("category", "name")
      .populate("comments", "content author");

    res
      .status(200)
      .json(
        apiResponse.SUCCESS(
          { count: blogs.length, blogs },
          "Search results fetched successfully"
        )
      );
  } catch (error) {
    res
      .status(500)
      .json(apiResponse.ERROR("server_error", "Something went wrong"));
  }
};
