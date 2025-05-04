import { StreamChat } from "stream-chat";
import "dotenv/config";

const api_key = process.env.STREAM_API_KEY;
const api_secret = process.env.STREAM_API_SECRET;

if (!api_key || !api_secret) {
  throw new Error("Missing Stream API key or secret");
}

const serverClient = StreamChat.getInstance(api_key, api_secret);
export const upsertStreamUser = async (user) => {
  try {
    await serverClient.upsertUsers([user]);
    return user;
  } catch (error) {
    console.error("Error upsert user:", error);
    throw error;
  }
};

export const deleteStreamUser = async (userId) => {
  try {
    await serverClient.deleteUser(userId);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getStreamToken = (userId) => {
  return serverClient.createToken(userId);
};
