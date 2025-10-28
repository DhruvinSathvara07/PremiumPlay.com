import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        console.log(" Uploading to Cloudinary:", localFilePath);
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        fs.unlinkSync(localFilePath);
        console.log("Upload successful:", result.secure_url);
        return result;
    } catch (error) {
        console.error("Cloudinary upload failed:", error.message);
        return null;
    }
};

const deleteFromCloudinary = async (url) => {
    try {
        if (!url) return null;
        
        // Extract public_id from Cloudinary URL
        const publicId = url.match(/upload\/(?:v\d+\/)?(.+?)(?:\..+)?$/)?.[1];
        
        if (!publicId) {
            console.error("Could not extract public_id from URL:", url);
            return null;
        }
        
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto"
        });
        
        console.log("Delete successful:", result);
        return result;
    } catch (error) {
        console.error("Cloudinary delete failed:", error.message);
        return null;
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
