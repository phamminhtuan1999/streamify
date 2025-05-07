import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { upsertStreamUser } from "../lib/stream.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currUserId = req.user._id;
    const currUserFriends = req.user.friends;

    const getRecommendedUsers = await User.find({
      $and: {
        _id: { $ne: currUserId },
        $id: { $nin: currUserFriends },
        isOnboarded: true,
      },
    })
      .select("-password")
      .limit(10);

    if (!getRecommendedUsers) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json({ success: true, data: getRecommendedUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    // const currUserFriends = req.user.friends;

    // const getMyFriends = await User.find({
    //   _id: { $in: currUserFriends },
    // })
    //   .select("-password")
    //   .limit(10);

    const currUserId = req.user._id;
    const getMyFriends = await User.findById(currUserId)
      .select("friends")
      .populate(
        "friends",
        "fullName avatar nativeLanguage learningLanguage -password"
      )
      .limit(10);

    if (!getMyFriends) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json({ success: true, data: getMyFriends });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }

  //   res.send("Login Route");
}
