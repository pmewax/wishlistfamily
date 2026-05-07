import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    }
  },
  { _id: false }
);

const GiverSchema = new mongoose.Schema(
  {
    giverId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    pinSalt: {
      type: String,
      required: true
    },
    pinHash: {
      type: String,
      required: true
    },
    tokenHash: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const ItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true
    },
    memberId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    url: {
      type: String,
      default: "",
      trim: true
    },
    img: {
      type: String,
      default: "",
      trim: true
    },
    reserved: {
      type: Boolean,
      default: false
    },
    reservedBy: {
      type: String,
      default: ""
    },
    reservedByName: {
      type: String,
      default: ""
    },
    reservedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const WishlistSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    occasionKey: {
      type: String,
      required: true,
      trim: true
    },
    occasionLabel: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    ownerToken: {
      type: String,
      required: true,
      index: true
    },
    members: {
      type: [MemberSchema],
      default: []
    },
    givers: {
      type: [GiverSchema],
      default: []
    },
    items: {
      type: [ItemSchema],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("Wishlist", WishlistSchema);