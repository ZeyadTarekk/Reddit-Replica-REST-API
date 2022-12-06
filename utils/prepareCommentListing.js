import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import { prepareLimit } from "./prepareLimit.js";

/**
 * Function used to prepare the sorting object that will be used by mongoose to sort the results
 *
 * @param {String} listingSort Sorting type used to sort the wanted comments
 * @returns {Array} Array with two elements [sort, sortingType]
 */
function prepareCommentSort(listingSort) {
  let result = {},
    sortingType = {};

  if (!listingSort) {
    // best
    listingSort = "best";
    result = { numberOfVotes: -1 };
    sortingType = { type: "numberOfVotes" };
  } else {
    switch (listingSort) {
      case "new":
        result = { createdAt: -1 };
        sortingType = { type: "createdAt" };
        break;
      case "old":
        result = { createdAt: 1 };
        sortingType = { type: "createdAt" };
        break;
      case "top":
        result = null;
        break;
      default:
        result = { numberOfVotes: -1 };
        sortingType = { type: "numberOfVotes" };
        break;
    }
  }
  return [result, sortingType];
}

/**
 * Function used to prepare the anchor point of the slice that will be used by mongoose to match the results
 *
 * @param {String} before Id of the comment that we want to get the comments before it
 * @param {String} after Id of the comment that we want to get the comments after it
 * @param {String} sort Sorting type used to sort the wanted comments
 * @param {String} sortingType Sorting parameter in the comment model
 * @returns {Object} Object that will be used by mongoose to match the results
 */
