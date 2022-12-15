import { body } from "express-validator";
import {
  subscribeNotification,
  unsubscribeNotification,
  markAllNotificationsRead,
} from "../services/notificationServices.js";
const notificationSubscribeValidator = [
  body("accessToken")
    .trim()
    .not()
    .isEmpty()
    .withMessage("accessToken is required"),
  body("type")
    .trim()
    .not()
    .isEmpty()
    .withMessage("type is required")
    .isIn(["web", "flutter"])
    .withMessage("Invalid type"),
];
const notificationUnsubscribeValidator = [
  body("type")
    .trim()
    .not()
    .isEmpty()
    .withMessage("type is required")
    .isIn(["web", "flutter"])
    .withMessage("Invalid type"),
];

const notificationSubscribe = async (req, res) => {
  try {
    await subscribeNotification(
      req.payload.userId,
      req.body.type,
      req.body.accessToken
    );
    res.status(200).json("Subscribed successfully");
  } catch (err) {
    console.log(err.message);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json("Internal Server Error");
    }
  }
};

const notificationUnsubscribe = async (req, res) => {
  try {
    await unsubscribeNotification(req.payload.userId, req.body.type);
    res.status(200).json("Unsubscribed successfully");
  } catch (err) {
    console.log(err.message);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json("Internal Server Error");
    }
  }
};

const markNotificationsAsRead = async (req, res) => {
  try {
    await markAllNotificationsRead(req.payload.userId);
    res.status(200).json("Notification marked as read successfully");
  } catch (err) {
    console.log(err.message);
    if (err.statusCode) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(500).json("Internal Server Error");
    }
  }
};

export default {
  notificationSubscribe,
  notificationSubscribeValidator,
  notificationUnsubscribe,
  notificationUnsubscribeValidator,
  markNotificationsAsRead,
};
