import { useEffect, useState } from "react";
import { adminApi as api } from "../services/adminApi";
import { AdminDialog, AdminPageFrame } from "./ManagementPageComponents";

function formatBusinessRecord(record) {
  return {
    ...record,
    id: record._id,
    customer: record.customer || "Unknown",
    date: new Date(record.completedAt || record.createdAt).toLocaleDateString(
      "en-PH",
    ),
    items: record.itemName || "N/A",
    amount: Number(record.amount || 0),
    status: record.status || "completed",
    mechanic:
      record.mechanicName ||
      (record.recordType === "service" ? "Unassigned" : "N/A"),
    recordLabel: record.recordType === "service" ? "Service" : "Product",
  };
}

function Transactions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [statusBeingSaved, setStatusBeingSaved] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;

    const loadTransactions = () => {
      setIsLoading(true);
      api
        .getBusinessRecords(
          statusFilter === "All" ? {} : { status: statusFilter },
        )
        .then((response) => {
          if (isMounted) {
            const data = (response.data || []).map(formatBusinessRecord);
            const pageCount = Math.max(1, Math.ceil(data.length / 10));
            setTransactions(data);
            setTotalAmount(
              data.reduce((sum, record) => sum + record.amount, 0),
            );
            setTotalPages(pageCount);
            if (page > pageCount) setPage(pageCount);
          }
        })
        .catch((fetchError) => {
          if (isMounted) {
            setError(fetchError.message || "Failed to load transactions");
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    };

    loadTransactions();
    const refreshInterval = window.setInterval(loadTransactions, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, [page, statusFilter, refreshKey]);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = `${transaction.customer} ${transaction.items}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pagedTransactions = filteredTransactions.slice(
    (page - 1) * 10,
    page * 10,
  );

  const viewTransaction = async (transaction) => {
    if (transaction.recordType !== "product") {
      setSelectedTransaction(transaction);
      return;
    }

    try {
      const response = await api.getTransaction(transaction.sourceId);
      setSelectedTransaction(response.data || transaction);
    } catch (detailError) {
      setError(detailError.message || "Failed to load transaction details");
    }
  };

  const updateTransactionStatus = async (status) => {
    if (!selectedTransaction) return;

    setStatusBeingSaved(true);
    try {
      const response = await api.updateTransaction(
        selectedTransaction._id || selectedTransaction.id,
        { status },
      );
      setSelectedTransaction(
        response.data || { ...selectedTransaction, status },
      );
      setRefreshKey((key) => key + 1);
    } catch (updateError) {
      setError(updateError.message || "Failed to update transaction status");
    } finally {
      setStatusBeingSaved(false);
    }
  };

  return (
    <AdminPageFrame>
      <section className="section-content active">
        <div className="transactions-container">
          {error && (
            <p className="dashboard-error" role="alert">
              {error}
            </p>
          )}
          <div className="transactions-header">
            <div className="transactions-info">
              Total: ₱
              {Number(totalAmount).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="search-filter">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer, item, mechanic..."
            />
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="All">All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="Paid">Legacy Paid</option>
            </select>
          </div>
          {isLoading ? (
            <p>Loading transactions...</p>
          ) : (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>RECORD ID</th>
                  <th>DATE</th>
                  <th>TYPE</th>
                  <th>CUSTOMER</th>
                  <th>ITEM / SERVICE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>MECHANIC</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {pagedTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.id}</td>
                    <td>{transaction.date}</td>
                    <td>{transaction.recordLabel}</td>
                    <td>
                      <strong>{transaction.customer}</strong>
                    </td>
                    <td>{transaction.items}</td>
                    <td className="price-text">
                      ₱
                      {transaction.amount.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${transaction.status.toLowerCase()}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td>{transaction.mechanic}</td>
                    <td>
                      <button
                        className="btn-small btn-edit"
                        type="button"
                        onClick={() => viewTransaction(transaction)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div
            className="pagination-container"
            aria-label="Transaction pagination"
          >
            <button
              className={`pagination-button${page === 1 ? " disabled" : ""}`}
              type="button"
              disabled={page === 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
            >
              Previous
            </button>
            <span className="pagination-page">
              Page {page} of {totalPages}
            </span>
            <button
              className={`pagination-button${page >= totalPages ? " disabled" : ""}`}
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
      {selectedTransaction && (
        <AdminDialog
          title="Transaction Details"
          onClose={() => setSelectedTransaction(null)}
        >
          <div className="transaction-details">
            <p>
              <strong>Record ID:</strong>{" "}
              {selectedTransaction._id || selectedTransaction.id}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(
                selectedTransaction.completedAt ||
                  selectedTransaction.createdAt,
              ).toLocaleString("en-PH")}
            </p>
            <p>
              <strong>Customer:</strong>{" "}
              {selectedTransaction.userId?.name ||
                selectedTransaction.customer ||
                "Unknown"}
            </p>
            {selectedTransaction.recordType === "service" ? (
              <p>
                <strong>Status:</strong>{" "}
                {selectedTransaction.status || "completed"}
              </p>
            ) : (
              <label>
                <strong>Status:</strong>
                <select
                  value={selectedTransaction.status || "pending"}
                  disabled={statusBeingSaved}
                  onChange={(event) =>
                    updateTransactionStatus(event.target.value)
                  }
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="Paid">Legacy Paid</option>
                </select>
              </label>
            )}
            <p>
              <strong>Total:</strong> ₱
              {Number(
                selectedTransaction.amount ??
                  selectedTransaction.totalPrice ??
                  selectedTransaction.totalAmount ??
                  0,
              ).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
            <p>
              <strong>Items:</strong>{" "}
              {Array.isArray(selectedTransaction.items)
                ? selectedTransaction.items
                    .map(
                      (item) =>
                        item.name ||
                        item.productName ||
                        item.productId?.name ||
                        "Item",
                    )
                    .join(", ")
                : selectedTransaction.itemName ||
                  selectedTransaction.items ||
                  "N/A"}
            </p>
          </div>
        </AdminDialog>
      )}
    </AdminPageFrame>
  );
}

export default Transactions;
