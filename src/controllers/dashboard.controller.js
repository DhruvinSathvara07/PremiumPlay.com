import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"

const getChannelStats = async (req, res) => {
    try {
        const userId = req.user._id

        const totalVideos = await Video.countDocuments({ owner: userId })
        const totalSubscribers = await Subscription.countDocuments({ channel: userId })
        const totalViews = await Video.aggregate([
            { $match: { owner: userId } },
            { $group: { _id: null, total: { $sum: "$views" } } }
        ])

        const videos = await Video.find({ owner: userId })
        const videoIds = videos.map(video => video._id)

        const totalLikes = await Like.countDocuments({
            video: { $in: videoIds }
        })

        const stats = {
            totalVideos: totalVideos || 0,
            totalSubscribers: totalSubscribers || 0,
            totalViews: totalViews[0]?.total || 0,
            totalLikes: totalLikes || 0
        }

        return res.status(200).json(
            new ApiResponse(200, stats, "Channel stats fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch channel stats!")
    }
}

const getChannelVideos = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query
        const userId = req.user._id

        const pageNumber = parseInt(page)
        const limitNumber = parseInt(limit)
        const skip = (pageNumber - 1) * limitNumber

        const sortOptions = {}
        sortOptions[sortBy] = sortType === "desc" ? -1 : 1

        const videos = await Video.find({ owner: userId })
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNumber)
            .populate("owner", "fullName userName avatar")

        const totalVideos = await Video.countDocuments({ owner: userId })

        return res.status(200).json(
            new ApiResponse(200, {
                videos,
                totalVideos,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalVideos / limitNumber)
            }, "Channel videos fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Failed to fetch channel videos!")
    }
}

export {
    getChannelStats, 
    getChannelVideos
    }