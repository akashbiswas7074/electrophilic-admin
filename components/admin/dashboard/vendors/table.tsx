"use client";
import * as React from "react";
import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { visuallyHidden } from "@mui/utils";
import styles from "./styles.module.css";
import { RiDeleteBin7Fill } from "react-icons/ri";
import { deleteSingleUser } from "@/lib/database/actions/admin/user/user.actions";
import { FaCheckCircle, FaClock, FaUser } from "react-icons/fa";
import { IoMdCloseCircle } from "react-icons/io";
import {
  ChangeVerifyTagForVendor,
  getAllVendors,
} from "@/lib/database/actions/admin/vendor.actions";
import {
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert,
  Badge,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";

function descendingComparator(a: any, b: any, orderBy: any) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}
async function deleteHandler(id: string) {
  try {
    await deleteSingleUser(id)
      .then((res) => alert(res ? res : ""))
      .catch((err) => alert(err));
  } catch (error: any) {
    alert(
      error.message ||
        "An error occurred while deleting vendor and associated products"
    );
  }
}

function getComparator(order: any, orderBy: any) {
  return order === "desc"
    ? (a: any, b: any) => descendingComparator(a, b, orderBy)
    : (a: any, b: any) => -descendingComparator(a, b, orderBy);
}

// This method is created for cross-browser compatibility, if you don't
// need to support IE11, you can use Array.prototype.sort() directly
function stableSort(array: any, comparator: any) {
  const stabilizedThis = array.map((el: any, index: any) => [el, index]);
  stabilizedThis.sort((a: any, b: any) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el: any) => el[0]);
}

const headCells = [
  {
    id: "image",
    numeric: false,
    disablePadding: true,
    label: "Vendor Image",
  },
  {
    id: "name",
    numeric: true,
    disablePadding: false,
    label: "Name",
  },

  {
    id: "email",
    numeric: true,
    disablePadding: false,
    label: "Email",
  },
  {
    id: "phoneNumber",
    numeric: true,
    disablePadding: false,
    label: "Phone Number",
  },
  {
    id: "zipCode",
    numeric: true,
    disablePadding: false,
    label: "Zip Code",
  },
  {
    id: "admin",
    numeric: true,
    disablePadding: false,
    label: "Verified",
  },
  {
    id: "view",
    numeric: true,
    disablePadding: false,
    label: "View",
  },
  {
    id: "delete",
    numeric: true,
    disablePadding: false,
    label: "Delete",
  },
];

function EnhancedTableHead(props: any) {
  const {
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort,
  } = props;
  const createSortHandler = (property: any) => (event: any) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              "aria-label": "select all desserts",
            }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

function EnhancedTableToolbar(props: any) {
  const { numSelected, pendingCount, verifiedCount, totalCount } = props;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(
              theme.palette.primary.main,
              theme.palette.action.activatedOpacity
            ),
        }),
      }}
    >
      <Stack direction="row" spacing={2} sx={{ flex: "1 1 100%" }}>
        {numSelected > 0 ? (
          <Typography color="inherit" variant="subtitle1" component="div">
            {numSelected} selected
          </Typography>
        ) : (
          <>
            <Typography variant="h6" id="tableTitle" component="div">
              Vendor Management
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={`Total: ${totalCount}`}
                color="default"
                size="small"
                icon={<FaUser />}
              />
              <Chip
                label={`Pending: ${pendingCount}`}
                color="warning"
                size="small"
                icon={<FaClock />}
              />
              <Chip
                label={`Verified: ${verifiedCount}`}
                color="success"
                size="small"
                icon={<FaCheckCircle />}
              />
            </Stack>
          </>
        )}
      </Stack>

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

EnhancedTableToolbar.propTypes = {
  numSelected: PropTypes.number.isRequired,
};

