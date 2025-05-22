"use client";
import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import styles from "./styles.module.css";

import { FaCheckCircle } from "react-icons/fa";
import { IoIosCloseCircle } from "react-icons/io";
import { CheckCircle, Description as IconFileDescription, HelpOutline } from "@mui/icons-material"; // Added HelpOutline
// import PopupModal from "@/components/PopupModal";
// import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Added Link import

// Snackbar and Alert were already imported, ensure they are used in AllOrdersTable
import {
  Select,
  MenuItem,
  CircularProgress, // Added for loading state in status cell
  TextField, // Ensure TextField is imported for the modal
  Dialog, // Using Dialog for modal as an alternative to Box with absolute positioning
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar, // Added Snackbar import
  Alert, // Added Alert import
  Button, // Added Button import
  Tooltip, // Added Tooltip for explaining status system
  FormControl, // Added FormControl for select inputs
} from "@mui/material";
import { useState, useEffect } from "react";
import StatusCell from './StatusCell'; // Import the StatusCell component

// Define type for status color map
interface StatusColorType {
  bg: string;
  text: string;
  border: string;
}

interface StatusColorMapType {
  [key: string]: StatusColorType;
}

const statusColorMap: StatusColorMapType = {
  "Not Processed": {
    bg: "#fff4e5",
    text: "#ff8b00",
    border: "#ffe0b2"
  },
  "Processing": {
    bg: "#e3f2fd",
    text: "#1976d2",
    border: "#bbdefb"
  },
  "Confirmed": { // Added Confirmed status
    bg: "#e0f2f7", // Light cyan background
    text: "#00796b", // Dark cyan text
    border: "#b2dfdb"  // Cyan border
  },
  "Dispatched": {
    bg: "#e8f5e9",
    text: "#2e7d32", 
    border: "#c8e6c9"
  },
  "Cancelled": {
    bg: "#fbe9e7",
    text: "#d32f2f",
    border: "#ffcdd2"
  },
  "Completed": {
    bg: "#e8f5e9", 
    text: "#2e7d32",
    border: "#c8e6c9"
  },
  "Processing Refund": {
    bg: "#fbe9e7",
    text: "#d32f2f",
    border: "#ffcdd2"
  }
};

const options = [
  { value: "Not Processed", text: "Not Processed" },
  { value: "Processing", text: "Processing" },
  { value: "Confirmed", text: "Confirmed" }, // Added Confirmed option
  { value: "Dispatched", text: "Dispatched" },
  { value: "Cancelled", text: "Cancelled" },
  { value: "Completed", text: "Completed" }
];

interface RowProps { // Define props for Row for clarity
  row: any;
  updateOrderStatus: (orderId: string, productId: string | null, status: string, customMessage?: string, trackingUrl?: string, trackingId?: string) => Promise<any>; // Updated signature with null for order-level changes
  markOrderAsOld: (id: string) => Promise<any>;
  refreshOrders: () => void;
  showSnackbar: (message: string, severity: "success" | "error") => void;
}

