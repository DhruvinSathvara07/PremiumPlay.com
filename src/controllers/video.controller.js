import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    }

const publishAVideo = async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    }

const getVideoById = async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    }

const updateVideo = async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    }

const deleteVideo = async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
        }

const togglePublishStatus = async (req, res) => {
    const { videoId } = req.params
    }

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}