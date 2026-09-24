import { useMemo, useState } from "react";
import { api } from "../../../services/api";
import { CustomerPage } from "./CustomerLayout";
import "../styles/services.css";

const serviceCatalog = [
  {
    id: "SVC-01",
    name: "Foam Seat Repair",
    category: "Seat Works",
    duration: "1–2 hrs",
    description: "Repair worn-out or damaged foam for a more comfortable ride.",
    price: 850,
    tone: "sun",
    icon: "✂",
  },
  {
    id: "SVC-02",
    name: "Flat/Semi Seat Customization",
    category: "Seat Works",
    duration: "2–4 hrs",
    description:
      "Tailored seat fabrication with your choice of finish and shape.",
    price: 1800,
    tone: "lavender",
    icon: "✂",
  },
  {
    id: "SVC-03",
    name: "Indo Seat Customization",
    category: "Seat Works",
    duration: "3–6 hrs",
    description: "Premium leatherette seat customization for a refined finish.",
    price: 2500,
    tone: "mint",
    icon: "☆",
  },
  {
    id: "SVC-04",
    name: "Engine Tune-up",
    category: "Engine",
    duration: "1–2 hrs",
    description:
      "Restore smooth performance with a complete engine inspection.",
    price: 1200,
    tone: "peach",
    icon: "⚙",
  },
  {
    id: "SVC-05",
    name: "Oil Change",
    category: "Engine",
    duration: "30–45 min",
    description: "Keep your engine healthy with fresh oil and a quick check.",
    price: 450,
    tone: "blue",
    icon: "◉",
  },
  {
    id: "SVC-06",
    name: "Brake Adjustment",
    category: "Brakes & Drive",
    duration: "1–2 hrs",
    description: "Improve stopping confidence with careful brake adjustment.",
    price: 700,
    tone: "rose",
    icon: "◈",
  },
  {
    id: "SVC-07",
    name: "Chain & Sprocket Service",
    category: "Brakes & Drive",
    duration: "1–2 hrs",
    description: "Clean, adjust, and inspect your final drive system.",
    price: 900,
    tone: "sand",
    icon: "⛓",
  },
  {
    id: "SVC-08",
    name: "Suspension Check",
    category: "Suspension",
    duration: "1–2 hrs",
    description: "Check suspension components for a steadier, safer ride.",
    price: 800,
    tone: "sky",
    icon: "↕",
  },
  {
    id: "SVC-09",
    name: "Electrical Diagnostics",
    category: "Electrical",
    duration: "1–3 hrs",
    description: "Find charging, lighting, and starting system issues.",
    price: 1000,
    tone: "lemon",
    icon: "⚡",
  },
  {
    id: "SVC-10",
    name: "Full Motorcycle Inspection",
    category: "Inspection",
    duration: "2–3 hrs",
    description: "A practical checkup covering your motorcycle’s key systems.",
    price: 650,
    tone: "slate",
    icon: "✓",
  },
];

const categories = [
  "All",
  "Seat Works",
  "Engine",
  "Brakes & Drive",
  "Suspension",
  "Electrical",
  "Inspection",
];

