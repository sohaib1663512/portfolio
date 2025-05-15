import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  Modal,
  Easing,
  Alert,
  Dimensions,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome, Feather } from '@expo/vector-icons';

// Mock Data
const RESTAURANTS = [
  {
    id: '1',
    name: 'Pizza Hut',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500',
    rating: 4.5,
    deliveryTime: '20-30',
    cuisine: 'Italian',
    priceRange: '$$',
    distance: '0.5',
    menu: [
      { id: '1', name: 'Pepperoni Pizza', price: 12.99, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500', description: 'Classic pepperoni with mozzarella cheese and tomato sauce' },
      { id: '2', name: 'Margherita Pizza', price: 10.99, image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500', description: 'Fresh basil, mozzarella, and tomato sauce' },
      { id: '3', name: 'Garlic Bread', price: 4.99, image: 'https://images.unsplash.com/photo-1563281571-0347a9b3e8e2?w=500', description: 'Crispy bread with garlic butter and herbs' },
      { id: '4', name: 'Caesar Salad', price: 8.99, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500', description: 'Romaine lettuce, croutons, parmesan with Caesar dressing' },
    ],
  },
  {
    id: '2',
    name: 'Burger King',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    rating: 4.3,
    deliveryTime: '15-25',
    cuisine: 'American',
    priceRange: '$',
    distance: '1.2',
    menu: [
      { id: '1', name: 'Whopper', price: 8.99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', description: 'Flame-grilled beef patty with tomatoes, lettuce, and mayo' },
      { id: '2', name: 'Chicken Fries', price: 5.99, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500', description: 'Crispy chicken strips shaped like fries' },
      { id: '3', name: 'Onion Rings', price: 3.99, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500', description: 'Crispy battered onion rings' },
    ],
  },
  {
    id: '3',
    name: 'Sushi Master',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500',
    rating: 4.8,
    deliveryTime: '30-40',
    cuisine: 'Japanese',
    priceRange: '$$$',
    distance: '2.5',
    menu: [
      { id: '1', name: 'California Roll', price: 18.99, image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500', description: 'Crab, avocado, and cucumber wrapped in seaweed and rice' },
      { id: '2', name: 'Salmon Nigiri', price: 15.99, image: 'https://images.unsplash.com/photo-1633478062482-3358e83356fc?w=500', description: 'Fresh salmon slices over pressed rice' },
      { id: '3', name: 'Miso Soup', price: 4.99, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500', description: 'Traditional Japanese soup with tofu and seaweed' },
    ],
  },
  {
    id: '4',
    name: 'Taco Bell',
    image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=500',
    rating: 4.0,
    deliveryTime: '15-25',
    cuisine: 'Mexican',
    priceRange: '$',
    distance: '1.8',
    menu: [
      { id: '1', name: 'Crunchy Taco', price: 2.99, image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=500', description: 'Crispy taco shell with seasoned beef, lettuce, and cheese' },
      { id: '2', name: 'Quesadilla', price: 6.99, image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=500', description: 'Grilled tortilla with melted cheese and your choice of filling' },
    ],
  },
  {
    id: '5',
    name: 'Pasta Palace',
    image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=500',
    rating: 4.6,
    deliveryTime: '25-35',
    cuisine: 'Italian',
    priceRange: '$$',
    distance: '3.0',
    menu: [
      { id: '1', name: 'Spaghetti Carbonara', price: 14.99, image: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=500', description: 'Pasta with creamy egg sauce, pancetta, and parmesan' },
      { id: '2', name: 'Lasagna', price: 16.99, image: 'https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=500', description: 'Layered pasta with meat sauce and cheese' },
    ],
  },
];

const CATEGORIES = [
  { id: '1', name: 'All', icon: '🍽️' },
  { id: '2', name: 'Pizza', icon: '🍕' },
  { id: '3', name: 'Burger', icon: '🍔' },
  { id: '4', name: 'Sushi', icon: '🍣' },
  { id: '5', name: 'Pasta', icon: '🍝' },
  { id: '6', name: 'Salad', icon: '🥗' },
  { id: '7', name: 'Dessert', icon: '🍰' },
  { id: '8', name: 'Mexican', icon: '🌮' },
];

const ORDERS = [
  { 
    id: '1', 
    restaurant: 'Pizza Hut', 
    items: ['Pepperoni Pizza', 'Margherita Pizza'], 
    total: 23.98, 
    status: 'Delivered',
    date: '2023-05-15',
    restaurantImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500'
  },
  { 
    id: '2', 
    restaurant: 'Sushi Master', 
    items: ['California Roll', 'Salmon Nigiri'], 
    total: 34.98, 
    status: 'On the Way',
    date: '2023-05-10',
    restaurantImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500'
  },
];

const { width, height } = Dimensions.get('window');

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [cart, setCart] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showRestaurantDetails, setShowRestaurantDetails] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [activeMenuItem, setActiveMenuItem] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const welcomeAnim = useRef(new Animated.Value(1)).current;
  const welcomeRotate = useRef(new Animated.Value(0)).current;
  const welcomeScale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showWelcome) {
      // Welcome screen animation sequence
      Animated.sequence([
        Animated.timing(welcomeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(welcomeRotate, {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.645, 0.045, 0.355, 1),
            useNativeDriver: true,
          }),
          Animated.timing(welcomeScale, {
            toValue: 0,
            duration: 1000,
            easing: Easing.bezier(0.645, 0.045, 0.355, 1),
            useNativeDriver: true,
          }),
          Animated.timing(welcomeAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.bezier(0.645, 0.045, 0.355, 1),
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setShowWelcome(false);
        // Start main content animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [showWelcome]);

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + quantity } 
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity }]);
    }
    setQuantity(1);
    setActiveMenuItem(null);
    Alert.alert('Added to Cart', `${item.name} has been added to your cart`);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = () => {
    setOrderStatus('preparing');
    setShowCheckout(true);
    setTimeout(() => {
      setOrderStatus('on the way');
      setTimeout(() => {
        setOrderStatus('delivered');
        setCart([]);
        setTimeout(() => {
          setShowCheckout(false);
          setActiveTab('orders');
        }, 2000);
      }, 5000);
    }, 3000);
  };

  const WelcomeScreen = () => (
    <Animated.View
      style={[
        styles.welcomeContainer,
        {
          opacity: welcomeAnim,
          transform: [
            { scale: welcomeScale },
            {
              rotate: welcomeRotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.welcomeContent}>
        <Animated.Text 
          style={[
            styles.welcomeTitle,
            {
              transform: [{ translateY }],
              opacity,
            }
          ]}
        >
          Welcome to
        </Animated.Text>
        <Animated.Text 
          style={[
            styles.welcomeBrand,
            {
              transform: [{ translateY }],
              opacity,
            }
          ]}
        >
          FoodExpress
        </Animated.Text>
        <Animated.Text 
          style={[
            styles.welcomeSubtitle,
            {
              transform: [{ translateY }],
              opacity,
            }
          ]}
        >
          Delicious food delivered fast
        </Animated.Text>
      </View>
    </Animated.View>
  );

  const RestaurantDetailsScreen = ({ restaurant }) => (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setShowRestaurantDetails(false)}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{restaurant.name}</Text>
        <View style={styles.cartIconContainer}>
          <TouchableOpacity onPress={() => setActiveTab('cart')}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
            <Ionicons name="cart" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.modalContent}>
        <Image source={{ uri: restaurant.image }} style={styles.restaurantDetailImage} />
        <View style={styles.restaurantDetailInfo}>
          <View style={styles.restaurantDetailHeader}>
            <Text style={styles.restaurantDetailName}>{restaurant.name}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.restaurantDetailRating}>{restaurant.rating}</Text>
            </View>
          </View>
          <View style={styles.restaurantDetailMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{restaurant.deliveryTime} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{restaurant.priceRange}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{restaurant.distance} km</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.restaurantDescription}>
            {restaurant.name} serves delicious {restaurant.cuisine} cuisine with fresh ingredients and authentic flavors.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>Menu</Text>
        {restaurant.menu.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.menuItem}
            onPress={() => setActiveMenuItem(item)}
          >
            <Image source={{ uri: item.image }} style={styles.menuItemImage} />
            <View style={styles.menuItemInfo}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
              <Text style={styles.menuItemPrice}>${item.price}</Text>
            </View>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => addToCart(item)}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Menu Item Modal */}
      {activeMenuItem && (
        <Modal transparent animationType="slide">
          <View style={styles.itemModalContainer}>
            <View style={styles.itemModalContent}>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setActiveMenuItem(null)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              
              <Image 
                source={{ uri: activeMenuItem.image }} 
                style={styles.modalItemImage} 
              />
              
              <Text style={styles.modalItemName}>{activeMenuItem.name}</Text>
              <Text style={styles.modalItemDescription}>{activeMenuItem.description}</Text>
              <Text style={styles.modalItemPrice}>${activeMenuItem.price}</Text>
              
              <View style={styles.quantitySelector}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={20} color="#FF6B6B" />
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{quantity}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Ionicons name="add" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.addToCartButton}
                onPress={() => addToCart(activeMenuItem)}
              >
                <Text style={styles.addToCartButtonText}>Add to Cart - ${(activeMenuItem.price * quantity).toFixed(2)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  const CartScreen = () => (
    <View style={styles.container}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Your Cart</Text>
        {cart.length > 0 && (
          <TouchableOpacity onPress={() => setCart([])}>
            <Text style={styles.clearCartText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtext}>Browse restaurants and add items to your cart</Text>
          <TouchableOpacity 
            style={styles.browseButton} 
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.cartItemImage} 
                />
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>${item.price}</Text>
                  
                  <View style={styles.cartItemQuantity}>
                    <TouchableOpacity 
                      style={styles.quantityButtonSmall}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Ionicons name="remove" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                    
                    <Text style={styles.quantityTextSmall}>{item.quantity}</Text>
                    
                    <TouchableOpacity 
                      style={styles.quantityButtonSmall}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Ionicons name="add" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            )}
          />
          
          <View style={styles.cartTotal}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${getTotalPrice()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery Fee</Text>
              <Text style={styles.totalValue}>$2.99</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>${(getTotalPrice() * 0.1).toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>${(parseFloat(getTotalPrice()) + 2.99 + (parseFloat(getTotalPrice()) * 0.1)).toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.checkoutButton} 
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutButtonText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const SearchScreen = () => {
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
      if (searchQuery) {
        const results = RESTAURANTS.filter((restaurant) =>
          restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          restaurant.menu.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, [searchQuery]);

    return (
      <View style={styles.container}>
        <View style={styles.searchHeader}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for restaurants or dishes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        </View>
        
        {searchQuery === '' ? (
          <View style={styles.searchPlaceholder}>
            <Ionicons name="search" size={60} color="#ddd" />
            <Text style={styles.searchPlaceholderText}>Search for restaurants or dishes</Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.searchPlaceholder}>
            <Ionicons name="sad-outline" size={60} color="#ddd" />
            <Text style={styles.searchPlaceholderText}>No results found for "{searchQuery}"</Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.restaurantCard}
                onPress={() => {
                  setSelectedRestaurant(item);
                  setShowRestaurantDetails(true);
                }}
              >
                <Image source={{ uri: item.image }} style={styles.restaurantImage} />
                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <View style={styles.restaurantDetails}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.restaurantRating}>{item.rating}</Text>
                    </View>
                    <Text style={styles.restaurantDelivery}>• {item.deliveryTime} min</Text>
                    <Text style={styles.restaurantPrice}>• {item.priceRange}</Text>
                  </View>
                  <Text style={styles.restaurantCuisine}>{item.cuisine}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  };

  const OrdersScreen = () => (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Your Orders</Text>
      
      {ORDERS.length === 0 ? (
        <View style={styles.emptyOrders}>
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyOrdersText}>No orders yet</Text>
          <Text style={styles.emptyOrdersSubtext}>Your completed orders will appear here</Text>
          <TouchableOpacity 
            style={styles.browseButton} 
            onPress={() => setActiveTab('home')}
          >
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={ORDERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <View style={styles.orderHeader}>
                <Image 
                  source={{ uri: item.restaurantImage }} 
                  style={styles.orderRestaurantImage} 
                />
                <View>
                  <Text style={styles.orderRestaurant}>{item.restaurant}</Text>
                  <Text style={styles.orderDate}>{item.date}</Text>
                </View>
              </View>
              
              <View style={styles.orderItemsContainer}>
                {item.items.map((foodItem, index) => (
                  <Text key={index} style={styles.orderFoodItem}>
                    • {foodItem}
                  </Text>
                ))}
              </View>
              
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>Total: ${item.total}</Text>
                <View style={[
                  styles.orderStatus,
                  item.status === 'Delivered' ? styles.statusDelivered : styles.statusOnWay
                ]}>
                  <Text style={styles.orderStatusText}>{item.status}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  const ProfileScreen = () => (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500' }}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>John Doe</Text>
        <Text style={styles.profileEmail}>johndoe@example.com</Text>
      </View>
      
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="person-outline" size={20} color="#FF6B6B" />
          </View>
          <Text style={styles.settingText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="location-outline" size={20} color="#FF6B6B" />
          </View>
          <Text style={styles.settingText}>Saved Addresses</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="card-outline" size={20} color="#FF6B6B" />
          </View>
          <Text style={styles.settingText}>Payment Methods</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="help-circle-outline" size={20} color="#FF6B6B" />
          </View>
          <Text style={styles.settingText}>Help Center</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name="chatbubble-outline" size={20} color="#FF6B6B" />
          </View>
          <Text style={styles.settingText}>Contact Us</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => Alert.alert('Logged Out', 'You have been logged out successfully!')}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const CheckoutModal = () => {
    const statusMessages = {
      'preparing': 'Your order is being prepared',
      'on the way': 'Your food is on the way!',
      'delivered': 'Your order has been delivered!'
    };
    
    const statusIcons = {
      'preparing': 'restaurant',
      'on the way': 'bicycle',
      'delivered': 'checkmark-done'
    };
    
    return (
      <Modal transparent visible={showCheckout}>
        <View style={styles.checkoutModal}>
          <View style={styles.checkoutContent}>
            <Ionicons 
              name={statusIcons[orderStatus]} 
              size={60} 
              color="#FF6B6B" 
              style={styles.statusIcon} 
            />
            <Text style={styles.checkoutTitle}>Order Status</Text>
            <Text style={styles.orderStatusText}>{statusMessages[orderStatus]}</Text>
            
            {orderStatus === 'preparing' && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: '30%' }]} />
              </View>
            )}
            
            {orderStatus === 'on the way' && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: '70%' }]} />
              </View>
            )}
            
            {orderStatus === 'delivered' && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: '100%' }]} />
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => {
                    setShowCheckout(false);
                    setActiveTab('orders');
                  }}
                >
                  <Text style={styles.closeButtonText}>View Order</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const HomeScreen = () => (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-300, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-sharp" size={20} color="#FF6B6B" />
          <Text style={styles.locationText}>Delivery to Home</Text>
          <Ionicons name="chevron-down" size={16} color="#666" />
        </View>
        
        <View style={styles.cartIconHeader}>
          <TouchableOpacity onPress={() => setActiveTab('cart')}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
            <Ionicons name="cart" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInputHome}
            placeholder="Search for restaurants or dishes"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                selectedCategory === item.id && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />

        <Text style={styles.sectionTitle}>Popular Near You</Text>
        {RESTAURANTS.filter(restaurant => selectedCategory === '1' || 
          (selectedCategory === '2' && restaurant.cuisine === 'Italian') ||
          (selectedCategory === '3' && restaurant.cuisine === 'American') ||
          (selectedCategory === '4' && restaurant.cuisine === 'Japanese') ||
          (selectedCategory === '5' && restaurant.cuisine === 'Italian') ||
          (selectedCategory === '6' && restaurant.menu.some(item => item.name.includes('Salad'))) ||
          (selectedCategory === '7' && restaurant.menu.some(item => item.name.includes('Dessert'))) ||
          (selectedCategory === '8' && restaurant.cuisine === 'Mexican'))
          .map((restaurant) => (
            <TouchableOpacity
              key={restaurant.id}
              style={styles.restaurantCard}
              onPress={() => {
                setSelectedRestaurant(restaurant);
                setShowRestaurantDetails(true);
              }}
            >
              <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <View style={styles.restaurantDetails}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.restaurantRating}>{restaurant.rating}</Text>
                  </View>
                  <Text style={styles.restaurantDelivery}>• {restaurant.deliveryTime} min</Text>
                  <Text style={styles.restaurantPrice}>• {restaurant.priceRange}</Text>
                </View>
                <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {showWelcome ? (
        <WelcomeScreen />
      ) : (
        <>
          {showRestaurantDetails ? (
            <RestaurantDetailsScreen restaurant={selectedRestaurant} />
          ) : (
            <>
              {activeTab === 'home' && <HomeScreen />}
              {activeTab === 'search' && <SearchScreen />}
              {activeTab === 'cart' && <CartScreen />}
              {activeTab === 'orders' && <OrdersScreen />}
              {activeTab === 'profile' && <ProfileScreen />}
            </>
          )}

          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab('home')}
            >
              <Ionicons 
                name="home" 
                size={24} 
                color={activeTab === 'home' ? '#FF6B6B' : '#999'} 
              />
              <Text style={[
                styles.navText,
                activeTab === 'home' && styles.activeNavText
              ]}>
                Home
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab('search')}
            >
              <Ionicons 
                name="search" 
                size={24} 
                color={activeTab === 'search' ? '#FF6B6B' : '#999'} 
              />
              <Text style={[
                styles.navText,
                activeTab === 'search' && styles.activeNavText
              ]}>
                Search
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab('orders')}
            >
              <Ionicons 
                name="receipt" 
                size={24} 
                color={activeTab === 'orders' ? '#FF6B6B' : '#999'} 
              />
              <Text style={[
                styles.navText,
                activeTab === 'orders' && styles.activeNavText
              ]}>
                Orders
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => setActiveTab('profile')}
            >
              <Ionicons 
                name="person" 
                size={24} 
                color={activeTab === 'profile' ? '#FF6B6B' : '#999'} 
              />
              <Text style={[
                styles.navText,
                activeTab === 'profile' && styles.activeNavText
              ]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>

          <CheckoutModal />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Welcome Screen Styles
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
    marginBottom: 10,
  },
  welcomeBrand: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },

  // Main Container
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 80,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 5,
    marginRight: 5,
    fontSize: 16,
    fontWeight: '600',
  },
  cartIconHeader: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputHome: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchHeader: {
    position: 'relative',
    padding: 15,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    paddingLeft: 45,
    borderRadius: 10,
    fontSize: 16,
  },
  searchPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  searchPlaceholderText: {
    marginTop: 20,
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },

  // Section Titles
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 15,
    marginTop: 10,
  },

  // Categories
  categories: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 15,
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: 80,
  },
  selectedCategory: {
    backgroundColor: '#FF6B6B',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Restaurant Cards
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  restaurantImage: {
    width: '100%',
    height: 150,
  },
  restaurantInfo: {
    padding: 15,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  restaurantDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  restaurantRating: {
    marginLeft: 3,
    fontSize: 14,
    fontWeight: '600',
  },
  restaurantDelivery: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  restaurantPrice: {
    fontSize: 14,
    color: '#666',
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Navigation Bar
  navBar: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 70,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  activeNavText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },

  // Restaurant Details Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  cartIconContainer: {
    position: 'relative',
  },
  modalContent: {
    flex: 1,
  },
  restaurantDetailImage: {
    width: '100%',
    height: 200,
  },
  restaurantDetailInfo: {
    padding: 20,
  },
  restaurantDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  restaurantDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  restaurantDetailRating: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  restaurantDetailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  restaurantDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  menuItemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  menuItemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Menu Item Modal
  itemModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  itemModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  closeModalButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  modalItemImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalItemName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  modalItemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 20,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
  },
  addToCartButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Cart Screen
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  clearCartText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButtonSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityTextSmall: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  removeButton: {
    padding: 10,
  },
  cartTotal: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  grandTotal: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  checkoutButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Orders Screen
  emptyOrders: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyOrdersText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  emptyOrdersSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center',
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderRestaurantImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
  },
  orderRestaurant: {
    fontSize: 16,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderItemsContainer: {
    marginBottom: 15,
  },
  orderFoodItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusDelivered: {
    backgroundColor: '#E8F5E9',
  },
  statusOnWay: {
    backgroundColor: '#FFF3E0',
  },
  orderStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Profile Screen
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
  },
  profileSection: {
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Checkout Modal
  checkoutModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  checkoutContent: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
  },
  statusIcon: {
    marginBottom: 20,
  },
  checkoutTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  orderStatusText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 3,
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
  
