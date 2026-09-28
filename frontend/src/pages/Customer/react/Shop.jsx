import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import heroImage from '../../../assets/hero.png';
import Header from '../../../components/Header';
import { CustomerPage } from './CustomerLayout';
import '../styles/shop.css';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingId, setAddingId] = useState('');
  const pageSize = 10;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.getProducts(currentPage, pageSize).then((productResponse) => {
      if (!isMounted) return;
      setProducts(productResponse.products || productResponse.data || []);
      setTotalProducts(productResponse.pagination?.total ?? productResponse.count ?? 0);
      setPageCount(productResponse.pagination?.pages || 1);
    }).catch((requestError) => {
      if (isMounted) setError(requestError.message || 'Products could not be loaded.');
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, [currentPage]);

  useEffect(() => {
    let isMounted = true;
    api.getCart().catch(() => ({ cart: { items: [] } })).then((cartResponse) => {
      if (isMounted) setCartCount((cartResponse.cart?.items || []).reduce((total, item) => total + item.quantity, 0));
    });
    return () => { isMounted = false; };
  }, []);

  const categories = ['All', 'Motorcycle Parts', 'Engine Parts', 'Accessories'];
  const categoryTiles = categories.filter((item) => item !== 'All');

  const normalizeCategoryValue = (value = '') => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
  const productMatchesCategory = (productCategory, selectedCategory) => {
    if (selectedCategory === 'All') return true;
    const targetValue = normalizeCategoryValue(selectedCategory);
    const productValue = normalizeCategoryValue(productCategory);
    return productValue === targetValue || productValue.includes(targetValue) || targetValue.includes(productValue);
  };

  const visibleProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();
    return (!query || (product.name || '').toLowerCase().includes(query)) && productMatchesCategory(product.category, category);
  });

  const addProduct = async (product) => {
    setAddingId(product._id);
    setError('');
    try {
      const response = await api.addToCart(product._id);
      setCartCount((response.cart?.items || []).reduce((total, item) => total + item.quantity, 0));
    } catch (requestError) {
      setError(requestError.message || 'Please sign in before adding items to your cart.');
    } finally {
      setAddingId('');
    }
  };

  return <>
    <Header title="Motorcycle Shop" />
    <CustomerPage title="Motorcycle Shop" description="Browse available parts and accessories." includeHeader={false}>
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
      <div className="shop-toolbar"><input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search parts, accessories..." aria-label="Search products" /><select value={category} onChange={(event) => { setCategory(event.target.value); setCurrentPage(1); }} aria-label="Filter by category"><option value="All">Default</option>{categories.filter((item) => item !== 'All').map((item) => <option key={item} value={item}>{item}</option>)}</select><Link className="cart-link" to="/customer/cart">Cart ({cartCount})</Link></div>
      {error && <p className="customer-error" role="alert">{error}</p>}
      {isLoading ? <p>Loading products...</p> : <div className="product-grid">{visibleProducts.map((product) => <article className="product-card" key={product._id}><div className="product-image">{product.image ? <img src={product.image} alt={product.name} /> : <span>{product.category || 'Parts'}</span>}<span className="product-badge">{product.category || 'Parts'}</span></div><div className="product-card-body"><h2>{product.name}</h2><p>Quality motorcycle parts and accessories for your ride.</p><p className="product-price">₱{Number(product.price).toLocaleString('en-PH', { minimumFractionDigits: 0 })}</p><p className={product.quantity > 0 ? 'product-stock' : 'product-stock out-of-stock'}>{product.quantity > 0 ? `${product.quantity} left` : 'Out of stock'}</p><button type="button" disabled={!product.quantity || addingId === product._id} onClick={() => addProduct(product)}>{addingId === product._id ? 'Adding...' : 'Add to cart'}</button></div></article>)}</div>}
      {!isLoading && !visibleProducts.length && <p className="customer-empty">No products match your search.</p>}
      {!isLoading && pageCount > 1 && <div className="service-pagination" aria-label="Product pages">{Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => <button type="button" className={page === currentPage ? 'active' : ''} key={page} onClick={() => setCurrentPage(page)}>{page}</button>)}</div>}
    </CustomerPage>
  </>;
}
