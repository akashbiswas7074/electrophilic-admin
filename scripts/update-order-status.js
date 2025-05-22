/**
 * Script to manually update order status in MongoDB
 * 
 * Usage: 
 * 1. Make sure MongoDB connection string is set in .env file
 * 2. Run with: node scripts/update-order-status.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Update these variables as needed
const ORDER_ID = '68299f0a0e873297f3af9e75';
const NEW_STATUS = 'Confirmed'; // Change to desired status: "Not Processed", "Processing", "Confirmed", "Dispatched", "Delivered", "Cancelled", "Completed"

async function main() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get the Order model (simplified schema for this script)
    const orderSchema = new mongoose.Schema({}, { strict: false });
    const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

    // Verify the order exists
    const orderExists = await Order.findById(ORDER_ID);
    if (!orderExists) {
      console.error(`Order with ID ${ORDER_ID} not found`);
      process.exit(1);
    }
    
    console.log('Current order status:', orderExists.status);

    // Update the order status
    const result = await Order.findByIdAndUpdate(
      ORDER_ID,
      { 
        status: NEW_STATUS,
        // Also update status in all products and orderItems for consistency
        $set: {
          'products.$[].status': NEW_STATUS,
          'orderItems.$[].status': NEW_STATUS
        }
      },
      { new: true } // Return the updated document
    );

    console.log('Order status updated successfully:');
    console.log(`Previous status: ${orderExists.status}`);
    console.log(`New status: ${result.status}`);
    
    // Additional verification
    const productsStatuses = result.products ? result.products.map(p => p.status) : [];
    const orderItemsStatuses = result.orderItems ? result.orderItems.map(i => i.status) : [];
    
    console.log('Products statuses:', productsStatuses);
    console.log('OrderItems statuses:', orderItemsStatuses);

  } catch (error) {
    console.error('Error updating order status:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

main();
