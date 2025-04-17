import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try importing LinearGradient, with fallback if it fails
let LinearGradient;
try {
  LinearGradient = require('react-native-linear-gradient').default;
} catch (e) {
  console.warn('LinearGradient not available, using fallback styles.', e);
  LinearGradient = View; // Fallback to View with solid color
}

// Try importing Animatable, with fallback if it fails
let Animatable;
try {
  Animatable = require('react-native-animatable');
} catch (e) {
  console.warn('Animatable not available, using fallback View.', e);
  Animatable = { View, Text, Image }; // Fallback to standard components
}

// Main App Component
const App = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setCurrentPage('home');

        // Fetch products
        const productResponse = await fetch('https://dummyjson.com/products?limit=100');
        const productData = await productResponse.json();
        setProducts(productData.products);

        // Fetch categories
        const categoryResponse = await fetch('https://dummyjson.com/products/categories');
        const categoryData = await categoryResponse.json();
        const mappedCategories = categoryData.map((cat, index) => ({
          id: `${index + 1}`,
          name: cat.name || cat.slug,
          image: `https://via.placeholder.com/150?text=${cat.name || cat.slug}`,
          slug: cat.slug,
        }));
        setCategories(mappedCategories);

        // Fetch cart
        const cartResponse = await fetch(`https://dummyjson.com/carts/user/${parsedUser.id}`);
        const cartData = await cartResponse.json();
        if (cartData.carts.length > 0) {
          setCart(cartData.carts[0].products);
        }

        // Fetch orders
        setOrders(
          cartData.carts.map((cart) => ({
            id: cart.id,
            items: cart.products.map((p) => p.title),
            total: cart.total,
            date: new Date().toISOString().split('T')[0],
            status: 'Delivered',
          }))
        );

        // Mock notifications
        setNotifications([
          { id: '1', title: 'Order Delivered', message: 'Your item has been delivered.', timestamp: '2 hours ago' },
          { id: '2', title: 'Exclusive Offer', message: 'Get 20% off on selected items.', timestamp: '1 day ago' },
        ]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInitialData().then(() => setRefreshing(false));
  }, [fetchInitialData]);

  // Add to cart
  const addToCart = async (product) => {
    try {
      const existingItem = cart.find((item) => item.id === product.id);
      let updatedCart;
      if (existingItem) {
        updatedCart = cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        updatedCart = [...cart, { ...product, quantity: 1 }];
      }
      setCart(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));

      await fetch('https://dummyjson.com/carts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          products: updatedCart.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });
      Alert.alert('Success', `${product.title} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart.');
    }
  };

  // Update cart quantity
  const updateCartQuantity = async (product, change) => {
    try {
      const updatedCart = cart
        .map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.max(1, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0);
      setCart(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));

      await fetch(`https://dummyjson.com/carts/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          products: updatedCart.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });
    } catch (error) {
      console.error('Error updating cart:', error);
      Alert.alert('Error', 'Failed to update cart.');
    }
  };

  // Remove from cart
  const removeFromCart = async (product) => {
    try {
      const updatedCart = cart.filter((item) => item.id !== product.id);
      setCart(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));

      await fetch(`https://dummyjson.com/carts/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          products: updatedCart.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });
      Alert.alert('Success', `${product.title} removed from cart.`);
    } catch (error) {
      console.error('Error removing from cart:', error);
      Alert.alert('Error', 'Failed to remove item from cart.');
    }
  };

  // Handle login
  const handleLogin = async (username, password) => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }
    try {
      const response = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.token) {
        setUser(data);
        await AsyncStorage.setItem('user', JSON.stringify(data));
        setCurrentPage('home');
        setLoading(true);
      } else {
        Alert.alert('Error', 'Invalid credentials.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Error', 'Failed to log in. Please try again.');
    }
  };

  // Handle registration
  const handleRegister = async (username, password, email, firstName, lastName) => {
    if (!username || !password || !email || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    try {
      const response = await fetch('https://dummyjson.com/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          email,
          firstName,
          lastName,
        }),
      });
      const data = await response.json();
      if (data.id) {
        Alert.alert('Success', 'Registration successful! Please log in.');
        setCurrentPage('login');
      } else {
        Alert.alert('Error', 'Registration failed.');
      }
    } catch (error) {
      console.error('Error registering:', error);
      Alert.alert('Error', 'Failed to register. Please try again.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.setItem('cart', JSON.stringify([]));
    setUser(null);
    setCart([]);
    setCurrentPage('login');
    Alert.alert('Logged Out', 'You have been logged out.');
  };

  // Render pages
  const renderPage = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Animatable.Text
            animation={Animatable.Text === Text ? undefined : 'pulse'}
            easing="ease-out"
            iterationCount="infinite"
            style={styles.loadingText}
          >
            Loading...
          </Animatable.Text>
        </View>
      );
    }

    switch (currentPage) {
      case 'login':
        return <LoginPage handleLogin={handleLogin} setCurrentPage={setCurrentPage} />;
      case 'register':
        return <RegisterPage handleRegister={handleRegister} setCurrentPage={setCurrentPage} />;
      case 'home':
        return (
          <HomePage
            setCurrentPage={setCurrentPage}
            products={products}
            categories={categories}
            setSelectedProduct={setSelectedProduct}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case 'categories':
        return (
          <CategoriesPage
            setCurrentPage={setCurrentPage}
            categories={categories}
            setSelectedProduct={setSelectedProduct}
            products={products}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        );
      case 'productDetail':
        return <ProductDetailPage product={selectedProduct} addToCart={addToCart} />;
      case 'cart':
        return (
          <CartPage
            cart={cart}
            removeFromCart={removeFromCart}
            updateCartQuantity={updateCartQuantity}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'checkout':
        return <CheckoutPage setCurrentPage={setCurrentPage} user={user} cart={cart} setCart={setCart} />;
      case 'orderHistory':
        return <OrderHistoryPage orders={orders} setCurrentPage={setCurrentPage} />;
      case 'notifications':
        return <NotificationsPage notifications={notifications} setCurrentPage={setCurrentPage} />;
      case 'settings':
        return <SettingsPage setCurrentPage={setCurrentPage} handleLogout={handleLogout} />;
      case 'profile':
        return <ProfilePage user={user} setCurrentPage={setCurrentPage} />;
      default:
        return <LoginPage handleLogin={handleLogin} setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={LinearGradient === View ? ['#121212', '#121212'] : ['#1e1e1e', '#121212']}
        style={styles.container}
      >
        {renderPage()}
        {user && (
          <Animatable.View
            animation={Animatable.View === View ? undefined : 'fadeInUp'}
            style={styles.navBar}
          >
            <TouchableOpacity onPress={() => setCurrentPage('home')}>
              <Icon name="home" size={28} color={currentPage === 'home' ? '#FFD700' : '#888'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentPage('categories')}>
              <Icon name="th-large" size={28} color={currentPage === 'categories' ? '#FFD700' : '#888'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentPage('cart')}>
              <Icon name="shopping-cart" size={28} color={currentPage === 'cart' ? '#FFD700' : '#888'} />
              {cart.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentPage('profile')}>
              <Icon name="user" size={28} color={currentPage === 'profile' ? '#FFD700' : '#888'} />
            </TouchableOpacity>
          </Animatable.View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

// Login Page Component
const LoginPage = ({ handleLogin, setCurrentPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScrollView style={styles.pageContainer}>
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Welcome Back
      </Animatable.Text>
      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => handleLogin(username, password)}
      >
        <LinearGradient
          colors={LinearGradient === View ? ['#FFD700', '#FFD700'] : ['#FFD700', '#DAA520']}
          style={styles.buttonGradient}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentPage('register')}>
        <Text style={styles.registerLink}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Register Page Component
const RegisterPage = ({ handleRegister, setCurrentPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  return (
    <ScrollView style={styles.pageContainer}>
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Create Account
      </Animatable.Text>
      <TextInput
        placeholder="First Name"
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Last Name"
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />
      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => handleRegister(username, password, email, firstName, lastName)}
      >
        <LinearGradient
          colors={LinearGradient === View ? ['#FFD700', '#FFD700'] : ['#FFD700', '#DAA520']}
          style={styles.buttonGradient}
        >
          <Text style={styles.loginButtonText}>Register</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setCurrentPage('login')}>
        <Text style={styles.registerLink}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Home Page Component
const HomePage = ({
  setCurrentPage,
  products,
  categories,
  setSelectedProduct,
  searchQuery,
  setSearchQuery,
  refreshing,
  onRefresh,
}) => {
  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.pageContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        My E-Commerce
      </Animatable.Text>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#888" />
        <TextInput
          placeholder="Search for Luxury Products"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888"
        />
      </View>
      <Text style={styles.sectionTitle}>Featured Products</Text>
      <FlatList
        horizontal
        data={filteredProducts}
        renderItem={({ item }) => (
          <Animatable.View
            animation={Animatable.View === View ? undefined : 'zoomIn'}
            style={styles.featuredProductCard}
          >
            <TouchableOpacity
              onPress={() => {
                setSelectedProduct(item);
                setCurrentPage('productDetail');
              }}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.featuredProductImage} />
              <Text style={styles.featuredProductName}>{item.title}</Text>
              <Text style={styles.featuredProductPrice}>${item.price.toFixed(2)}</Text>
              <View style={styles.ratingContainer}>
                {[...Array(5)].map((_, i) => (
                  <Icon
                    key={i}
                    name={i < Math.round(item.rating) ? 'star' : 'star-o'}
                    size={16}
                    color="#FFD700"
                  />
                ))}
              </View>
            </TouchableOpacity>
          </Animatable.View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        data={categories}
        numColumns={2}
        renderItem={({ item }) => (
          <Animatable.View
            animation={Animatable.View === View ? undefined : 'zoomIn'}
            style={styles.categoryCard}
          >
            <TouchableOpacity onPress={() => setCurrentPage('categories')}>
              <Image source={{ uri: item.image }} style={styles.categoryImage} />
              <Text style={styles.categoryName}>{item.name}</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}
        keyExtractor={(item) => item.id}
      />
    </ScrollView>
  );
};

// Categories Page Component
const CategoriesPage = ({ setCurrentPage, categories, setSelectedProduct, products, refreshing, onRefresh }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : [];

  return (
    <ScrollView
      style={styles.pageContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Categories
      </Animatable.Text>
      <FlatList
        data={categories}
        horizontal
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryTab, selectedCategory === item.slug && styles.selectedCategoryTab]}
            onPress={() => setSelectedCategory(item.slug)}
          >
            <Text style={styles.categoryTabText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />
      {selectedCategory && (
        <>
          <Text style={styles.sectionTitle}>{selectedCategory} Products</Text>
          <FlatList
            data={filteredProducts}
            numColumns={2}
            renderItem={({ item }) => (
              <Animatable.View
                animation={Animatable.View === View ? undefined : 'zoomIn'}
                style={styles.featuredProductCard}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedProduct(item);
                    setCurrentPage('productDetail');
                  }}
                >
                  <Image source={{ uri: item.thumbnail }} style={styles.featuredProductImage} />
                  <Text style={styles.featuredProductName}>{item.title}</Text>
                  <Text style={styles.featuredProductPrice}>${item.price.toFixed(2)}</Text>
                </TouchableOpacity>
              </Animatable.View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </>
      )}
    </ScrollView>
  );
};

// Product Detail Page Component
const ProductDetailPage = ({ product, addToCart }) => {
  if (!product) return <Text style={styles.loadingText}>No product selected</Text>;

  return (
    <ScrollView style={styles.pageContainer}>
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Product Details
      </Animatable.Text>
      <Animatable.Image
        animation={Animatable.Image === Image ? undefined : 'zoomIn'}
        source={{ uri: product.thumbnail }}
        style={styles.productImage}
      />
      <Text style={styles.productName}>{product.title}</Text>
      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
      <View style={styles.ratingContainer}>
        {[...Array(5)].map((_, i) => (
          <Icon
            key={i}
            name={i < Math.round(product.rating) ? 'star' : 'star-o'}
            size={20}
            color="#FFD700"
          />
        ))}
      </View>
      <Text style={styles.productDescription}>{product.description}</Text>
      <TouchableOpacity style={styles.addToCartButton} onPress={() => addToCart(product)}>
        <LinearGradient
          colors={LinearGradient === View ? ['#FFD700', '#FFD700'] : ['#FFD700', '#DAA520']}
          style={styles.buttonGradient}
        >
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Cart Page Component
const CartPage = ({ cart, removeFromCart, updateCartQuantity, setCurrentPage }) => {
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <ScrollView style={styles.pageContainer}>
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Your Cart
      </Animatable.Text>
      {cart.length === 0 ? (
        <Text style={styles.emptyCartText}>Your cart is empty.</Text>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={({ item }) => (
              <Animatable.View
                animation={Animatable.View === View ? undefined : 'fadeIn'}
                style={styles.cartItem}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.cartItemImage} />
                <View style={styles.cartItemDetails}>
                  <Text style={styles.cartItemName}>{item.title}</Text>
                  <Text style={styles.cartItemPrice}>
                    ${item.price.toFixed(2)} x {item.quantity}
                  </Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateCartQuantity(item, -1)}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateCartQuantity(item, 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.removeItemButton}
                    onPress={() => removeFromCart(item)}
                  >
                    <Text style={styles.removeItemButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
          <Text style={styles.totalPrice}>Total: ${totalPrice.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.proceedToCheckoutButton}
            onPress={() => setCurrentPage('checkout')}
          >
            <LinearGradient
              colors={LinearGradient === View ? ['#FFD700', '#FFD700'] : ['#FFD700', '#DAA520']}
              style={styles.buttonGradient}
            >
              <Text style={styles.proceedToCheckoutButtonText}>Proceed to Checkout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

// Checkout Page Component
const CheckoutPage = ({ setCurrentPage, user, cart, setCart }) => {
  const [address, setAddress] = useState(user?.address?.address || '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const validateInputs = () => {
    if (!address) {
      Alert.alert('Error', 'Please enter a valid address.');
      return false;
    }
    if (!cardNumber || cardNumber.length < 16) {
      Alert.alert('Error', 'Please enter a valid card number.');
      return false;
    }
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      Alert.alert('Error', 'Please enter a valid expiry date (MM/YY).');
      return false;
    }
    if (!cvv || cvv.length !== 3) {
      Alert.alert('Error', 'Please enter a valid CVV.');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateInputs()) return;
    try {
      await fetch('https://dummyjson.com/carts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          products: [],
        }),
      });
      const orderDetails = {
        id: Date.now().toString(),
        items: cart.map((item) => item.title),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
      };
      setOrders((prev) => [...prev, orderDetails]);
      setCart([]);
      await AsyncStorage.setItem('cart', JSON.stringify([]));
      Alert.alert('Order Placed', `Order #${orderDetails.id} placed successfully!`);
      setCurrentPage('orderHistory');
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order.');
    }
  };

  return (
    <ScrollView style={styles.pageContainer}>
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Checkout
      </Animatable.Text>
      <TextInput
        placeholder="Address"
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Card Number"
        style={styles.input}
        value={cardNumber}
        onChangeText={setCardNumber}
        keyboardType="numeric"
        maxLength={16}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="Expiry Date (MM/YY)"
        style={styles.input}
        value={expiryDate}
        onChangeText={setExpiryDate}
        maxLength={5}
        placeholderTextColor="#888"
      />
      <TextInput
        placeholder="CVV"
        style={styles.input}
        value={cvv}
        onChangeText={setCvv}
        keyboardType="numeric"
        maxLength={3}
        placeholderTextColor="#888"
      />
      <TouchableOpacity style={styles.placeOrderButton} onPress={handlePlaceOrder}>
        <LinearGradient
          colors={LinearGradient === View ? ['#FFD700', '#FFD700'] : ['#FFD700', '#DAA520']}
          style={styles.buttonGradient}
        >
          <Text style={styles.placeOrderButtonText}>Place Order</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Order History Page Component
const OrderHistoryPage = ({ orders, setCurrentPage }) => {
  return (
    <ScrollView style={styles.pageContainer}>
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Order History
      </Animatable.Text>
      {orders.length === 0 ? (
        <Text style={styles.emptyOrderText}>No orders found.</Text>
      ) : (
        <FlatList
          data={orders}
          renderItem={({ item }) => (
            <Animatable.View
              animation={Animatable.View === View ? undefined : 'fadeIn'}
              style={styles.orderItem}
            >
              <Text style={styles.orderItemText}>Order #{item.id}</Text>
              <Text style={styles.orderItemText}>Items: {item.items.join(', ')}</Text>
              <Text style={styles.orderItemText}>Total: ${item.total.toFixed(2)}</Text>
              <Text style={styles.orderItemText}>Date: {item.date}</Text>
              <Text style={styles.orderItemText}>Status: {item.status}</Text>
            </Animatable.View>
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      )}
    </ScrollView>
  );
};

// Notifications Page Component
const NotificationsPage = ({ notifications, setCurrentPage }) => {
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  return (
    <ScrollView style={styles.pageContainer}>
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Notifications
      </Animatable.Text>
      {notifications.length === 0 ? (
        <Text style={styles.emptyNotificationText}>No notifications found.</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <Animatable.View
              animation={Animatable.View === View ? undefined : 'fadeIn'}
              style={[styles.notificationItem, item.read && styles.readNotification]}
            >
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
              {!item.read && (
                <TouchableOpacity
                  style={styles.markReadButton}
                  onPress={() => markAsRead(item.id)}
                >
                  <LinearGradient
                    colors={LinearGradient === View ? ['#FFD700', '#FFD700'] : ['#FFD700', '#DAA520']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.markReadButtonText}>Mark as Read</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </Animatable.View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </ScrollView>
  );
};

// Settings Page Component
const SettingsPage = ({ setCurrentPage, handleLogout }) => {
  const [language, setLanguage] = useState('English');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const saveSettings = () => {
    Alert.alert('Settings Saved', `Language: ${language}, Notifications: ${notificationsEnabled ? 'On' : 'Off'}`);
  };

  return (
    <ScrollView style={styles.pageContainer}>
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Settings
      </Animatable.Text>
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.settingsOption}>
        <Text style={styles.settingsButtonText}>Language</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setLanguage(language === 'English' ? 'Spanish' : 'English')}
        >
          <Text style={styles.settingsButtonText}>{language}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.settingsOption}>
        <Text style={styles.settingsButtonText}>Notifications</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          <Text style={styles.settingsButtonText}>{notificationsEnabled ? 'On' : 'Off'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.saveSettingsButton} onPress={saveSettings}>
        <LinearGradient
          colors={LinearGradient === View ? ['#FFD700', '#FFD700'] : ['#FFD700', '#DAA520']}
          style={styles.buttonGradient}
        >
          <Text style={styles.saveSettingsButtonText}>Save Settings</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Profile Page Component
const ProfilePage = ({ user, setCurrentPage }) => {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');

  const saveProfile = async () => {
    try {
      await fetch(`https://dummyjson.com/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
        }),
      });
      setUser({ ...user, firstName, lastName, email });
      await AsyncStorage.setItem('user', JSON.stringify({ ...user, firstName, lastName, email }));
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  return (
    <ScrollView style={styles.pageContainer}>
      <Animatable.Text
        animation={Animatable.Text === Text ? undefined : 'fadeInDown'}
        style={styles.pageTitle}
      >
        Profile
      </Animatable.Text>
      <View style={styles.profileHeader}>
        <Animatable.Image
          animation={Animatable.Image === Image ? undefined : 'zoomIn'}
          source={{ uri: user?.image || 'https://via.placeholder.com/150' }}
          style={styles.profilePicture}
        />
        <TextInput
          style={styles.profileInput}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First Name"
          placeholderTextColor="#888"
        />
        <TextInput
          style={styles.profileInput}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last Name"
          placeholderTextColor="#888"
        />
        <TextInput
          style={styles.profileInput}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.editProfileButton} onPress={saveProfile}>
          <LinearGradient
            colors={LinearGradient === View ? ['#FFD700', '#FFD700'] : ['#FFD700', '#DAA520']}
            style={styles.buttonGradient}
          >
            <Text style={styles.editProfileButtonText}>Save Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>Store Description</Text>
      <Text style={styles.storeDescription}>
        Offering exclusive, high-end gadgets and tech accessories.
      </Text>
      <Image source={{ uri: 'https://via.placeholder.com/300' }} style={styles.storeBanner} />
      <TouchableOpacity style={styles.visitStoreButton}>
        <LinearGradient
          colors={LinearGradient === View ? ['#FFD700', '#FFD700'] : ['#FFD700', '#DAA520']}
          style={styles.buttonGradient}
        >
          <Text style={styles.visitStoreButtonText}>Visit Store</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1e1e1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
    elevation: 5,
  },
  cartBadge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#121212',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pageContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: 'transparent',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  featuredProductCard: {
    width: 160,
    marginRight: 10,
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 10,
    elevation: 5,
  },
  featuredProductImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
  },
  featuredProductName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  featuredProductPrice: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 10,
    margin: 4,
    elevation: 5,
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
    textAlign: 'center',
  },
  categoryTab: {
    padding: 10,
    marginRight: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    elevation: 3,
  },
  selectedCategoryTab: {
    backgroundColor: '#FFD700',
  },
  categoryTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 250,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 5,
  },
  productName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productPrice: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  productDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 15,
  },
  addToCartButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 5,
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cartItemPrice: {
    color: '#FFD700',
    fontSize: 14,
    marginBottom: 10,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quantityButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 10,
  },
  removeItemButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  removeItemButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  totalPrice: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'right',
  },
  proceedToCheckoutButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 15,
  },
  proceedToCheckoutButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
    elevation: 3,
  },
  profileInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    color: '#fff',
    width: '80%',
    textAlign: 'center',
  },
  placeOrderButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 15,
  },
  placeOrderButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 5,
  },
  orderItemText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  emptyCartText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  emptyOrderText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  emptyNotificationText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  notificationItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 5,
  },
  readNotification: {
    backgroundColor: '#2a2a2a',
  },
  notificationTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationMessage: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  notificationTimestamp: {
    color: '#888',
    fontSize: 12,
  },
  markReadButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
  },
  markReadButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  settingsOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingsButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  saveSettingsButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 15,
  },
  saveSettingsButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  profileDetails: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
  editProfileButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 15,
  },
  editProfileButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  storeDescription: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  storeBanner: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 5,
  },
  visitStoreButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
  },
  visitStoreButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 15,
  },
  loginButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerLink: {
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
  },
});

export default App;