function Row(props: RowProps) { // Use defined RowProps
  const router = useRouter();

  const { row, updateOrderStatus, markOrderAsOld, refreshOrders, showSnackbar } = props; // Destructure showSnackbar
  const [open, setOpen] = React.useState(false);
  // Remove Snackbar state from Row:
  // const [snackbarOpen, setSnackbarOpen] = useState(false);
  // const [snackbarMessage, setSnackbarMessage] = useState("");
  // const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [loadingStatus, setLoadingStatus] = useState<{[key: string]: boolean}>({});
  
  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [customMessage, setCustomMessage] = useState(""); // Added for consistency if needed later
  const [modalContext, setModalContext] = useState<{orderId: string, productId: string, status: string, currentTrackingUrl?: string, currentTrackingId?: string} | null>(null);

  // State for order-level status change
  const [orderLevelLoading, setOrderLevelLoading] = useState(false);

  const handleOpenModal = (orderId: string, productId: string, status: string, currentTrackingUrl?: string, currentTrackingId?: string) => {
    setModalContext({ orderId, productId, status, currentTrackingUrl, currentTrackingId });
    setTrackingUrl(currentTrackingUrl || ""); // Pre-fill
    setTrackingId(currentTrackingId || "");   // Pre-fill
    setCustomMessage(""); // Reset custom message
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalContext(null);
  };

  const handleModalSubmit = async () => {
    if (!modalContext) return;

    const { orderId, productId, status } = modalContext;
    setLoadingStatus(prev => ({...prev, [productId]: true})); // Ensure correct update
    try {
      // Pass trackingUrl, trackingId, and customMessage.
      // The 'suppressEmailNotification' argument is not part of the latest function signature.
      const result = await updateOrderStatus(orderId, productId, status, customMessage, trackingUrl, trackingId);
      if (result && (result.success === true || result.status === "success")) {
        showSnackbar(result.message || "Tracking information updated successfully", "success"); // Updated message
      } else {
        const errorMessage = result?.message || (result ? "Invalid response format" : "Empty response from server");
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Error in handleModalSubmit:", err);
      showSnackbar(err.message || "Failed to update order status with tracking info", "error");
    } finally {
      setLoadingStatus(prev => ({...prev, [productId]: false})); // Ensure correct update
      handleCloseModal();
    }
  };

  const handleChange = async (e: any, productId: string, orderId: string, item: any) => { // Added item parameter
    console.log("handleChange event:", e);
    console.log("handleChange event target value:", e?.target?.value);

    if (!productId || !orderId) {
      showSnackbar("Missing product ID or order ID", "error");
      return;
    }

    const newStatus = e?.target?.value;
    if (!newStatus || typeof newStatus !== 'string' || newStatus.trim() === '') {
      showSnackbar("Invalid status value provided.", "error");
      console.error("Invalid status value:", newStatus);
      return;
    }

    if (newStatus === "Confirmed") {
      // Open modal to add/edit tracking info, pre-fill if exists
      handleOpenModal(orderId, productId, newStatus, item.trackingUrl, item.trackingId);
    } else {
      // Existing logic for other statuses (which also don't use the modal for tracking)
      setLoadingStatus(prev => ({ ...prev, [productId]: true })); // Ensure correct update
      try {
        console.log("Updating status (direct for non-Confirmed):", { orderId, productId, status: newStatus });
        // For non-Confirmed statuses, trackingUrl, trackingId, customMessage are undefined.
        // The 'suppressEmailNotification' argument is not part of the latest function signature.
        const result = await updateOrderStatus(orderId, productId, newStatus, undefined, undefined, undefined); 
        
        if (result && (result.success === true || result.status === "success")) {
          showSnackbar(result.message || "Status updated successfully", "success");
        } else {
          console.error("Failed update result (non-Confirmed):", result);
          const errorMessage = result?.message || (result ? "Invalid response format" : "Empty response from server");
          throw new Error(errorMessage);
        }
      } catch (err: any) {
        console.error("Error in handleChange (direct non-Confirmed):", err);
        showSnackbar(err.message || "Failed to update order status", "error");
      } finally {
        setLoadingStatus(prev => ({ ...prev, [productId]: false })); // Ensure correct update
      }
    }
  };

  const changeOrdertoOld = async (id: string) => {
    try {
      const result = await markOrderAsOld(id);
      showSnackbar(result?.message || "Order marked as old", "success"); // Use showSnackbar
      refreshOrders();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to update order status", "error"); // Use showSnackbar
    }
  };

  // handleCloseSnackbar is no longer needed in Row

  const handleSetOrderAddress = async (orderId: string) => {
    if (!orderId) {
      showSnackbar("Missing order ID", "error"); // Use showSnackbar
      return;
    }

    try {
      const response = await fetch("/api/admin/orders/set-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showSnackbar("Successfully processed delivery address", "success"); // Use showSnackbar
        refreshOrders(); 
      } else {
        throw new Error(result.message || "Failed to process delivery address");
      }
    } catch (err: any) {
      console.error("Error processing delivery address:", err);
      showSnackbar(err.message || "Failed to process delivery address", "error"); // Use showSnackbar
    } finally {
      // setSnackbarOpen(true); // No longer needed
    }
  };
  // Handle order-level status change
  const handleOrderStatusChange = async (e: any, orderId: string) => {
    const newStatus = e?.target?.value;
    if (!newStatus || typeof newStatus !== 'string' || newStatus.trim() === '') {
      showSnackbar("Invalid status value provided.", "error");
      return;
    }

    setOrderLevelLoading(true);
    try {
      console.log("Updating entire order status:", { orderId, status: newStatus });
      
      // Pass null as productId to indicate this is an order-level status change
      const result = await updateOrderStatus(orderId, null, newStatus);
      
      if (result && (result.success === true || result.status === "success")) {
        // Update local state immediately for better UX
        // This will be overwritten when refreshOrders() completes, but gives immediate feedback
        if (row.products && Array.isArray(row.products)) {
          row.products.forEach((product: { status: string }) => {
            product.status = newStatus;
          });
        }
        if (row.orderItems && Array.isArray(row.orderItems)) {
          row.orderItems.forEach((item: { status: string }) => {
            item.status = newStatus;
          });
        }
        row.status = newStatus;
        row.orderStatus = newStatus;
        
        showSnackbar(`All items in this order updated to ${newStatus} status`, "success");
        refreshOrders(); // Refresh to see the changes from server
      } else {
        console.error("Failed order-level update result:", result);
        const errorMessage = result?.message || (result ? "Invalid response format" : "Empty response from server");
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Error in handleOrderStatusChange:", err);
      showSnackbar(err.message || "Failed to update order status", "error");
    } finally {
      setOrderLevelLoading(false);
    }
  };
  
  return (
    <>
      {/* Modal for Confirmed Status */}
      <Dialog open={isModalOpen} onClose={handleCloseModal}>
        <DialogTitle id="tracking-info-modal-title">
          {modalContext?.status === "Confirmed" ? "Add/Edit Tracking Information" : "Update Status"}
        </DialogTitle>
        <DialogContent>
          <Typography id="tracking-info-modal-description" sx={{ mb: 2 }}>
            For order item: {modalContext?.productId}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="trackingUrl"
            label="Tracking URL (Optional)"
            type="url"
            fullWidth
            variant="outlined"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            disabled={loadingStatus[modalContext?.productId || '']}
          />
          <TextField
            margin="dense"
            id="trackingId"
            label="Tracking ID (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            disabled={loadingStatus[modalContext?.productId || '']}
          />
          {/* Removed custom message field as per original prompt focus, can be re-added if needed */}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} disabled={loadingStatus[modalContext?.productId || '']}>Cancel</Button>
          <Button onClick={handleModalSubmit} variant="contained" disabled={loadingStatus[modalContext?.productId || '']}>
            {loadingStatus[modalContext?.productId || ''] ? <CircularProgress size={24} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">{row._id}</TableCell>
        <TableCell align="left">{row.user?.name || row.user?.email || "N/A"}</TableCell>
        <TableCell align="left">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
        </TableCell>
        <TableCell align="left">
          {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "-"}
        </TableCell>        <TableCell align="left">
          <div className="flex flex-col gap-2">              <div 
              style={{ 
                backgroundColor: statusColorMap[row.orderStatus || row.status || "Not Processed"]?.bg || "#f5f5f5",
                color: statusColorMap[row.orderStatus || row.status || "Not Processed"]?.text || "#333",
                border: `1px solid ${statusColorMap[row.orderStatus || row.status || "Not Processed"]?.border || "#ddd"}`,
                borderRadius: "4px",
                padding: "4px 8px",
                display: "inline-block",
                fontWeight: 500,
                fontSize: "0.8rem",
                marginBottom: "4px"
              }}
            >
              <strong>Order Status:</strong> {row.orderStatus || row.status || "Not Processed"}
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>              <FormControl fullWidth size="small">
                <Select
                  value={row.orderStatus || row.status || "Not Processed"}
                  onChange={(e) => handleOrderStatusChange(e, row._id)}
                  disabled={orderLevelLoading}
                  size="small"
                  fullWidth
                  sx={{ minWidth: '120px', fontSize: '0.75rem' }}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    <em>Change order status</em>
                  </MenuItem>
                  {options.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.text}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {orderLevelLoading && <CircularProgress size={16} />}
              <Tooltip title="Order status applies to all products in this order. Individual product statuses can be changed below.">
                <IconButton size="small">
                  <HelpOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </TableCell>
        <TableCell align="left">
          <div className="flex flex-col gap-2">
            <div 
              style={{ 
                backgroundColor: row.paymentStatus === "paid" ? "#e8f5e9" : 
                                row.paymentStatus === "failed" ? "#fbe9e7" : "#fff4e5",
                color: row.paymentStatus === "paid" ? "#2e7d32" : 
                      row.paymentStatus === "failed" ? "#d32f2f" : "#ff8b00",
                border: `1px solid ${row.paymentStatus === "paid" ? "#c8e6c9" : 
                        row.paymentStatus === "failed" ? "#ffcdd2" : "#ffe0b2"}`,
                borderRadius: "4px",
                padding: "4px 8px",
                display: "inline-block",
                fontWeight: 500,
                fontSize: "0.8rem",
                marginBottom: "4px"
              }}
            >
              {row.paymentStatus || "pending"}
            </div>
            
            <button
              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors flex items-center justify-center"
              onClick={() => handleSetOrderAddress(row._id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Process Address
            </button>
          </div>
        </TableCell>
        <TableCell align="left">
          {row.orderItems && Array.isArray(row.orderItems) ? `${row.orderItems.length} item(s)` : row.products && Array.isArray(row.products) ? `${row.products.length} item(s)`: "0 items"}
        </TableCell>
        <TableCell align="left" style={{ minWidth: '200px' }}>
          {(row.shippingAddress || row.deliveryAddress) ? (
            <>
              {`${(row.shippingAddress || row.deliveryAddress).firstName} ${(row.shippingAddress || row.deliveryAddress).lastName}`}<br />
              {`${(row.shippingAddress || row.deliveryAddress).address1}`}
              {(row.shippingAddress || row.deliveryAddress).address2 ? <><br />{`${(row.shippingAddress || row.deliveryAddress).address2}`}</> : ''}
              <br />{`${(row.shippingAddress || row.deliveryAddress).city}, ${(row.shippingAddress || row.deliveryAddress).state} ${(row.shippingAddress || row.deliveryAddress).zipCode}`}
              <br />{`${(row.shippingAddress || row.deliveryAddress).country}`}
              {(row.shippingAddress || row.deliveryAddress).phoneNumber ? <><br />{`Ph: ${(row.shippingAddress || row.deliveryAddress).phoneNumber}`}</> : ''}
            </>
          ) : "N/A"}
        </TableCell>
        <TableCell align="left">{row.isNew ? "New Order" : "Old Order"}</TableCell>
        <TableCell align="right">{row.paymentMethod}</TableCell>
        <TableCell align="left">
          {row.isPaid ? (
            <FaCheckCircle size={23} color="green" />
          ) : (
            <IoIosCloseCircle size={25} color="red" />
          )}
        </TableCell>
        <TableCell align="right">{row.couponApplied || "-"}</TableCell>
        <TableCell align="right">
          <b>Rs. {(row.totalAmount ?? row.total).toFixed(2)}</b>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={14}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Order for
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>Change Order</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Shipping Informations</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow key={row.user.id}>
                    <TableCell component="th" scope="row">
                      <img
                        src={row.user.image}
                        className={styles.table__img}
                        alt=""
                      />
                    </TableCell>
                    <TableCell>
                      {row.isNew ? (
                        <div className="flex flex-col items-start gap-2">
                          <Typography variant="body2" className="mb-1 text-gray-600">
                            I checked this order, change order to old
                          </Typography>
                          <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                            onClick={() => changeOrdertoOld(row._id)}
                          >
                            <CheckCircle fontSize="small" />
                            Mark as Reviewed
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <CheckCircle fontSize="small" color="success" />
                          <Typography variant="body2">Already reviewed</Typography>
                        </div>
                      )}
                    </TableCell>
                    <TableCell align="left">{row.user.email}</TableCell>
                    <TableCell align="right">
                      {(row.shippingAddress || row.deliveryAddress) ? (
                        <>
                          {`${(row.shippingAddress || row.deliveryAddress).firstName} ${(row.shippingAddress || row.deliveryAddress).lastName}`}<br />
                          {`${(row.shippingAddress || row.deliveryAddress).address1}`}
                          {(row.shippingAddress || row.deliveryAddress).address2 ? <><br />{`${(row.shippingAddress || row.deliveryAddress).address2}`}</> : ''}
                          <br />{`${(row.shippingAddress || row.deliveryAddress).city}, ${(row.shippingAddress || row.deliveryAddress).state} ${(row.shippingAddress || row.deliveryAddress).zipCode}`}
                          <br />{`${(row.shippingAddress || row.deliveryAddress).country}`}
                          {(row.shippingAddress || row.deliveryAddress).phoneNumber ? <><br />{`Ph: ${(row.shippingAddress || row.deliveryAddress).phoneNumber}`}</> : ''}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={14}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Order items
              </Typography>
              <Table size="small" aria-label="purchases">                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle2" fontWeight="bold">Product Status</Typography>
                        <Typography variant="caption" color="text.secondary">(Individual item status)</Typography>
                      </div>
                    </TableCell>
                    <TableCell>Tracking URL</TableCell> 
                    <TableCell>Tracking ID</TableCell> 
                    <TableCell>Product Link</TableCell>
                    <TableCell>View Order</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Check for both products and orderItems arrays */}
                  {((row.products && row.products.length > 0) || (row.orderItems && row.orderItems.length > 0)) ? 
                    // Use products if available, otherwise use orderItems
                    (row.products || row.orderItems).map((p: any) => {
                      // Ensure product ID is available for status updates
                      // Prioritize p._id (line item ID), then p.productId, then p.product._id
                      const productId = p._id?.toString() || p.productId?.toString() || p.product?._id?.toString() || `item-${Math.random()}`;
                      const currentItemStatus = p.status || "Not Processed";

                      return (
                        <TableRow key={productId}>
                          <TableCell component="th" scope="row">
                            <div className="relative inline-block">
                              <img 
                                src={p.product?.images?.[0]?.url || p.image || "/placeholder-image.jpg"} 
                                alt={p.product?.name || p.name || "Product"} 
                                className="w-[100px] h-[100px] object-cover"
                                onError={(e) => {
                                  // Set a fallback image if the product image fails to load
                                  (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
                                }}
                              />
                              {p.vendor && (
                                <div className="absolute top-0 right-0 bg-[#EB4F0C] text-white text-[10px] p-2">
                                  {p.vendor.name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{p.product?.name || p.name || "N/A"}</TableCell>
                          <TableCell align="left">{p.product?.sku || p.sku || "N/A"}</TableCell>
                          <TableCell align="left">{p.product?.brand || p.brand || "N/A"}</TableCell>
                          <TableCell align="left">{p.size || "N/A"}</TableCell>
                          <TableCell align="left">x{p.qty || 1}</TableCell>
                          <TableCell align="left">₹ {((p.qty || p.quantity || 1) * (p.price || 0)).toFixed(2)}</TableCell>

                          <TableCell align="left">
                            <div className="flex flex-col gap-1 items-start" style={{ minWidth: '180px' }}>                              {/* Show indicator when product status differs from order status */}
                              {((row.orderStatus && row.orderStatus !== currentItemStatus) || 
                                (row.status && row.status !== currentItemStatus)) && (
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    color: 'warning.main',
                                    mb: 1,
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff9800', marginRight: '4px' }}></span>
                                  Different from order status
                                </Typography>
                              )}
                              <Select
                                value={currentItemStatus}
                                onChange={(e) => handleChange(e, productId, row._id, p)} // Pass item 'p'
                                disabled={loadingStatus[productId]}
                                fullWidth
                                size="small"
                                displayEmpty
                                sx={{ mb: currentItemStatus === "Confirmed" ? 1 : 0 }}
                              >
                                <MenuItem value="Not Processed">Not Processed</MenuItem>
                                <MenuItem value="Processing">Processing</MenuItem>
                                <MenuItem value="Confirmed">Confirmed</MenuItem>
                                <MenuItem value="Dispatched">Dispatched</MenuItem>
                                <MenuItem value="Delivered">Delivered</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                              </Select>
                              {currentItemStatus === "Confirmed" && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleOpenModal(row._id, productId, currentItemStatus, p.trackingUrl, p.trackingId)}
                                  disabled={loadingStatus[productId]}
                                  sx={{ width: '100%' }}
                                >
                                  {p.trackingUrl || p.trackingId ? "Edit Tracking" : "Add Tracking"}
                                </Button>
                              )}
                              {loadingStatus[productId] && <CircularProgress size={20} sx={{ alignSelf: 'center', mt: 1 }} />}
                            </div>
                          </TableCell>
                          <TableCell align="left">
                            {p.trackingUrl ? (
                              <a 
                                href={p.trackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:underline"
                                style={{ wordBreak: 'break-all' }}
                              >
                                Link
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell align="left" style={{ wordBreak: 'break-all' }}>{p.trackingId || "N/A"}</TableCell>
                          <TableCell align="left">
                            {(p.product?._id || p._id) ? ( // Check if product ID is available
                              <a 
                                href={`/admin/dashboard/product/view/${p.product?._id || p._id}`} // Use product ID
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Product
                              </a>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell align="left">
                            <Link href={`/admin/dashboard/order/view/${row._id}`} passHref>
                              <Button variant="outlined" size="small" startIcon={<IconFileDescription fontSize="small"/>}>
                                View Order
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  : (
                    <TableRow>
                      <TableCell colSpan={11} align="center"> {/* Adjusted colSpan */} 
                        No products found for this order.
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow key={row._id}>
                    <TableCell component="th" scope="row" align="left">
                      TOTAL
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell align="left"></TableCell>
                    <TableCell align="left"></TableCell>
                    <TableCell
                      align="left"
                      style={{ padding: "20px 0 20px 18px" }}
                    >
                      <b style={{ fontSize: "20px" }}>₹ {(row.totalAmount ?? row.total).toFixed(2)}</b>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      {/* REMOVE Snackbar from here */}
      {/* 
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: \'100%\' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar> 
      */}
    </>
  );
}

Row.propTypes = {
  row: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    // ... other prop types for row ...
    user: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string,
      image: PropTypes.string,
    }),
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    status: PropTypes.string,
    paymentStatus: PropTypes.string,
    orderItems: PropTypes.array,
    products: PropTypes.array,
    shippingAddress: PropTypes.oneOfType([
      PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        address1: PropTypes.string,
        address2: PropTypes.string,
        city: PropTypes.string,
        state: PropTypes.string,
        zipCode: PropTypes.string,
        country: PropTypes.string,
        phoneNumber: PropTypes.string,
      }),
      PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        address1: PropTypes.string,
        address2: PropTypes.string,
        city: PropTypes.string,
        state: PropTypes.string,
        zipCode: PropTypes.string,
        country: PropTypes.string,
        phoneNumber: PropTypes.string,
      }),
    ]),
    isNew: PropTypes.bool,
    paymentMethod: PropTypes.string,
    isPaid: PropTypes.bool,
    couponApplied: PropTypes.string,
    total: PropTypes.number,
    totalAmount: PropTypes.number, // Added totalAmount to propTypes
  }).isRequired,
  updateOrderStatus: PropTypes.func.isRequired,
  markOrderAsOld: PropTypes.func.isRequired,
  refreshOrders: PropTypes.func.isRequired,
  showSnackbar: PropTypes.func.isRequired, // Add showSnackbar to propTypes
};

export default function AllOrdersTable({
  rows,
  range,
  setRange,
  isPaid,
  setIsPaid,
  paymentMethod,
  setPaymentMethod,
  updateOrderStatus,
  markOrderAsOld,
  refreshOrders,
}: {
  rows: any[];
  range?: any;
  setRange?: any; // Should be (event: SelectChangeEvent<any>) => void or similar
  isPaid?: any;
  setIsPaid?: any; // Should be (event: SelectChangeEvent<any>) => void or similar
  paymentMethod?: any;
  setPaymentMethod?: any; // Should be (event: SelectChangeEvent<any>) => void or similar
  updateOrderStatus: (orderId: string, productId: string | null, status: string, customMessage?: string, trackingUrl?: string, trackingId?: string) => Promise<any>;
  markOrderAsOld: (orderId: string) => Promise<any>;
  refreshOrders: () => void;
}) {
  const [searchOrderText, setSearchOrderText] = React.useState<string>("");
  const [filteredRowsByText, setFilteredRowsByText] = React.useState<any[]>([]);

  // Add Snackbar state to AllOrdersTable
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  React.useEffect(() => {
    if (searchOrderText.length === 24) {
      const filteredRows = rows?.filter(
        (item) => item._id.toString() === searchOrderText.toString()
      );
      setFilteredRowsByText(filteredRows);
    } else {
      setFilteredRowsByText([]);
    }
  }, [searchOrderText, rows]);

  return (
    <>
      <div className="">
        <h1 className="text-black font-bold text-2xl">
          Total Orders - {rows?.length || 0}
        </h1>
          {/* Information panels */}
        <Box 
          sx={{
            backgroundColor: '#e3f2fd',
            border: '1px solid #bbdefb',
            borderRadius: '4px',
            p: 2,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <div style={{ color: '#1976d2' }}>
            <HelpOutline />
          </div>
          <div>
            <Typography variant="subtitle2" color="primary" fontWeight="bold">
              About Order Status Management
            </Typography>            <Typography variant="body2">
              This dashboard lets you manage statuses at two levels:
              <br />
              <b>1. Order-level status</b>: Changes apply to the entire order, updating:
              <ul style={{ marginTop: '4px', marginBottom: '4px', paddingLeft: '20px' }}>
                <li>Main order status</li>
                <li>Order-specific status</li>
                <li>All individual product statuses</li>
              </ul>
              <b>2. Product-level status</b>: Changes apply only to individual products within an order.
            </Typography>
          </div>
        </Box>
        
        {/* Cancellation Request Info Panel */}
        <Box 
          sx={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeeba',
            borderRadius: '4px',
            p: 2,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <div style={{ color: '#856404' }}>
            <Alert />
          </div>
          <div>
            <Typography variant="subtitle2" color="warning" fontWeight="bold">
              Cancellation Requests
            </Typography>
            <Typography variant="body2">
              Items with customer cancellation requests will be marked with an amber indicator.
              Check order details to view and approve these requests.
            </Typography>
          </div>
        </Box>

        <div className="">
          <div className="flex gap-[10px]">
            <TextField
              id="outlined-basic"
              label="Search Order By ID"
              variant="outlined"
              className="w-[50%] flex justify-center bg-gray-100"
              onChange={(e) => setSearchOrderText(e.target.value)}
            />
            <Select
              label="Order Range"
              value={range}
              onChange={(event) => setRange(event.target.value)} // Corrected onChange
              displayEmpty
              inputProps={{ 'aria-label': 'Without label' }}
            >
              {[
                { value: "all", label: "All Orders" },
                { value: "today", label: "Today" },
                { value: "today_and_yesterday", label: "Today and Yesterday" },
                { value: "2d", label: "Last 2 Days" },
                { value: "7d", label: "Last 7 Days" },
                { value: "15d", label: "Last 15 Days" },
                { value: "30d", label: "Last 30 Days" },
                { value: "2m", label: "Last 2 Months" },
                { value: "5m", label: "Last 5 Months" },
                { value: "10m", label: "Last 10 Months" },
                { value: "12m", label: "Last 12 Months" },
              ].map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              label="Order Payment Status"
              value={isPaid}
              onChange={(event) => setIsPaid(event.target.value)} // Corrected onChange
              displayEmpty
              inputProps={{ 'aria-label': 'Without label' }}
            >
              {[
                { value: "-", label: "Order Payment Status" },
                { value: "paid", label: "Paid" },
                { value: "unPaid", label: "Not Paid" },
              ].map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              label="Order Payment Method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)} // Corrected onChange
              displayEmpty
              inputProps={{ 'aria-label': 'Without label' }}
            >
              {[
                { value: "-", label: "Order Payment Method" },
                { value: "cash", label: "COD" },
                { value: "RazorPay", label: "RazorPay" },
              ].map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </div>
        </div>

        <TableContainer component={Paper}>
          <Typography
            sx={{ flex: "1 1 100%" }}
            variant="h6"
            paddingX="5px"
            id="tableTitle"
            component="div"
          >
            Orders
          </Typography>
          <Table aria-label="collapsible table" className={styles.table}>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Order ID</TableCell>
                <TableCell align="left">User</TableCell>
                <TableCell align="left">Created At</TableCell>
                <TableCell align="left">Updated At</TableCell>
                <TableCell align="left">Order Status</TableCell>
                <TableCell align="left">Payment Status</TableCell>
                <TableCell align="left">Order Items</TableCell>
                <TableCell align="left">Delivery Address</TableCell>
                <TableCell align="left">Is New</TableCell>
                <TableCell align="right">Payment Method</TableCell>
                <TableCell align="left">Paid</TableCell>
                <TableCell align="right">Coupon</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchOrderText.length === 24
                ? filteredRowsByText.map((row: any) => (
                    <Row 
                      key={row._id} 
                      row={row} 
                      updateOrderStatus={updateOrderStatus}
                      markOrderAsOld={markOrderAsOld}
                      refreshOrders={refreshOrders}
                      showSnackbar={showSnackbar} // Pass showSnackbar to Row
                    />
                  ))
                : rows?.map((row: any) => (
                    <Row 
                      key={row._id} 
                      row={row} 
                      updateOrderStatus={updateOrderStatus}
                      markOrderAsOld={markOrderAsOld}
                      refreshOrders={refreshOrders}
                      showSnackbar={showSnackbar} // Pass showSnackbar to Row
                    />
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      {/* Render Snackbar here, outside the Table structure */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