export default function EnhancedTableVendors({ rows }: { rows: any }) {
  const router = useRouter();
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("calories");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Enhanced state for better UX
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: "", // 'approve', 'reject', 'delete'
    vendorId: "",
    vendorName: "",
    currentStatus: false,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Calculate statistics
  const pendingCount = rows.filter((row: any) => !row.verified).length;
  const verifiedCount = rows.filter((row: any) => row.verified).length;
  const totalCount = rows.length;

  const handleRequestSort = (event: any, property: any) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleSelectAllClick = (event: any) => {
    if (event.target.checked) {
      const newSelected = rows.map((n: any) => n.name);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event: any, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: any = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (name: any) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const handleVendorStatusChange = async (
    vendorId: string,
    newStatus: boolean,
    vendorName: string
  ) => {
    setConfirmDialog({
      open: true,
      type: newStatus ? "approve" : "reject",
      vendorId,
      vendorName,
      currentStatus: !newStatus,
    });
  };

  const handleConfirmAction = async () => {
    const { type, vendorId, vendorName } = confirmDialog;
    const newStatus = type === "approve";

    setLoading((prev) => ({ ...prev, [vendorId]: true }));

    try {
      // Use the new API endpoint instead of direct database call
      const response = await fetch('/api/vendor/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          status: newStatus,
          message: type === 'reject' ? 'Your application did not meet our current requirements.' : undefined
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSnackbar({
          open: true,
          message: `${vendorName} has been ${newStatus ? "approved" : "rejected"} successfully and notified via email!`,
          severity: "success",
        });

        // Trigger a refresh of the vendors list
        window.location.reload(); // You might want to implement a more elegant refresh
      } else {
        throw new Error(result.message || `Failed to ${newStatus ? "approve" : "reject"} vendor`);
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || `Failed to ${newStatus ? "approve" : "reject"} vendor`,
        severity: "error",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [vendorId]: false }));
      setConfirmDialog({
        open: false,
        type: "",
        vendorId: "",
        vendorName: "",
        currentStatus: false,
      });
    }
  };

  const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
    setConfirmDialog({
      open: true,
      type: "delete",
      vendorId,
      vendorName,
      currentStatus: false,
    });
  };

  const handleConfirmDelete = async () => {
    const { vendorId, vendorName } = confirmDialog;

    setLoading((prev) => ({ ...prev, [vendorId]: true }));

    try {
      await deleteHandler(vendorId);
      setSnackbar({
        open: true,
        message: `${vendorName} has been deleted successfully!`,
        severity: "success",
      });

      // Trigger a refresh
      window.location.reload();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || "Failed to delete vendor",
        severity: "error",
      });
    } finally {
      setLoading((prev) => ({ ...prev, [vendorId]: false }));
      setConfirmDialog({
        open: false,
        type: "",
        vendorId: "",
        vendorName: "",
        currentStatus: false,
      });
    }
  };

  const getActionDialogContent = () => {
    const { type, vendorName } = confirmDialog;

    switch (type) {
      case "approve":
        return {
          title: "Approve Vendor",
          content: `Are you sure you want to approve "${vendorName}"? This will allow them to login and access the vendor dashboard.`,
          confirmText: "Approve",
          confirmColor: "success" as const,
        };
      case "reject":
        return {
          title: "Reject Vendor",
          content: `Are you sure you want to reject "${vendorName}"? This will prevent them from logging in until approved.`,
          confirmText: "Reject",
          confirmColor: "warning" as const,
        };
      case "delete":
        return {
          title: "Delete Vendor",
          content: `Are you sure you want to permanently delete "${vendorName}"? This action cannot be undone and will also delete all associated products.`,
          confirmText: "Delete",
          confirmColor: "error" as const,
        };
      default:
        return {
          title: "",
          content: "",
          confirmText: "Confirm",
          confirmColor: "primary" as const,
        };
    }
  };

  const dialogContent = getActionDialogContent();

  const handleViewVendor = (e: React.MouseEvent, vendorId: string) => {
    e.stopPropagation();
    router.push(`/admin/dashboard/vendors/view/${vendorId}`);
  };

  return (
    <>
      <div className="">
        <h1 className="text-black font-bold text-2xl mb-4">
          Vendor Management Dashboard
        </h1>
        <Box sx={{ width: "100%" }}>
          <Paper sx={{ width: "100%", mb: 2 }}>
            <EnhancedTableToolbar
              numSelected={selected.length}
              pendingCount={pendingCount}
              verifiedCount={verifiedCount}
              totalCount={totalCount}
            />

            <TableContainer>
              <Table
                sx={{ minWidth: 750 }}
                aria-labelledby="tableTitle"
                size={dense ? "small" : "medium"}
                className={styles.table}
              >
                <EnhancedTableHead
                  numSelected={selected.length}
                  order={order}
                  orderBy={orderBy}
                  onSelectAllClick={handleSelectAllClick}
                  onRequestSort={handleRequestSort}
                  rowCount={rows.length}
                />
                <TableBody>
                  {stableSort(rows, getComparator(order, orderBy))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row: any, index: any) => {
                      const isItemSelected = isSelected(row.name);
                      const labelId = `enhanced-table-checkbox-${index}`;
                      const isLoading = loading[row._id];

                      return (
                        <TableRow
                          hover
                          onClick={(event) => handleClick(event, row.name)}
                          role="checkbox"
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          key={row.name}
                          selected={isItemSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              inputProps={{
                                "aria-labelledby": labelId,
                              }}
                            />
                          </TableCell>
                          <TableCell
                            component="th"
                            id={labelId}
                            scope="row"
                            padding="none"
                            style={{ paddingTop: "5px" }}
                          >
                            <img
                              src={row.image || "/default-vendor-avatar.png"}
                              alt={`${row.name} avatar`}
                              className={styles.table__img}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="column" spacing={0.5}>
                              <Typography variant="body2" fontWeight="medium">
                                {row.name}
                              </Typography>
                              <Chip
                                label={row.verified ? "Verified" : "Pending"}
                                size="small"
                                color={row.verified ? "success" : "warning"}
                                variant={
                                  row.verified ? "filled" : "outlined"
                                }
                              />
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{row.email}</TableCell>
                          <TableCell align="right">{row.phoneNumber}</TableCell>
                          <TableCell align="right">{row.zipCode}</TableCell>

                          <TableCell align="right">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="flex-end"
                            >
                              {isLoading ? (
                                <CircularProgress size={24} />
                              ) : (
                                <>
                                  {row.verified ? (
                                    <Tooltip title="Click to reject this vendor">
                                      <IconButton
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVendorStatusChange(
                                            row._id,
                                            false,
                                            row.name
                                          );
                                        }}
                                        color="success"
                                      >
                                        <FaCheckCircle size={24} />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    <Tooltip title="Click to approve this vendor">
                                      <IconButton
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleVendorStatusChange(
                                            row._id,
                                            true,
                                            row.name
                                          );
                                        }}
                                        color="warning"
                                      >
                                        <IoMdCloseCircle size={24} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </>
                              )}
                            </Stack>
                          </TableCell>

                          <TableCell align="right">
                            <Tooltip title="View vendor details">
                              <IconButton
                                onClick={(e) => handleViewVendor(e, row._id)}
                                color="primary"
                                disabled={isLoading}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>

                          <TableCell align="right">
                            <Tooltip title="Delete vendor">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVendor(row._id, row.name);
                                }}
                                color="error"
                                disabled={isLoading}
                              >
                                <RiDeleteBin7Fill />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {emptyRows > 0 && (
                    <TableRow
                      style={{
                        height: (dense ? 33 : 53) * emptyRows,
                      }}
                    >
                      <TableCell colSpan={8} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() =>
          setConfirmDialog({
            open: false,
            type: "",
            vendorId: "",
            vendorName: "",
            currentStatus: false,
          })
        }
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{dialogContent.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogContent.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog({
                open: false,
                type: "",
                vendorId: "",
                vendorName: "",
                currentStatus: false,
              })
            }
          >
            Cancel
          </Button>
          <Button
            onClick={
              confirmDialog.type === "delete"
                ? handleConfirmDelete
                : handleConfirmAction
            }
            color={dialogContent.confirmColor}
            variant="contained"
            autoFocus
          >
            {dialogContent.confirmText}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
