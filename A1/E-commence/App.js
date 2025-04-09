import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, TextInput, Switch } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Dummy data
const categories = {
  Fashion: [
    { id: '1', name: 'Summer Dress', price: 29.99, rating: 4.5, image: 'https://picsum.photos/200', description: 'Light summer dress' },
    { id: '2', name: 'Denim Jacket', price: 49.99, rating: 4.2, image: 'https://picsum.photos/200', description: 'Stylish denim jacket' },
  ],
  Shoes: [
    { id: '3', name: 'Running Shoes', price: 59.99, rating: 4.8, image: 'https://picsum.photos/200', description: 'Comfortable running shoes' },
  ],
  Bags: [
    { id: '4', name: 'Leather Backpack', price: 79.99, rating: 4.6, image: 'https://picsum.photos/200', description: 'Durable leather backpack' },
  ],
  Toys: [
    { id: '5', name: 'Teddy Bear', price: 19.99, rating: 4.3, image: 'https://picsum.photos/200', description: 'Soft teddy bear' },
  ],
  Grocery: [
    { id: '6', name: 'Organic Apples', price: 5.99, rating: 4.7, image: 'https://picsum.photos/200', description: 'Fresh organic apples' },
  ],
  Beauty: [
    { id: '7', name: 'Lipstick Set', price: 24.99, rating: 4.4, image: 'https://picsum.photos/200', description: 'Vibrant lipstick colors' },
  ],
  Electronics: [
    { id: '8', name: 'Wireless Earbuds', price: 89.99, rating: 4.9, image: 'https://picsum.photos/200', description: 'High-quality earbuds' },
  ],
};

// Home Screen
function HomeScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const featured = Object.values(categories).flat().slice(0, 3);

  return (
    <ScrollView style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search products..."
        value={search}
        onChangeText={setSearch}
      />
      <Text style={styles.title}>Categories</Text>
      <FlatList
        horizontal
        data={Object.keys(categories)}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.categoryItem} 
            onPress={() => navigation.navigate('Products', { category: item })}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item}
      />
      <Text style={styles.title}>Featured Products</Text>
      <FlatList
        horizontal
        data={featured}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.productItem} 
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
          >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <Text>{item.name}</Text>
            <Text>${item.price}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />
    </ScrollView>
  );
}

// Product List Screen
function ProductListScreen({ route, navigation }) {
  const { category } = route.params;

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productItem} 
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <Text>{item.name}</Text>
      <Text>${item.price}</Text>
      <Text>Rating: {item.rating} ★</Text>
      <TouchableOpacity style={styles.viewButton}>
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={categories[category]}
      renderItem={renderProduct}
      keyExtractor={item => item.id}
      style={styles.container}
    />
  );
}

// Product Detail Screen
function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);

  const addToCart = async () => {
    const cartItem = { ...product, quantity };
    const existingCart = await AsyncStorage.getItem('cart');
    const cart = existingCart ? JSON.parse(existingCart) : [];
    cart.push(cartItem);
    await AsyncStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to Cart!');
    navigation.navigate('Cart');
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image }} style={styles.detailImage} />
      <Text style={styles.productName}>{product.name}</Text>
      <Text>${product.price}</Text>
      <Text>Rating: {product.rating} ★</Text>
      <Text>{product.description}</Text>
      <View style={styles.quantityContainer}>
        <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))}><Text>-</Text></TouchableOpacity>
        <Text style={styles.quantity}>{quantity}</Text>
        <TouchableOpacity onPress={() => setQuantity(quantity + 1)}><Text>+</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={addToCart}>
        <Text style={styles.buttonText}>Add to Cart</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Cart Screen
