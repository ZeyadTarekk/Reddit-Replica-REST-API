import Subreddit from "../models/Community.js";
import User from "../models/User.js";
import { userListing } from "../utils/prepareListing.js";

// eslint-disable-next-line max-statements
export async function listingBannedUsers(
  subredditName,
  typeOfListing,
  listingParams
) {
  // Prepare Listing Parameters
  const listingResult = await userListing(listingParams);

  const subreddit = await Subreddit.findOne({ title: subredditName });
  if (!subreddit) {
    return {
      statusCode: 404,
      data: "Subreddit not found",
    };
  }

  const result = await Subreddit.findOne({ title: subredditName })
    .select(typeOfListing)
    .populate({
      path: typeOfListing,
      match: listingResult.find,
      limit: listingResult.limit,
    });

  let children = [];

  for (const i in result[typeOfListing]) {
    const user = result[typeOfListing][i];

    let userData = { id: result[typeOfListing][i]._id.toString() };
    userData.data = {
      username: user.username,
      userPhoto: user.userPhoto,
      bannedAt: user.ban.bannedAt,
      banPeriod: user.ban.banPeriod,
      modNote: user.ban.modNote,
      noteInclude: user.ban.noteInclude,
      reasonForBan: user.ban.reasonForBan,
    };

    children.push(userData);
  }

  let after = "",
    before = "";
  if (result[typeOfListing].length) {
    after =
      result[typeOfListing][result[typeOfListing].length - 1]._id.toString();
    before = result[typeOfListing][0]._id.toString();
  }
  return {
    statusCode: 200,
    data: {
      after: after,
      before: before,
      children: children,
    },
  };
}

// eslint-disable-next-line max-statements
export async function listingBlockedUsers(userId, listingParams) {
  const typeOfListing = "blockedUsers";
  // Prepare Listing Parameters
  const listingResult = await userListing(listingParams);

  const result = await User.findById(userId)
    .select(typeOfListing)
    .populate({
      path: typeOfListing,
      populate: {
        path: "user",
        model: "User",
      },
      match: listingResult.find,
      limit: listingResult.limit,
    });

  let children = [];

  for (const i in result[typeOfListing]) {
    const blockedUser = result[typeOfListing][i];

    let userData = { id: result[typeOfListing][i]._id.toString() };
    userData.data = {
      username: blockedUser.user.username,
      avatar: blockedUser.user.avatar,
      blockDate: blockedUser.blockDate,
    };

    children.push(userData);
  }

  let after = "",
    before = "";
  if (result[typeOfListing].length) {
    after =
      result[typeOfListing][result[typeOfListing].length - 1]._id.toString();
    before = result[typeOfListing][0]._id.toString();
  }
  return {
    statusCode: 200,
    data: {
      after: after,
      before: before,
      children: children,
    },
  };
}