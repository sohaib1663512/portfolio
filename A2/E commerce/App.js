import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Image, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dummy data for orders and notifications (API doesn't provide these)
const orders = [
  { id: '1', items: ['Gold Smartwatch'], total: 499.99, date: '2023-10-01', status: 'Delivered' },
  { id: '2', items: ['Designer Handbag'], total: 899.99, date: '2023-10-05', status: 'Pending' },
];

const notifications = [
  { id: '1', title: 'Order Delivered', message: 'Your item has been delivered.', timestamp: '2 hours ago' },
  { id: '2', title: 'Exclusive Offer', message: 'Get 20% off on selected items.', timestamp: '1 day ago' },
];

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch data from FakeStoreAPI
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productResponse = await fetch('https://fakestoreapi.com/products');
        const productData = await productResponse.json();
        setProducts(productData);

        // Fetch categories
        const categoryResponse = await fetch('https://fakestoreapi.com/products/categories');
        const categoryData = await categoryResponse.json();
        // Map categories to include images (FakeStoreAPI doesn't provide images for categories, so we'll use placeholders)
        const mappedCategories = categoryData.map((cat, index) => ({
          id: `${index + 1}`,
          name: cat,
          image: `https://via.placeholder.com/150?text=${cat}`, // Placeholder image
        }));
        setCategories(mappedCategories);

        // Load cart from AsyncStorage
        const storedCart = await AsyncStorage.getItem('cart');
        if (storedCart) setCart(JSON.parse(storedCart));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to load data from server');
      }
    };
    fetchData();
  }, []);

  const addToCart = async (product) => {
    const updatedCart = [...cart, product];
    setCart(updatedCart);
    await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    Alert.alert('Added to Cart', `${product.title} has been added to your cart.`);
  };

  const removeFromCart = async (product) => {
    const updatedCart = cart.filter((item) => item.id !== product.id);
    setCart(updatedCart);
    await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const renderPage = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} products={products} categories={categories} setSelectedProduct={setSelectedProduct} />;
      case 'categories':
        return <CategoriesPage setCurrentPage={setCurrentPage} categories={categories} setSelectedProduct={setSelectedProduct} />;
      case 'productDetail':
        return <ProductDetailPage product={selectedProduct} addToCart={addToCart} />;
      case 'cart':
        return <CartPage cart={cart} removeFromCart={removeFromCart} setCurrentPage={setCurrentPage} />;
      case 'checkout':
        return <CheckoutPage setCurrentPage={setCurrentPage} />;
      case 'orderHistory':
        return <OrderHistoryPage setCurrentPage={setCurrentPage} />;
      case 'notifications':
        return <NotificationsPage setCurrentPage={setCurrentPage} />;
      case 'settings':
        return <SettingsPage setCurrentPage={setCurrentPage} />;
      case 'profile':
        return <ProfilePage setCurrentPage={setCurrentPage} />;
      default:
        return <HomePage setCurrentPage={setCurrentPage} products={products} categories={categories} setSelectedProduct={setSelectedProduct} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderPage()}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setCurrentPage('home')}>
          <Icon name="home" size={24} color={currentPage === 'home' ? '#FFD700' : '#888'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('categories')}>
          <Icon name="th-large" size={24} color={currentPage === 'categories' ? '#FFD700' : '#888'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('cart')}>
          <Icon name="shopping-cart" size={24} color={currentPage === 'cart' ? '#FFD700' : '#888'} />
          {cart.length > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cart.length}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentPage('profile')}>
          <Icon name="user" size={24} color={currentPage === 'profile' ? '#FFD700' : '#888'} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Home Page Component
const HomePage = ({ setCurrentPage, products, categories, setSelectedProduct }) => {
  return (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Ahmed E-Commerce</Text>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#888" />
        <TextInput placeholder="Search for Luxury Products" style={styles.searchInput} />
      </View>
      <Text style={styles.sectionTitle}>Featured Products</Text>
      <FlatList
        horizontal
        data={products}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.featuredProductCard} onPress={() => { setSelectedProduct(item); setCurrentPage('productDetail'); }}>
            <Image source={{ uri: item.image }} style={styles.featuredProductImage} />
            <Text style={styles.featuredProductName}>{item.title}</Text>
            <Text style={styles.featuredProductPrice}>${item.price.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        data={categories}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryCard} onPress={() => setCurrentPage('categories')}>
            <Image source={{ uri: item.image }} style={styles.categoryImage} />
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </ScrollView>
  );
};

// Categories Page Component
const CategoriesPage = ({ setCurrentPage, categories, setSelectedProduct }) => {
  return (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Categories</Text>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryCard} onPress={() => setCurrentPage('productDetail')}>
            <Image source={{ uri: item.image }} style={styles.categoryImage} />
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
    </ScrollView>
  );
};