// eslint-disable-next-line max-statements
async function prepareCommentBeforeAfter(before, after, sort, sortingType) {
  let result = {};
  if (!after && !before) {
    return null;
  } else if (!after && before) {
    if (mongoose.Types.ObjectId.isValid(before)) {
      // get the wanted value that we will split from
      const comment = await Comment.findById(before);
      if (!comment || comment.deletedAt) {
        return null;
      }

      if (sort) {
        let value = { $gt: comment[sortingType.type] };
        // eslint-disable-next-line max-depth
        if (sort.createdAt === 1) {
          value = { $lt: comment[sortingType.type] };
        }
        result = {
          type: sortingType.type,
          value: value,
        };
      } else {
        result = {
          type: "_id",
          value: { $lt: before },
        };
      }
    } else {
      return null;
    }
  } else if (after && !before) {
    if (mongoose.Types.ObjectId.isValid(after)) {
      // get the wanted value that we will split from
      const comment = await Comment.findById(after);
      if (!comment || comment.deletedAt) {
        return null;
      }

      if (sort) {
        let value = { $lt: comment[sortingType.type] };
        // eslint-disable-next-line max-depth
        if (sort.createdAt === 1) {
          value = { $gt: comment[sortingType.type] };
        }
        result = {
          type: sortingType.type,
          value: value,
        };
      } else {
        result = {
          type: "_id",
          value: { $gt: after },
        };
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
  return result;
}

/**
 * Function to prepare the listing parameters and set the appropriate condition that will be used with mongoose later.
 * Check the sort algorithm, limit of the result, and the anchor point of the slice
 * to get the previous or the next things
 *
 * @param {Object} listingParams Listing parameters sent in the request query [sort, before, after, limit]
 * @returns {Object} Result object containing the final results after listing [sort, time, listing, limit]
 */
export async function prepareListingCommentTree(listingParams) {
  let result = {},
    sortingType = {};

  //prepare the sorting
  const sortingResult = prepareCommentSort(listingParams.sort);
  result.sort = sortingResult[0];
  sortingType = sortingResult[1];

  // prepare the limit
  result.limit = prepareLimit(listingParams.limit);

  // check if after or before
  result.listing = await prepareCommentBeforeAfter(
    listingParams.before,
    listingParams.after,
    result.sort,
    sortingType
  );

  return result;
}

/**
 * Function to create the exact condition that will be used by mongoose directly to list comments.
 * Used to map every listing parameter to the exact query that mongoose will use later
 *
 * @param {Object} listingParams Listing parameters sent in the request query [sort, before, after, limit]
 * @returns {Object} The final results that will be used by mongoose to list comments
 */
export async function commentTreeListing(listingParams) {
  let result = {};
  listingParams = await prepareListingCommentTree(listingParams);

  if (listingParams.listing) {
    result.find = { deletedAt: null };
    result.find[listingParams.listing.type] = listingParams.listing.value;
  } else {
    result.find = { deletedAt: null };
  }

  result.sort = listingParams.sort;
  result.limit = listingParams.limit;

  return result;
}

/**
 * Function to prepare the listing parameters and set the appropriate condition that will be used with mongoose later.
 * Check the sort algorithm, time interval for the results, limit of the result, and the anchor point of the slice
 * to get the previous or the next things
 *
 * @param {Object} listingParams Listing parameters sent in the request query [sort, time, before, after, limit]
 * @returns {Object} Result object containing the final results after listing [sort, time, listing, limit]
 */
// eslint-disable-next-line max-statements
export async function prepareListingComments(listingParams) {
  let result = {};

  //prepare the sorting
  if (!listingParams.sort) {
    // new
    listingParams.sort = "new";
    result.sort = { createdAt: -1 };
    result.sortingType = { type: "createdAt" };
  } else {
    switch (listingParams.sort) {
      case "hot":
        // TODO
        result.sort = { score: -1 };
        result.sortingType = { type: "score" };
        break;
      case "top":
        result.sort = null;
        break;
      case "old":
        result.sort = { createdAt: 1 };
        result.sortingType = { type: "createdAt" };
        break;
      default:
        result.sort = { createdAt: -1 };
        result.sortingType = { type: "createdAt" };
        break;
    }
  }

  //prepare the time
  if (!listingParams.time) {
    result.time = null;
  } else {
    if (listingParams.sort === "top") {
      const year = new Date().setFullYear(new Date().getFullYear() - 1);
      const month = new Date().setMonth(new Date().getMonth() - 1);
      const day = new Date().setDate(new Date().getDate() - 1);
      const week = new Date().setDate(new Date().getDate() - 7);
      const hour = new Date().setHours(new Date().getHours() - 1);
      switch (listingParams.time) {
        case "hour":
          result.time = { $gt: hour };
          break;
        case "day":
          result.time = { $gt: day };
          break;
        case "week":
          result.time = { $gt: week };
          break;
        case "month":
          result.time = { $gt: month };
          break;
        case "year":
          result.time = { $gt: year };
          break;
        default:
          result.time = null;
          break;
      }
    }
  }

  // prepare the limit
  if (!listingParams.limit) {
    result.limit = 25;
  } else {
    listingParams.limit = parseInt(listingParams.limit);
    if (listingParams.limit > 100) {
      result.limit = 100;
    } else if (listingParams.limit <= 0) {
      result.limit = 1;
    } else {
      result.limit = listingParams.limit;
    }
  }

  // check if after or before
  if (!listingParams.after && !listingParams.before) {
    result.listing = null;
  } else if (!listingParams.after && listingParams.before) {
    if (mongoose.Types.ObjectId.isValid(listingParams.before)) {
      // get the wanted value that we will split from
      const comment = await Comment.findById(listingParams.before);
      if (!comment) {
        result.listing = null;
      } else {
        if (result.sort) {
          result.listing = {
            type: result.sortingType.type,
            value: { $gt: comment[result.sortingType.type] },
          };
        } else {
          result.listing = {
            type: "_id",
            value: { $lt: listingParams.before },
          };
        }
      }
    } else {
      result.listing = null;
    }
  } else if (listingParams.after && !listingParams.before) {
    if (mongoose.Types.ObjectId.isValid(listingParams.after)) {
      // get the wanted value that we will split from
      const comment = await Comment.findById(listingParams.after);
      if (!comment) {
        result.listing = null;
      } else {
        if (result.sort) {
          result.listing = {
            type: result.sortingType.type,
            value: { $lt: comment[result.sortingType.type] },
          };
        } else {
          result.listing = {
            type: "_id",
            value: { $gt: listingParams.after },
          };
        }
      }
    } else {
      result.listing = null;
    }
  } else {
    result.listing = null;
  }

  return result;
}

/**
 * Function to create the exact condition that will be used by mongoose directly to list comments.
 * Used to map every listing parameter to the exact query that mongoose will use later
 *
 * @param {Object} listingParams Listing parameters sent in the request query [sort, time, before, after, limit]
 * @returns {Object} The final results that will be used by mongoose to list posts
 */
export async function commentListing(listingParams) {
  let result = {};
  listingParams = await prepareListingComments(listingParams);

  if (listingParams.time && listingParams.listing) {
    result.find = {
      createdAt: listingParams.time,
      deletedAt: null,
    };
    result.find[listingParams.listing.type] = listingParams.listing.value;
  } else if (listingParams.time) {
    result.find = { createdAt: listingParams.time, deletedAt: null };
  } else if (listingParams.listing) {
    result.find = { deletedAt: null };
    result.find[listingParams.listing.type] = listingParams.listing.value;
  } else {
    result.find = { deletedAt: null };
  }

  result.sort = listingParams.sort;
  result.limit = listingParams.limit;

  return result;
}