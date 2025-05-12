import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

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
    console.error(`Error getting friends: ${error}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const { id: receiverId } = req.params;
    const currUserId = req.user.id;
    // const currUser = await User.findById(currUserId);

    // if (!currUser) {
    //   return res.status(404).json({ message: "User not found" });
    // }

    const friendUser = await User.findById(receiverId);
    if (!friendUser) {
      return res.status(404).json({ message: "Friend not found" });
    }

    if (currUserId === receiverId) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    // Check if the friend request already exists
    if (friendUser.friends.includes(currUserId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // check if the friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: currUserId, receiver: receiverId },
        { sender: receiverId, receiver: currUserId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }
    // Create a new friend request
    const newFriendRequest = await FriendRequest.create({
      sender: currUserId,
      receiver: receiverId,
    });

    res.status(201).json({
      success: true,
      message: "Friend request sent",
      data: newFriendRequest,
    });
  } catch (error) {
    console.error(`Error sending friend request: ${error}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: senderId } = req.params;
    const currUserId = req.user.id;

    // check if senderId is a valid ObjectId
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // check if valid friend request
    const friendRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: currUserId,
    });

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // check if already friends
    if (sender.friends.includes(currUserId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // update friend request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    // add sender to receiver's friends list
    // add receiver to sender's friends list
    // $addToSet ensures that the value is added only if it doesn't already exist
    await User.findByIdAndUpdate(
      currUserId,
      { $addToSet: { friends: senderId } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      senderId,
      { $addToSet: { friends: currUserId } },
      { new: true }
    );
    res.status(200).json({
      success: true,
      message: "Friend request accepted",
      data: friendRequest,
    });
  } catch (error) {
    console.error(`Error accepting friend request: ${error}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const currUserId = req.user.id;

    const comingFriendRequests = await FriendRequest.find({
      receiver: currUserId,
      status: "pending",
    })
      .populate("sender", "fullName avatar nativeLanguage learningLanguage")
      .limit(10);

    const acceptedFriendRequests = await FriendRequest.find({
      sender: currUserId,
      status: "accepted",
    })
      .populate("sender", "fullName avatar nativeLanguage learningLanguage")
      .limit(10);

    const friendRequests = {
      comingFriendRequests,
      acceptedFriendRequests,
    };

    if (!friendRequests) {
      return res.status(404).json({ message: "No friend requests found" });
    }
    res.status(200).json({ success: true, data: friendRequests });
  } catch (error) {
    console.error(`Error getting friend requests: ${error}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOngoingFriendRequests(req, res) {
  try {
    const currUserId = req.user.id;

    const ongoingFriendRequests = await FriendRequest.find({
      sender: currUserId,
      status: "pending",
    }).populate("receiver", "fullName avatar nativeLanguage learningLanguage");

    if (!ongoingFriendRequests) {
      return res
        .status(404)
        .json({ message: "No ongoing friend requests found" });
    }
    res.status(200).json({ success: true, data: ongoingFriendRequests });
  } catch (error) {
    console.error(`Error getting ongoing friend requests: ${error}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
