import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"

const getVideoComments = async (req, res) => {
    try {
        const {videoId} = req.params
        const {page = 1, limit = 10} = req.query

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID!")
        }

        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404, "Video not found!")
        }

        const comments = await Comment.aggregatePaginate(
            Comment.aggregate([
                { $match: { video: new mongoose.Types.ObjectId(videoId) } },
                { $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        { $project: { fullName: 1, userName: 1, avatar: 1 } }
                    ]
                }},
                { $addFields: { owner: { $first: "$owner" } } },
                { $sort: { createdAt: -1 } }
            ]),
            {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        )

        return res.status(200).json(
            new ApiResponse(200, comments, "Comments fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch comments!")
    }
}

const addComment = async (req, res) => {
    try {
        const {videoId} = req.params
        const {content} = req.body

        if (!content?.trim()) {
            throw new ApiError(400, "Comment content is required!")
        }

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID!")
        }

        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404, "Video not found!")
        }

        const comment = await Comment.create({
            content,
            video: videoId,
            owner: req.user._id
        })

        const createdComment = await Comment.findById(comment._id).populate("owner", "fullName userName avatar")

        return res.status(201).json(
            new ApiResponse(201, createdComment, "Comment added successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to add comment!")
    }
}

const updateComment = async (req, res) => {
    try {
        const {commentId} = req.params
        const {content} = req.body

        if (!content?.trim()) {
            throw new ApiError(400, "Comment content is required!")
        }

        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, "Invalid comment ID!")
        }

        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new ApiError(404, "Comment not found!")
        }

        if (comment.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to update this comment!")
        }

        comment.content = content
        await comment.save()

        const updatedComment = await Comment.findById(comment._id).populate("owner", "fullName userName avatar")

        return res.status(200).json(
            new ApiResponse(200, updatedComment, "Comment updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to update comment!")
    }
}

const deleteComment = async (req, res) => {
    try {
        const {commentId} = req.params

        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, "Invalid comment ID!")
        }

        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new ApiError(404, "Comment not found!")
        }

        if (comment.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to delete this comment!")
        }

        await Comment.findByIdAndDelete(commentId)

        return res.status(200).json(
            new ApiResponse(200, {}, "Comment deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to delete comment!")
    }
}

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }