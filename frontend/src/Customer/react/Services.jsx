import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CustomerPage } from "./CustomerLayout";
import { serviceCatalog, serviceCategories } from "./serviceData";
import "../styles/services.css";

export default function Services() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

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
            <span>{serviceCatalog.length} Services</span>
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
          {serviceCategories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}{" "}
              <small>
                {item === "All"
                  ? serviceCatalog.length
                  : serviceCatalog.filter(
                      (service) => service.category === item,
                    ).length}
              </small>
            </button>
          ))}
        </div>
      </div>

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
                <Link to={`/customer/services/${service.id}`} className="service-book-link">Book service</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visibleServices.length && (
        <p className="customer-empty">No services match your search.</p>
      )}

    </CustomerPage>
  );
}
