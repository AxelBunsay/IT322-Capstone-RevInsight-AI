import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../../assets/hero.png';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import { customerProducts, productCategories } from './customerData';
import '../styles/shop.css';

export default function Shop() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const { cart, addCartItem } = useCustomerPrototype();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const visibleProducts = useMemo(() => customerProducts.filter((product) => {
    const query = search.trim().toLowerCase();
    return (category === 'All' || product.category === category)
      && (!query || `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query));
  }).sort((left, right) => sort === 'price-low'
    ? left.price - right.price
    : sort === 'price-high'
      ? right.price - left.price
      : left.name.localeCompare(right.name)), [category, search, sort]);

  return <>
    <CustomerPage title="Motorcycle Shop" description="Browse available parts and accessories.">
      <section className="shop-market-hero" style={{ '--shop-hero-image': `url(${heroImage})` }} aria-label="Shop introduction">
        <div className="shop-promo-primary"><p>MANOY&apos;S MOTORCYCLE PARTS, ACCESSORIES &amp; SERVICES</p><h2>Everything your ride needs.</h2>
        <span>Quality parts, trusted accessories, and expert service in one place.</span>
        <Link to="/customer/services">Explore services</Link>
        </div>
        <div className="shop-promo-stack"><div>
          <strong>Ride-ready essentials</strong>
          <span>Parts selected for everyday maintenance.</span>
          </div>
          <div>
            <strong>Expert service support</strong><span>Book a mechanic when you need one.</span>
            </div>
            </div>
      </section>
      <div className="shop-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search parts, accessories..." aria-label="Search products" /><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="featured">Sort: Featured</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option><option value="name">Name</option></select><Link className="cart-link" to="/customer/cart">Cart ({cartCount})</Link></div>
      <div className="customer-product-categories" role="group" aria-label="Product categories">
        {productCategories.map((item) => <button type="button" className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}<small>{item === 'All' ? customerProducts.length : customerProducts.filter((product) => product.category === item).length}</small></button>)}
      </div>
      <div className="customer-product-results"><h2>{category === 'All' ? 'All products' : category}</h2><span>{visibleProducts.length} items</span></div>
      <div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product._id}>
        <div className={`product-image product-tone-${productCategories.indexOf(product.category)}`}>
          <Link to={`/customer/products/${product._id}`} className="product-image-link" aria-label={`View ${product.name}`}><span aria-hidden="true">{product.icon}</span></Link>
          <span className="product-badge">{product.category}</span>
          {product.quantity === 0 && <span className="product-stock-badge">Out of stock</span>}
          {product.quantity > 0 && product.quantity <= 3 && <span className="product-stock-badge is-low">Only {product.quantity} left</span>}
        </div>
        <div className="product-card-body"><Link className="product-title-link" to={`/customer/products/${product._id}`}><h2>{product.name}</h2></Link><p>{product.description}</p><p className="product-price">₱{product.price.toLocaleString('en-PH')}</p><p className={product.quantity > 0 ? 'product-stock' : 'product-stock out-of-stock'}>{product.quantity > 0 ? `${product.quantity} in stock` : 'Currently unavailable'}</p><button type="button" disabled={!product.quantity} onClick={() => addCartItem({ kind: 'product', id: product._id, name: product.name, price: product.price, stock: product.quantity, category: product.category, icon: product.icon })}>Add to cart</button></div>
      </article>)}</div>
      {!visibleProducts.length && <p className="customer-empty">No products match your search.</p>}
    </CustomerPage>
  </>;
}