// Product Detail Page Component
const ProductDetailPage = ({ product, addToCart }) => {
  if (!product) return <Text style={styles.loadingText}>No product selected</Text>;

  return (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Product Details</Text>
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <Text style={styles.productName}>{product.title}</Text>
      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
      <Text style={styles.productDescription}>{product.description}</Text>
      <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(product)}>
        <Text style={styles.addToCartButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Cart Page Component
const CartPage = ({ cart, removeFromCart, setCurrentPage }) => {
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Cart</Text>
      {cart.length === 0 ? (
        <Text style={styles.emptyCartText}>Your cart is empty.</Text>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image source={{ uri: item.image }} style={styles.cartItemImage} />
                <View style={styles.cartItemDetails}>
                  <Text style={styles.cartItemName}>{item.title}</Text>
                  <Text style={styles.cartItemPrice}>${item.price.toFixed(2)}</Text>
                  <TouchableOpacity style={styles.removeItemButton} onPress={() => removeFromCart(item)}>
                    <Text style={styles.removeItemButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
          <Text style={styles.totalPrice}>Total: ${totalPrice.toFixed(2)}</Text>
          <TouchableOpacity style={styles.proceedToCheckoutButton} onPress={() => setCurrentPage('checkout')}>
            <Text style={styles.proceedToCheckoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

// Checkout Page Component
const CheckoutPage = ({ setCurrentPage }) => {
  const [address, setAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePlaceOrder = () => {
    Alert.alert('Order Placed', 'Your order has been placed successfully!');
    setCurrentPage('orderHistory');
  };

  return (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Checkout</Text>
      <TextInput placeholder="Address" style={styles.input} value={address} onChangeText={setAddress} />
      <TextInput placeholder="Card Number" style={styles.input} value={cardNumber} onChangeText={setCardNumber} />
      <TextInput placeholder="Expiry Date (MM/YY)" style={styles.input} value={expiryDate} onChangeText={setExpiryDate} />
      <TextInput placeholder="CVV" style={styles.input} value={cvv} onChangeText={setCvv} />
      <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
        <Text style={styles.placeOrderButtonText}>Place Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Order History Page Component
const OrderHistoryPage = ({ setCurrentPage }) => {
  return (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Order History</Text>
      {orders.length === 0 ? (
        <Text style={styles.emptyOrderText}>No orders found.</Text>
      ) : (
        <FlatList
          data={orders}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <Text style={styles.orderItemText}>Order #{item.id}</Text>
              <Text style={styles.orderItemText}>Items: {item.items.join(', ')}</Text>
              <Text style={styles.orderItemText}>Total: ${item.total.toFixed(2)}</Text>
              <Text style={styles.orderItemText}>Date: {item.date}</Text>
              <Text style={styles.orderItemText}>Status: {item.status}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </ScrollView>
  );
};

// Notifications Page Component
const NotificationsPage = ({ setCurrentPage }) => {
  return (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={styles.emptyNotificationText}>No notifications found.</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </ScrollView>
  );
};

// Settings Page Component
const SettingsPage = ({ setCurrentPage }) => {
  return (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Settings</Text>
      <TouchableOpacity style={styles.settingsButton}>
        <Text style={styles.settingsButtonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsButton}>
        <Text style={styles.settingsButtonText}>Payment Methods</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsButton}>
        <Text style={styles.settingsButtonText}>Notification Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsButton}>
        <Text style={styles.settingsButtonText}>Language Preferences</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={() => Alert.alert('Logged Out', 'You have been logged out.')}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Profile Page Component
const ProfilePage = ({ setCurrentPage }) => {
  return (
    <ScrollView style={styles.pageContainer}>
      <Text style={styles.pageTitle}>Profile</Text>
      <View style={styles.profileHeader}>
        <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.profilePicture} />
        <Text style={styles.profileName}>Ahmed Ali Raja</Text>
        <Text style={styles.profileDetails}>Studies at AUIC</Text>
        <Text style={styles.profileDetails}>UI & App Developer</Text>
        <TouchableOpacity style={styles.editProfileButton}>
          <Text style={styles.editProfileButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Store Description</Text>
      <Text style={styles.storeDescription}>Offering exclusive, high-end gadgets and tech accessories.</Text>
      <Image source={{ uri: 'https://via.placeholder.com/300' }} style={styles.storeBanner} />
      <TouchableOpacity style={styles.visitStoreButton}>
        <Text style={styles.visitStoreButtonText}>Visit Store</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 18,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cartBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#121212',
    fontSize: 12,
  },
  pageContainer: {
    flex: 1,
    padding: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 5,
    marginLeft: 5,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  featuredProductCard: {
    width: 150,
    marginRight: 10,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
  },
  featuredProductImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  featuredProductName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  featuredProductPrice: {
    color: '#FFD700',
    fontSize: 14,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    margin: 4,
  },
  categoryImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  categoryName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  productPrice: {
    color: '#FFD700',
    fontSize: 16,
  },
  productDescription: {
    color: '#888',
    marginBottom: 10,
  },
  addToCartButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItemPrice: {
    color: '#FFD700',
    fontSize: 14,
  },
  removeItemButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  removeItemButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  totalPrice: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'right',
  },
  proceedToCheckoutButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  proceedToCheckoutButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: '#fff',
  },
  placeOrderButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  placeOrderButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  orderItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  orderItemText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyCartText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyOrderText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyNotificationText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  notificationItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  notificationTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationMessage: {
    color: '#fff',
    fontSize: 14,
  },
  notificationTimestamp: {
    color: '#888',
    fontSize: 12,
  },
  settingsButton: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  profileDetails: {
    color: '#888',
    marginBottom: 5,
  },
  editProfileButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  editProfileButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  storeDescription: {
    color: '#fff',
    marginBottom: 10,
  },
  storeBanner: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  visitStoreButton: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  visitStoreButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
});

export default App;