export default function Services() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedService, setSelectedService] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [form, setForm] = useState({
    description: "",
    mechanicId: "",
    scheduledDate: "",
  });
  const [isLoadingMechanics, setIsLoadingMechanics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const visibleServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return serviceCatalog.filter((service) => {
      const matchesCategory =
        category === "All" || service.category === category;
      const matchesSearch =
        !query ||
        `${service.name} ${service.description} ${service.category}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const openBooking = async (service) => {
    setSelectedService(service);
    setForm({
      description: `Please book ${service.name}.`,
      mechanicId: "",
      scheduledDate: "",
    });
    setMessage({ type: "", text: "" });
    setIsLoadingMechanics(true);
    try {
      const response = await api.getAvailableMechanics();
      setMechanics(response.mechanics || []);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Please sign in to book a service.",
      });
    } finally {
      setIsLoadingMechanics(false);
    }
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      await api.createServiceRequest({
        serviceType: selectedService.name,
        description: form.description,
        mechanicId: form.mechanicId,
        estimatedPrice: selectedService.price,
        scheduledDate: form.scheduledDate || undefined,
      });
      setMessage({
        type: "success",
        text: "Service request sent. We will confirm your booking shortly.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Service request could not be sent.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerPage
      title="Motorcycle Services"
      description="Book expert care for your motorcycle."
    >
      <section
        className="services-hero"
        aria-label="Mechanic services introduction"
      >
        <div>
          <p className="services-hero-eyebrow">
            MANOY&apos;S MOTORCYCLE PARTS, ACCESSORIES &amp; SERVICES
          </p>
          <h2>
            Mechanic Services <span aria-hidden="true">🔧</span>
          </h2>
          <p>
            Book a service by adding it to your cart. Our skilled mechanics will
            handle the rest.
          </p>
          <div className="services-hero-stats">
            <span>29 Services</span>
            <span>Expert Mechanics</span>
            <span>Quality Guaranteed</span>
          </div>
        </div>
        <div className="services-hero-wheel" aria-hidden="true">
          ◉
        </div>
      </section>

      <div className="services-toolbar">
        <label className="services-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search services..."
            aria-label="Search services"
          />
        </label>
        <div
          className="service-category-pills"
          role="tablist"
          aria-label="Service categories"
        >
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}{" "}
              <small>
                {item === "All"
                  ? 29
                  : serviceCatalog.filter(
                      (service) => service.category === item,
                    ).length}
              </small>
            </button>
          ))}
        </div>
      </div>

      {message.type === "error" && !selectedService && (
        <p className="customer-error" role="alert">
          {message.text}
        </p>
      )}
      <div className="service-card-grid">
        {visibleServices.map((service) => (
          <article
            className={`service-card tone-${service.tone}`}
            key={service.id}
          >
            <div className="service-card-art">
              <span className="service-code"># {service.id}</span>
              <span className="service-duration">◷ {service.duration}</span>
              <div className="service-icon">{service.icon}</div>
            </div>
            <div className="service-card-body">
              <p className="service-category-label">{service.category}</p>
              <h2>{service.name}</h2>
              <p>{service.description}</p>
              <div className="service-card-footer">
                <strong>₱{service.price.toLocaleString("en-PH")}</strong>
                <button type="button" onClick={() => openBooking(service)}>
                  Book service
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visibleServices.length && (
        <p className="customer-empty">No services match your search.</p>
      )}

      {selectedService && (
        <div
          className="service-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedService(null);
          }}
        >
          <section
            className="service-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
          >
            <button
              className="service-modal-close"
              type="button"
              onClick={() => setSelectedService(null)}
              aria-label="Close booking form"
            >
              ×
            </button>
            <p className="service-category-label">BOOK A SERVICE</p>
            <h2 id="booking-title">{selectedService.name}</h2>
            <p className="service-modal-price">
              Estimated price: ₱{selectedService.price.toLocaleString("en-PH")}
            </p>
            {message.text && (
              <p
                className={
                  message.type === "error"
                    ? "customer-error"
                    : "customer-success"
                }
                role="alert"
              >
                {message.text}
              </p>
            )}
            {message.type !== "success" && (
              <form onSubmit={submitBooking} className="service-booking-form">
                <label>
                  Describe what you need
                  <textarea
                    required
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    rows="3"
                  />
                </label>
                <label>
                  Choose a mechanic
                  <select
                    required
                    value={form.mechanicId}
                    onChange={(event) =>
                      setForm({ ...form, mechanicId: event.target.value })
                    }
                    disabled={isLoadingMechanics}
                  >
                    <option value="">
                      {isLoadingMechanics
                        ? "Loading mechanics..."
                        : "Select an available mechanic"}
                    </option>
                    {mechanics.map((mechanic) => (
                      <option key={mechanic._id} value={mechanic._id}>
                        {mechanic.firstName} {mechanic.lastName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Preferred date{" "}
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={form.scheduledDate}
                    onChange={(event) =>
                      setForm({ ...form, scheduledDate: event.target.value })
                    }
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingMechanics}
                >
                  {isSubmitting ? "Sending request..." : "Send booking request"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </CustomerPage>
  );
}
