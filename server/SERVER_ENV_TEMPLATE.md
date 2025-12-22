# Environment Variables

Create a `.env` file in the `server/` directory with the following keys:

PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/connect-db?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_shhh

# Email (Gmail)
# Use an App Password if 2FA is enabled
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary (Optional for now, required for image sharing)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret


 <!-- Advanced Features
Create Group Chats
 Implement Image Sharing
 Implement Audio Calls (WebRTC)
 Ensure End-to-End Security (Encryption) -->