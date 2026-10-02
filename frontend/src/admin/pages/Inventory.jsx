import { useEffect, useState } from "react";
import { adminApi as api } from "../services/adminApi";
import { AdminDialog, AdminPageFrame } from "./ManagementPageComponents";

function Inventory() {
  const [search, setSearch] = useState("");
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "",
    category: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("items");
  const [laborRates, setLaborRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [editingRateId, setEditingRateId] = useState("");
  const [rateDraft, setRateDraft] = useState("");
  const [isSavingRate, setIsSavingRate] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadInventory = () => {
      setIsLoading(true);
      api
        .getInventory(page, 15)
        .then((response) => {
          if (isMounted) {
            const data = response.data || [];
            setInventoryItems(
              data.map((item) => ({
                ...item,
                id: item._id,
                rawPrice: item.price,
                price: `₱${Number(item.price).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}`,
                stock: item.quantity,
              })),
            );
            setTotalPages(response.pagination?.totalPages || 1);
          }
        })
        .catch((fetchError) => {
          if (isMounted) {
            setError(fetchError.message || "Failed to load inventory");
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    };

    loadInventory();
    const refreshInterval = window.setInterval(loadInventory, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, [page, refreshKey]);

  useEffect(() => {
    let isMounted = true;

    api
      .getServiceLaborRates()
      .then((response) => {
        if (isMounted) setLaborRates(response.rates || []);
      })
      .catch((fetchError) => {
        if (isMounted) {
          setError(fetchError.message || "Failed to load service rates");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingRates(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openItemDialog = (item = null) => {
    setEditingItem(item);
    setIsAdding(!item);
    setForm(
      item
        ? {
            name: item.name,
            price: item.rawPrice,
            quantity: item.stock,
            category: item.category || "",
          }
        : { name: "", price: "", quantity: "", category: "" },
    );
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
      };

      if (editingItem) {
        await api.updateInventory(editingItem.id, payload);
      } else {
        await api.createInventory(payload);
      }

      setEditingItem(null);
      setIsAdding(false);
      setPage(1);
      setRefreshKey((key) => key + 1);
    } catch (saveError) {
      setError(saveError.message || "Failed to save inventory item");
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;

    try {
      await api.deleteInventory(item.id);
      setPage(1);
      setRefreshKey((key) => key + 1);
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete inventory item");
    }
  };

  const saveLaborRate = async (rate) => {
    if (!rateDraft.trim()) {
      setError("Enter a valid non-negative labor fee.");
      return;
    }
    const laborFee = Number(rateDraft);
    if (!Number.isFinite(laborFee) || laborFee < 0) {
      setError("Enter a valid non-negative labor fee.");
      return;
    }

    setIsSavingRate(true);
    setError("");
    try {
      const response = await api.updateServiceLaborRate(rate._id, laborFee);
      setLaborRates((currentRates) =>
        currentRates.map((currentRate) =>
          currentRate._id === rate._id ? response.rate : currentRate,
        ),
      );
      setEditingRateId("");
      setRateDraft("");
    } catch (saveError) {
      setError(saveError.message || "Failed to update service labor fee");
    } finally {
      setIsSavingRate(false);
    }
  };

  const filteredItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredLaborRates = laborRates.filter((rate) =>
    rate.serviceType.toLowerCase().includes(search.toLowerCase()),
  );

  const closeItemDialog = () => {
    setEditingItem(null);
    setIsAdding(false);
  };

  return (
    <AdminPageFrame>
      <section className="section-content active">
        <div className="inventory-container">
          <div
            className="inventory-view-toggle"
            role="tablist"
            aria-label="Inventory sections"
          >
            <button
              id="items-tab"
              className={activeTab === "items" ? "is-active" : ""}
              type="button"
              role="tab"
              aria-selected={activeTab === "items"}
              aria-controls="items-panel"
              onClick={() => setActiveTab("items")}
            >
              Items
            </button>
            <button
              id="services-tab"
              className={activeTab === "services" ? "is-active" : ""}
              type="button"
              role="tab"
              aria-selected={activeTab === "services"}
              aria-controls="services-panel"
              onClick={() => setActiveTab("services")}
            >
              Services
            </button>
          </div>
          {error && (
            <p className="dashboard-error" role="alert">
              {error}
            </p>
          )}
          {activeTab === "items" ? (
            <div id="items-panel" role="tabpanel" aria-labelledby="items-tab">
              <div className="inventory-header">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search items..."
                />
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => openItemDialog()}
                >
                  + ADD
                </button>
              </div>
              <div className="inventory-info">
                {isLoading ? "Loading..." : filteredItems.length} inventory
                items
              </div>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ITEM NAME</th>
                    <th>PRICE</th>
                    <th>STOCK</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="price-text">{item.price}</td>
                      <td
                        className={
                          item.stock < 10 ? "stock-text low" : "stock-text"
                        }
                      >
                        {item.stock}
                      </td>
                      <td>
                        <button
                          className="btn-small btn-edit"
                          type="button"
                          onClick={() => openItemDialog(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-small btn-delete"
                          type="button"
                          onClick={() => removeItem(item)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                className="pagination-container"
                aria-label="Inventory pagination"
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
          ) : (
            <div
              id="services-panel"
              role="tabpanel"
              aria-labelledby="services-tab"
            >
              <div className="inventory-header">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search services..."
                />
              </div>
              <div className="inventory-info">
                {isLoadingRates ? "Loading..." : filteredLaborRates.length}{" "}
                services · default labor fee per completed service
              </div>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>SERVICE</th>
                    <th>DEFAULT LABOR FEE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLaborRates.map((rate) => (
                    <tr key={rate._id}>
                      <td>{rate.serviceType}</td>
                      <td className="price-text">
                        {editingRateId === rate._id ? (
                          <input
                            className="service-fee-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={rateDraft}
                            aria-label={`Default labor fee for ${rate.serviceType}`}
                            onChange={(event) =>
                              setRateDraft(event.target.value)
                            }
                          />
                        ) : (
                          `₱${Number(rate.laborFee).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}`
                        )}
                      </td>
                      <td>
                        {editingRateId === rate._id ? (
                          <>
                            <button
                              className="btn-small btn-edit"
                              type="button"
                              disabled={isSavingRate}
                              onClick={() => saveLaborRate(rate)}
                            >
                              {isSavingRate ? "Saving..." : "Save"}
                            </button>
                            <button
                              className="btn-small"
                              type="button"
                              disabled={isSavingRate}
                              onClick={() => {
                                setEditingRateId("");
                                setRateDraft("");
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-small btn-edit"
                            type="button"
                            onClick={() => {
                              setEditingRateId(rate._id);
                              setRateDraft(String(rate.laborFee));
                            }}
                          >
                            Edit fee
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      {(isAdding || editingItem) && (
        <AdminDialog
          title={editingItem ? "Edit Inventory Item" : "Add Inventory Item"}
          onClose={closeItemDialog}
        >
          <form className="admin-dialog-form" onSubmit={saveItem}>
            <label>
              Item name
              <input
                required
                minLength="3"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
              />
            </label>
            <label>
              Price
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
              />
            </label>
            <label>
              Quantity
              <input
                required
                min="0"
                type="number"
                value={form.quantity}
                onChange={(event) =>
                  setForm({ ...form, quantity: event.target.value })
                }
              />
            </label>
            <label>
              Category
              <input
                required
                value={form.category}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              />
            </label>
            <div className="admin-dialog-actions">
              <button
                className="btn-small"
                type="button"
                onClick={closeItemDialog}
              >
                Cancel
              </button>
              <button className="btn-primary" type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Item"}
              </button>
            </div>
          </form>
        </AdminDialog>
      )}
    </AdminPageFrame>
  );
}

export default Inventory;
