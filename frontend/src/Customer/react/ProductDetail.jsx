import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CustomerPage } from './CustomerLayout';
import { useCustomerPrototype } from './useCustomerPrototype';
import { customerProducts } from './customerData';
import '../styles/customer-flow.css';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, addCartItem } = useCustomerPrototype();
  const [quantity, setQuantity] = useState(1);
  const product = customerProducts.find((item) => item._id === productId);

  if (!product) return <CustomerPage title="Product unavailable" description="This item could not be found."><Link to="/customer/shop">Back to Shop</Link></CustomerPage>;

  const related = customerProducts.filter((item) => item.category === product.category && item._id !== product._id).slice(0, 3);
  const addProduct = (goToCart = false) => {
    addCartItem({ kind: 'product', id: product._id, name: product.name, price: product.price, stock: product.quantity, category: product.category, icon: product.icon, quantity });
    if (goToCart) navigate('/customer/cart', { state: { message: `${product.name} added to your cart.` } });
  };

  return <CustomerPage title={product.name} description="Product details and availability.">
    <div className="customer-flow-page">
      <nav className="customer-breadcrumbs" aria-label="Breadcrumb"><Link to="/customer/shop">Shop</Link><span>/</span><span>{product.category}</span><span>/</span><span>{product.name}</span></nav>
      <section className="customer-detail-layout">
        <div className={`customer-detail-art product-tone-${product.category}`} aria-label={`${product.name} product image`}><span aria-hidden="true">{product.icon}</span><small>{product.category}</small></div>
        <div className="customer-detail-copy">
          <p className="customer-eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <strong className="customer-detail-price">₱{product.price.toLocaleString('en-PH')}</strong>
          <p className={product.quantity > 0 ? 'customer-stock' : 'customer-stock is-out'}>{product.quantity > 0 ? `${product.quantity} available` : 'Currently out of stock'}</p>
          {product.quantity > 0 && <>
            <div className="customer-quantity-control"><span>Quantity</span><div><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><output>{quantity}</output><button type="button" aria-label="Increase quantity" disabled={quantity >= product.quantity} onClick={() => setQuantity((value) => Math.min(product.quantity, value + 1))}>+</button></div></div>
            <div className="customer-detail-actions"><button type="button" className="customer-primary-button" onClick={() => addProduct()}>Add to cart</button><button type="button" className="customer-secondary-button" onClick={() => addProduct(true)}>Buy now</button></div>
          </>}
          <button type="button" className={`customer-wishlist-action${wishlist.includes(product._id) ? ' is-saved' : ''}`} aria-pressed={wishlist.includes(product._id)} onClick={() => toggleWishlist(product._id)}>{wishlist.includes(product._id) ? '♥ Saved to wishlist' : '♡ Save to wishlist'}</button>
        </div>
      </section>
      {!!related.length && <section className="customer-related-section"><div className="customer-flow-section-heading"><h2>Related products</h2><Link to="/customer/shop">View all</Link></div><div className="customer-related-grid">{related.map((item) => <Link className="customer-related-product" to={`/customer/products/${item._id}`} key={item._id}><span aria-hidden="true">{item.icon}</span><strong>{item.name}</strong><small>₱{item.price.toLocaleString('en-PH')}</small></Link>)}</div></section>}
    </div>
  </CustomerPage>;
}