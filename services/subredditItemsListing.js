import Subreddit from "../models/Community.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { commentListing } from "../utils/prepareCommentListing.js";
import { postListing } from "../utils/preparePostListing.js";

// eslint-disable-next-line max-statements
export async function listingSubredditPosts(
  modId,
  subredditName,
  typeOfListing,
  listingParams
) {
  // Prepare Listing Parameters
  const listingResult = await postListing(listingParams);

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
      options: {
        sort: listingResult.sort,
      },
    });
  const mod = await User.findById(modId);

  let children = [];

  for (const i in result[typeOfListing]) {
    const post = result[typeOfListing][i];
    let saved = false,
      vote;
    if (
      mod.upvotedPosts.find(
        (postId) => post.id.toString() === postId.toString()
      )
    ) {
      vote = 1;
    } else if (
      mod.downvotedPosts.find(
        (postId) => post.id.toString() === postId.toString()
      )
    ) {
      vote = -1;
    } else {
      vote = 0;
    }
    if (
      mod.savedPosts.find((postId) => postId.toString() === post.id.toString())
    ) {
      saved = true;
    }
    let postData = { id: result[typeOfListing][i]._id.toString() };
    postData.data = {
      id: post.id.toString(),
      subreddit: post.subredditName,
      postedBy: post.ownerUsername,
      title: post.title,
      link: post.link,
      content: typeOfListing === "unmoderatedPosts" ? post.content : undefined,
      images: typeOfListing === "unmoderatedPosts" ? post.images : undefined,
      video: typeOfListing === "unmoderatedPosts" ? post.video : undefined,
      nsfw: post.nsfw,
      spoiler: post.spoiler,
      votes: post.numberOfVotes,
      numberOfComments: post.numberOfComments,
      flair: post.flair,
      postedAt: post.createdAt,
      editedAt: post.editedAt,
      spammedAt:
        typeOfListing === "spammedPosts"
          ? post.moderation.spam.spammedDate
          : undefined,
      saved: saved,
      vote: vote,
    };

    children.push(postData);
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
export async function listingSubredditComments(
  modId,
  subredditName,
  typeOfListing,
  listingParams
) {
  // Prepare Listing Parameters
  const listingResult = await commentListing(listingParams);

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
      options: {
        sort: listingResult.sort,
      },
    });

  const mod = await User.findById(modId);

  let children = [];
  for (const i in result[typeOfListing]) {
    const comment = result[typeOfListing][i];
    const post = await Post.findById(comment.postId);
    let saved = false,
      vote;
    if (
      mod.upvotedComments.find(
        (commentId) => comment.id.toString() === commentId.toString()
      )
    ) {
      vote = 1;
    } else if (
      mod.downvotedComments.find(
        (commentId) => comment.id.toString() === commentId.toString()
      )
    ) {
      vote = -1;
    } else {
      vote = 0;
    }
    if (
      mod.savedComments.find(
        (commentId) => commentId.toString() === comment.id.toString()
      )
    ) {
      saved = true;
    }
    let commentData = { id: result[typeOfListing][i]._id.toString() };
    commentData.data = {
      postId: post.id.toString(),
      postTitle: post.title,
      comment: {
        id: comment.id.toString(),
        subreddit: comment.subredditName,
        commentedBy: comment.ownerUsername,
        commentedAt: comment.createdAt,
        editedAt: comment.editedAt,
        spammedAt:
          typeOfListing === "spammedComments"
            ? comment.moderation.spam.spammedDate
            : undefined,
        votes: comment.numberOfVotes,
        saved: saved,
        vote: vote,
      },
    };

    children.push(commentData);
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
