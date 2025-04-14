import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dummy data for ticket categories
const ticketCategories = {
  'Movie Tickets': ['Avengers Endgame', 'Inception', 'The Matrix'],
  'Air Tickets': ['Flight to NYC', 'Flight to LA', 'Flight to London'],
  'Concerts': ['Coldplay Concert', 'Imagine Dragons', 'Billie Eilish'],
  'Other Events': ['Comedy Night', 'Food Festival', 'Tech Expo']
};

// Home Screen (Ticket Categories)
function HomeScreen({ navigation }) {
  const [bookingData, setBookingData] = useState(null);

  const renderCategory = (category, events) => (
    <View key={category} style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{category}</Text>
      {events.map(event => (
        <View key={event} style={styles.eventItem}>
          <Text>{event}</Text>
          <Button 
            title="Book Ticket" 
            onPress={() => setBookingData({ category, event })}
          />
        </View>
      ))}
    </View>
  );

  const handleBooking = async () => {
    if (!bookingData.form) return;
    
    const booking = {
      ...bookingData,
      ...bookingData.form,
      date: new Date().toISOString(),
      bookingId: Math.random().toString(36).substr(2, 9)
    };
    
    try {
      const existingBookings = await AsyncStorage.getItem('bookings');
      const bookings = existingBookings ? JSON.parse(existingBookings) : [];
      bookings.push(booking);
      await AsyncStorage.setItem('bookings', JSON.stringify(bookings));
      alert('Ticket Booked Successfully');
      setBookingData(null);
      navigation.navigate('History');
    } catch (e) {
      console.error(e);
    }
  };

  if (bookingData && !bookingData.form) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Book {bookingData.event}</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          onChangeText={text => setBookingData({ ...bookingData, form: { ...bookingData.form, name: text } })}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact Number"
          keyboardType="phone-pad"
          onChangeText={text => setBookingData({ ...bookingData, form: { ...bookingData.form, contact: text } })}
        />
        <TextInput
          style={styles.input}
          placeholder="Card ID"
          onChangeText={text => setBookingData({ ...bookingData, form: { ...bookingData.form, cardId: text } })}
        />
        <TextInput
          style={styles.input}
          placeholder="PIN"
          secureTextEntry
          onChangeText={text => setBookingData({ ...bookingData, form: { ...bookingData.form, pin: text } })}
        />
        <Button title="Confirm Booking" onPress={handleBooking} />
        <Button title="Cancel" onPress={() => setBookingData(null)} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ticket Categories</Text>
      {Object.entries(ticketCategories).map(([category, events]) => 
        renderCategory(category, events)
      )}
    </ScrollView>
  );
}

// History Screen
function HistoryScreen() {
  const [bookings, setBookings] = useEffect([]);

  useEffect(() => {
    const loadBookings = async () => {
      const storedBookings = await AsyncStorage.getItem('bookings');
      setBookings(storedBookings ? JSON.parse(storedBookings) : []);
    };
    loadBookings();
  }, []);

  const renderBooking = ({ item }) => (
    <View style={styles.bookingItem}>
      <Text>Event: {item.event}</Text>
      <Text>Date: {new Date(item.date).toLocaleString()}</Text>
      <Text>Booking ID: {item.bookingId}</Text>
      <Text>Name: {item.form.name}</Text>
      <Text>Contact: {item.form.contact}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking History</Text>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={item => item.bookingId}
        ListEmptyComponent={<Text>No bookings yet</Text>}
      />
    </View>
  );
}

// Explore Screen
function ExploreScreen() {
  const exploreEvents = [
    'Jazz Festival 2025',
    'Tech Conference',
    'Art Exhibition',
    'Marathon 2025'
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Explore Events</Text>
      {exploreEvents.map(event => (
        <View key={event} style={styles.eventItem}>
          <Text>{event}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// Profile Screen
function ProfileScreen() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    bio: 'Ticket enthusiast',
    contact: '123-456-7890'
  });
  const [isEditing, setIsEditing] = useState(false);

  const saveProfile = async () => {
    await AsyncStorage.setItem('profile', JSON.stringify(profile));
    setIsEditing(false);
  };

  useEffect(() => {
    const loadProfile = async () => {
      const storedProfile = await AsyncStorage.getItem('profile');
      if (storedProfile) setProfile(JSON.parse(storedProfile));
    };
    loadProfile();
  }, []);

  if (isEditing) {
    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={text => setProfile({ ...profile, name: text })}
        />
        <TextInput
          style={styles.input}
          value={profile.bio}
          onChangeText={text => setProfile({ ...profile, bio: text })}
        />
        <TextInput
          style={styles.input}
          value={profile.contact}
          onChangeText={text => setProfile({ ...profile, contact: text })}
        />
        <Button title="Save" onPress={saveProfile} />
        <Button title="Cancel" onPress={() => setIsEditing(false)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text>Name: {profile.name}</Text>
      <Text>Bio: {profile.bio}</Text>
      <Text>Contact: {profile.contact}</Text>
      <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
    </View>
  );
}

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  categoryContainer: {
    marginBottom: 20
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  bookingItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5
  }
});