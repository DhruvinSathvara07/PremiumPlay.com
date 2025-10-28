import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {Like} from "../models/like.model.js"


const getAllVideos = async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
        
        const pageNumber = parseInt(page)
        const limitNumber = parseInt(limit)
        const skip = (pageNumber - 1) * limitNumber

        const aggregationPipeline = [
            { $match: { isPublished: true } },
            { $sort: { createdAt: -1 } }
        ]

        if (query) {
            aggregationPipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: query, $options: "i" } },
                        { description: { $regex: query, $options: "i" } }
                    ]
                }
            })
        }

        if (userId && isValidObjectId(userId)) {
            aggregationPipeline.push({
                $match: { owner: new mongoose.Types.ObjectId(userId) }
            })
        }

        const sortOptions = {}
        if (sortBy) {
            sortOptions[sortBy] = sortType === "desc" ? -1 : 1
            aggregationPipeline.push({ $sort: sortOptions })
        }

        aggregationPipeline.push(
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
            { $skip: skip },
            { $limit: limitNumber }
        )

        const videos = await Video.aggregate(aggregationPipeline)
        const totalVideos = await Video.countDocuments({ isPublished: true })

        return res.status(200).json(
            new ApiResponse(200, {
                videos,
                totalVideos,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalVideos / limitNumber)
            }, "Videos fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch videos!")
    }
}

const publishAVideo = async (req, res) => {
    try {
        const { title, description } = req.body
        
        if (!title || !description) {
            throw new ApiError(400, "Title and description are required!")
        }

        const videoFile = req.files?.videoFile?.[0]?.path
        const thumbnail = req.files?.thumbnail?.[0]?.path

        if (!videoFile) {
            throw new ApiError(400, "Video file is required!")
        }

        if (!thumbnail) {
            throw new ApiError(400, "Thumbnail is required!")
        }

        const videoResponse = await uploadOnCloudinary(videoFile)
        const thumbnailResponse = await uploadOnCloudinary(thumbnail)

        if (!videoResponse?.url || !thumbnailResponse?.url) {
            throw new ApiError(400, "Failed to upload video or thumbnail!")
        }

        const video = await Video.create({
            videoFile: videoResponse.url,
            thumbnail: thumbnailResponse.url,
            title,
            description,
            duration: videoResponse.duration || videoResponse.video?.duration || 0,
            owner: req.user._id
        })

        const createdVideo = await Video.findById(video._id).populate("owner", "fullName userName avatar")

        return res.status(201).json(
            new ApiResponse(201, createdVideo, "Video published successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to publish video!")
    }
}

const getVideoById = async (req, res) => {
    try {
        const { videoId } = req.params
        
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID!")
        }

        const video = await Video.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
            { $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { fullName: 1, userName: 1, avatar: 1 } }
                ]
            }},
            { $addFields: { owner: { $first: "$owner" } } }
        ])

        if (!video?.length) {
            throw new ApiError(404, "Video not found!")
        }

        await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } })

        return res.status(200).json(
            new ApiResponse(200, video[0], "Video fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch video!")
    }
}

const updateVideo = async (req, res) => {
    try {
        const { videoId } = req.params
        const { title, description } = req.body

        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID!")
        }

        const video = await Video.findById(videoId)

        if (!video) {
            throw new ApiError(404, "Video not found!")
        }

        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to update this video!")
        }

        const updateData = {}

        if (title) updateData.title = title
        if (description) updateData.description = description

        const thumbnail = req.file?.path

        if (thumbnail) {
            const thumbnailResponse = await uploadOnCloudinary(thumbnail)
            
            if (video.thumbnail) {
                await deleteFromCloudinary(video.thumbnail)
            }

            updateData.thumbnail = thumbnailResponse?.url || video.thumbnail
        }

        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            { $set: updateData },
            { new: true }
        ).populate("owner", "fullName userName avatar")

        return res.status(200).json(
            new ApiResponse(200, updatedVideo, "Video updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to update video!")
    }
}

const deleteVideo = async (req, res) => {
    try {
        const { videoId } = req.params
        
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID!")
        }

        const video = await Video.findById(videoId)

        if (!video) {
            throw new ApiError(404, "Video not found!")
        }

        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to delete this video!")
        }

        await deleteFromCloudinary(video.videoFile)
        await deleteFromCloudinary(video.thumbnail)
        await Like.deleteMany({ video: videoId })
        
        await Video.findByIdAndDelete(videoId)

        return res.status(200).json(
            new ApiResponse(200, {}, "Video deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to delete video!")
    }
}

const togglePublishStatus = async (req, res) => {
    try {
        const { videoId } = req.params
        
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid video ID!")
        }

        const video = await Video.findById(videoId)

        if (!video) {
            throw new ApiError(404, "Video not found!")
        }

        if (video.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You don't have permission to toggle this video!")
        }

        video.isPublished = !video.isPublished
        await video.save()

        return res.status(200).json(
            new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`)
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to toggle publish status!")
    }
}

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}