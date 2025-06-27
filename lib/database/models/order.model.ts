import mongoose from "mongoose";
import { calculateShippingCharge } from "../utils/shipping";
const { ObjectId } = mongoose.Schema;

// Define item schema for better maintainability
const OrderItemSchema = new mongoose.Schema({
  product: {
    type: ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  vendor: {
    type: Object,
  },
  image: {
    type: String,
    required: true,
  },
  size: {
    type: String,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  quantity: {
    type: Number,
    min: 1,
  },
  color: {
    color: String,
    image: String,
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
  },
  status: {
    type: String,
    default: "Not Processed",
    enum: ["Not Processed", "Processing", "Confirmed", "Dispatched", "Delivered", "Cancelled", "Completed"], // Added "Confirmed"
  },
  trackingUrl: { // New field for tracking URL
    type: String,
    trim: true,
  },
  trackingId: { // New field for tracking ID
    type: String,
    trim: true,
  },
  productCompletedAt: {
    type: Date,
    default: null,
  },
  cancelRequested: {
    type: Boolean,
    default: false,
  },
  cancelReason: {
    type: String,
    trim: true,
  },
  cancelRequestedAt: {
    type: Date,
    default: null,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    products: [OrderItemSchema], // Keep products for admin compatibility
    orderItems: [OrderItemSchema], // Add orderItems for website compatibility
    shippingAddress: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      address1: {
        type: String,
        required: true,
      },
      address2: {
        type: String,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.Mixed, // For compatibility with website model
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'razorpay', 'other'],
      required: true,
    },
    paymentResult: {
      id: String,
      status: String,
      email: String,
    },
    total: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
    },
    itemsPrice: {
      type: Number,
    },
    totalOriginalItemsPrice: {
      type: Number,
    },
    totalBeforeDiscount: {
      type: Number,
    },
    couponApplied: {
      type: String,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    totalSaved: {
      type: Number,
    },
    razorpay_order_id: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpay_payment_id: {
      type: String,
    },
    paymentIntentId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    isNew: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'Confirmed', // Added "Confirmed"
        'shipped',
        'delivered', 
        'cancelled',
        'refunded',
        'pending_cod_verification',
        'Not Processed',
        'Processing',
        'Dispatched',
        'Cancelled',
        'Completed'
      ],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true
  }
);

// Pre-save hook to sync products and orderItems arrays
orderSchema.pre("save", function (this: any, next) {
  // Sync products and orderItems arrays
  if (this.products && this.products.length > 0 && (!this.orderItems || this.orderItems.length === 0)) {
    this.orderItems = [...this.products];
  } else if (this.orderItems && this.orderItems.length > 0 && (!this.products || this.products.length === 0)) {
    this.products = [...this.orderItems];
  }

  // Sync qty and quantity fields
  const syncItems = (items: any[] | undefined) => {
    if (items && items.length > 0) {
      items.forEach((item) => {
        if (item && typeof item.quantity === "undefined" && typeof item.qty !== "undefined") {
          item.quantity = item.qty;
        } else if (item && typeof item.qty === "undefined" && typeof item.quantity !== "undefined") {
          item.qty = item.quantity;
        } else if (item && typeof item.qty === "undefined" && typeof item.quantity === "undefined") {
          item.quantity = 1;
          item.qty = 1;
        }
      });
    }
  };

  syncItems(this.products);
  syncItems(this.orderItems);

  // Address synchronization and default population
  const defaultAddressValues: { [key: string]: string } = {
    firstName: "Guest",
    lastName: "User",
    phoneNumber: "0000000000",
    address1: "Default Address",
    address2: "", // Typically optional
    city: "Default City",
    state: "Default State",
    zipCode: "000000",
    country: "Default Country",
  };

  // Ensure both address types are objects
  if (!this.shippingAddress || typeof this.shippingAddress !== "object") {
    this.shippingAddress = {};
  }
  
  if (!this.deliveryAddress || typeof this.deliveryAddress !== "object") {
    this.deliveryAddress = {};
  }
  
  // First, try to populate from deliveryAddress to shippingAddress for any missing fields
  for (const key of Object.keys(defaultAddressValues) as Array<keyof typeof defaultAddressValues>) {
    if (this.deliveryAddress && 
        typeof this.deliveryAddress[key] !== 'undefined' && 
        this.deliveryAddress[key] !== null && 
        String(this.deliveryAddress[key]).trim() !== "") {
      
      if (!this.shippingAddress[key] || 
          this.shippingAddress[key] === null || 
          String(this.shippingAddress[key]).trim() === "") {
        this.shippingAddress[key] = this.deliveryAddress[key];
      }
    }
  }
  
  // Then, try to populate from shippingAddress to deliveryAddress for any missing fields
  for (const key of Object.keys(defaultAddressValues) as Array<keyof typeof defaultAddressValues>) {
    if (this.shippingAddress && 
        typeof this.shippingAddress[key] !== 'undefined' && 
        this.shippingAddress[key] !== null && 
        String(this.shippingAddress[key]).trim() !== "") {
      
      if (!this.deliveryAddress[key] || 
          this.deliveryAddress[key] === null || 
          String(this.deliveryAddress[key]).trim() === "") {
        this.deliveryAddress[key] = this.shippingAddress[key];
      }
    }
  }
  
  // Finally, apply default values to any still-missing fields in both addresses
  for (const key of Object.keys(defaultAddressValues) as Array<keyof typeof defaultAddressValues>) {
    if (!this.shippingAddress[key] || this.shippingAddress[key] === null || String(this.shippingAddress[key]).trim() === "") {
      this.shippingAddress[key] = defaultAddressValues[key];
    }
    
    if (!this.deliveryAddress[key] || this.deliveryAddress[key] === null || String(this.deliveryAddress[key]).trim() === "") {
      this.deliveryAddress[key] = defaultAddressValues[key];
    }
  }

  // Order address handling
  if (!this.orderAddress || typeof this.orderAddress !== "object") {
    this.orderAddress = { ...this.deliveryAddress };
  } else {
    for (const key of Object.keys(defaultAddressValues) as Array<keyof typeof defaultAddressValues>) {
      if (this.orderAddress[key] === undefined || this.orderAddress[key] === null || String(this.orderAddress[key]).trim() === "") {
        this.orderAddress[key] = this.deliveryAddress[key] || this.shippingAddress[key] || defaultAddressValues[key];
      }
    }
  }

  // Total calculation and default
  let calculatedTotal = 0;
  const itemsForTotal = (this.products && this.products.length > 0) ? this.products : (this.orderItems || []);
  
  if (itemsForTotal && itemsForTotal.length > 0) {
    calculatedTotal = itemsForTotal.reduce((sum: number, item: any) => {
      if (!item) return sum;
      // Ensure price and quantity are numbers with proper fallbacks
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
      const quantity = typeof item.qty === 'number' ? item.qty : 
                      (typeof item.quantity === 'number' ? item.quantity : 
                      (parseFloat(item.qty) || parseFloat(item.quantity) || 1));
      return sum + (price * quantity);
    }, 0);
  }

  // Add shipping price, tax price to the calculated total if they exist
  if (typeof this.shippingPrice === 'number') {
    calculatedTotal += this.shippingPrice;
  } else if (typeof this.shippingPrice === 'string') {
    calculatedTotal += parseFloat(this.shippingPrice) || 0;
  }

  if (typeof this.taxPrice === 'number') {
    calculatedTotal += this.taxPrice;
  } else if (typeof this.taxPrice === 'string') {
    calculatedTotal += parseFloat(this.taxPrice) || 0;
  }

  // Subtract discount if it exists
  if (typeof this.discountAmount === 'number') {
    calculatedTotal -= this.discountAmount;
  } else if (typeof this.discountAmount === 'string') {
    calculatedTotal -= parseFloat(this.discountAmount) || 0;
  }

  // Round to two decimal places to avoid floating-point issues
  calculatedTotal = Math.round(calculatedTotal * 100) / 100;

  // Determine if total or totalAmount is effectively missing
  const totalIsEffectivelyMissing = this.total === undefined || this.total === null || typeof this.total !== 'number' || isNaN(this.total);
  const totalAmountIsEffectivelyMissing = this.totalAmount === undefined || this.totalAmount === null || typeof this.totalAmount !== 'number' || isNaN(this.totalAmount);

  // Logic for setting total and totalAmount
  if (totalIsEffectivelyMissing && !totalAmountIsEffectivelyMissing) {
    this.total = this.totalAmount;
  } else if (!totalIsEffectivelyMissing && totalAmountIsEffectivelyMissing) {
    this.totalAmount = this.total;
  } else if (totalIsEffectivelyMissing && totalAmountIsEffectivelyMissing) {
    // If both are missing, use the calculated total
    this.total = calculatedTotal;
    this.totalAmount = calculatedTotal;
  }

  // Final validation to ensure both fields are valid numbers (always set total to prevent validation error)
  if (totalIsEffectivelyMissing || this.total <= 0) {
    // If total is still missing or non-positive, ensure it's at least 0
    this.total = calculatedTotal > 0 ? calculatedTotal : 0;
  }
  
  if (totalAmountIsEffectivelyMissing || this.totalAmount <= 0) {
    // Ensure totalAmount is consistent with total
    this.totalAmount = this.total;
  }

  next();
});

// Add indexes for better query performance
orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ razorpay_order_id: 1 });
orderSchema.index({ paymentIntentId: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
