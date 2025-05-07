import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { upsertStreamUser } from "../lib/stream.js";

export async function signup(req, res) {
  const { fullName, email, password } = req.body;
  // validation
  // check if user already exists
  // hash password
  // create user
  // create token
  // send response with token and user object
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const idx = Math.floor(Math.random() * 1000) + 1;
    const generatedAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const user = await User.create({
      fullName,
      email,
      password,
      avatar: generatedAvatar,
    });

    // TODO: create user for stream as well
    try {
      await upsertStreamUser({
        id: user._id.toString(),
        name: user.fullName,
        image: user.avatar || "",
      });

      console.log(`User created for Stream ${user.fullName}`);
    } catch (error) {
      console.error("Error creating user for Stream:", error);
      return res.status(500).json({ message: "Error when create stream user" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      httpOnly: true, // only accessible via http
      secure: process.env.NODE_ENV === "production", // only send cookie over https
      sameSite: "strict", // prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }

  //   res.send("Signup Route");
}

export async function login(req, res) {
  // validation
  // check if user exists
  // compare password
  // create token
  // send response with token and user object
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }

  //   res.send("Login Route");
}

export function logout(req, res) {
  // clear cookie
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logged out" });
  //   res.send("Logout Route");
}

export async function onboard(req, res) {
  try {
    const {
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
      avatar,
    } = req.body;

    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const userId = req.user._id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        nativeLanguage,
        learningLanguage,
        location,
        avatar,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // TODO: update user for stream as well
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.avatar || "",
      });

      console.log(`User updated for Stream ${updatedUser.fullName}`);
    } catch (error) {
      console.error("Error updating user for Stream:", error);
      return res.status(500).json({ message: "Error when update stream user" });
    }

    res.status(200).json({
      success: true,
      message: "User onboarded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