function CartScreen({ navigation }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const storedCart = await AsyncStorage.getItem('cart');
    setCart(storedCart ? JSON.parse(storedCart) : []);
  };

  const removeItem = async (id) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={{ uri: item.image }} style={styles.cartImage} />
            <View>
              <Text>{item.name}</Text>
              <Text>${item.price} x {item.quantity}</Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)}><Text>Remove</Text></TouchableOpacity>
          </View>
        )}
        keyExtractor={item => item.id}
      />
      <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      {cart.length > 0 && (
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.buttonText}>Checkout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Checkout Screen
function CheckoutScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', address: '', contact: '', card: '', cvv: '' });

  const handleCheckout = async () => {
    const cart = JSON.parse(await AsyncStorage.getItem('cart') || '[]');
    const order = {
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      date: new Date().toISOString(),
      status: 'In Progress',
      user: form
    };
    const existingOrders = await AsyncStorage.getItem('orders');
    const orders = existingOrders ? JSON.parse(existingOrders) : [];
    orders.push(order);
    await AsyncStorage.setItem('orders', JSON.stringify(orders));
    await AsyncStorage.removeItem('cart');
    alert('Order Placed Successfully!');
    navigation.navigate('Orders');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      <TextInput style={styles.input} placeholder="Full Name" onChangeText={text => setForm({ ...form, name: text })} />
      <TextInput style={styles.input} placeholder="Address" onChangeText={text => setForm({ ...form, address: text })} />
      <TextInput style={styles.input} placeholder="Contact Number" onChangeText={text => setForm({ ...form, contact: text })} />
      <TextInput style={styles.input} placeholder="Card Number" onChangeText={text => setForm({ ...form, card: text })} />
      <TextInput style={styles.input} placeholder="CVV" onChangeText={text => setForm({ ...form, cvv: text })} />
      <TouchableOpacity style={styles.addButton} onPress={handleCheckout}>
        <Text style={styles.buttonText}>Place Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Order History Screen
function OrderHistoryScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const storedOrders = await AsyncStorage.getItem('orders');
    setOrders(storedOrders ? JSON.parse(storedOrders) : []);
  };

  return (
    <FlatList
      data={orders}
      renderItem={({ item }) => (
        <View style={styles.orderItem}>
          <Text>{item.items.map(i => i.name).join(', ')}</Text>
          <Text>Total: ${item.total.toFixed(2)}</Text>
          <Text>{new Date(item.date).toLocaleString()}</Text>
          <Text>Status: {item.status}</Text>
        </View>
      )}
      keyExtractor={(_, index) => index.toString()}
      style={styles.container}
    />
  );
}

// Profile Screen
function ProfileScreen() {
  const [profile, setProfile] = useState({ name: 'John Doe', email: 'john@example.com', contact: '123-456-7890', address: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const storedProfile = await AsyncStorage.getItem('profile');
    if (storedProfile) setProfile(JSON.parse(storedProfile));
  };

  const saveProfile = async () => {
    await AsyncStorage.setItem('profile', JSON.stringify(profile));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <ScrollView style={styles.container}>
        <TextInput style={styles.input} value={profile.name} onChangeText={text => setProfile({ ...profile, name: text })} />
        <TextInput style={styles.input} value={profile.email} onChangeText={text => setProfile({ ...profile, email: text })} />
        <TextInput style={styles.input} value={profile.contact} onChangeText={text => setProfile({ ...profile, contact: text })} />
        <TextInput style={styles.input} value={profile.address} onChangeText={text => setProfile({ ...profile, address: text })} />
        <TouchableOpacity style={styles.addButton} onPress={saveProfile}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text>Name: {profile.name}</Text>
      <Text>Email: {profile.email}</Text>
      <Text>Contact: {profile.contact}</Text>
      <Text>Address: {profile.address || 'Not set'}</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => setIsEditing(true)}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

// Tab Navigator
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Categories') iconName = 'list';
            else if (route.name === 'Cart') iconName = 'cart';
            else if (route.name === 'Orders') iconName = 'receipt';
            else if (route.name === 'Profile') iconName = 'person';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Categories" component={ProductListScreen} initialParams={{ category: 'Fashion' }} />
        <Tab.Screen name="Cart" component={CartScreen} />
        <Tab.Screen name="Orders" component={OrderHistoryScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  categoryItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    elevation: 2,
  },
  productItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    alignItems: 'center',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  quantity: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  cartImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  orderItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});