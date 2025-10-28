import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"

const toggleVideoLike = async (req, res) => {
    try {
        const {videoId} = req.params
        
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID!")
        }

        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404, "Video not found!")
        }

        const existingLike = await Like.findOne({
            video: videoId,
            likedBy: req.user._id
        })

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id)
            return res.status(200).json(
                new ApiResponse(200, { isLiked: false }, "Video like removed successfully")
            )
        }

        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        const createdLike = await Like.findById(like._id).populate("likedBy", "fullName userName avatar")

        return res.status(200).json(
            new ApiResponse(200, createdLike, "Video liked successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to toggle video like!")
    }
}

const toggleCommentLike = async (req, res) => {
    try {
        const {commentId} = req.params
        
        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, "Invalid comment ID!")
        }

        const comment = await Comment.findById(commentId)
        if (!comment) {
            throw new ApiError(404, "Comment not found!")
        }

        const existingLike = await Like.findOne({
            comment: commentId,
            likedBy: req.user._id
        })

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id)
            return res.status(200).json(
                new ApiResponse(200, { isLiked: false }, "Comment like removed successfully")
            )
        }

        const like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })

        const createdLike = await Like.findById(like._id).populate("likedBy", "fullName userName avatar")

        return res.status(200).json(
            new ApiResponse(200, createdLike, "Comment liked successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to toggle comment like!")
    }
}

const toggleTweetLike = async (req, res) => {
    try {
        const {tweetId} = req.params
        
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweet ID!")
        }

        const tweet = await Tweet.findById(tweetId)
        if (!tweet) {
            throw new ApiError(404, "Tweet not found!")
        }

        const existingLike = await Like.findOne({
            tweet: tweetId,
            likedBy: req.user._id
        })

        if (existingLike) {
            await Like.findByIdAndDelete(existingLike._id)
            return res.status(200).json(
                new ApiResponse(200, { isLiked: false }, "Tweet like removed successfully")
            )
        }

        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        const createdLike = await Like.findById(like._id).populate("likedBy", "fullName userName avatar")

        return res.status(200).json(
            new ApiResponse(200, createdLike, "Tweet liked successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to toggle tweet like!")
    }
}

const getLikedVideos = async (req, res) => {
    try {
        const likes = await Like.find({ 
            likedBy: req.user._id,
            video: { $exists: true }
        }).populate("video")
            .populate("likedBy", "fullName userName avatar")
            .sort({ createdAt: -1 })

        const videos = likes.map(like => like.video).filter(Boolean)

        return res.status(200).json(
            new ApiResponse(200, videos, "Liked videos fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch liked videos!")
    }
}

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}