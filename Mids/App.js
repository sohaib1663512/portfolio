import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const Stack = createStackNavigator();
const API_URL = 'http://192.168.43.167:3000/api'; // Adjust to 5000 if needed

// Login Screen
const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const buttonScale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogin = async () => {
    try {
      buttonScale.value = withTiming(0.95, { duration: 100 }, () => {
        buttonScale.value = withTiming(1, { duration: 100 });
      });
      const response = await axios.post(`${API_URL}/login`, { username, password });
      if (response.data.success) {
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('username', username);
        navigation.navigate('JobListings');
      } else {
        alert(response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.loginTitle}>Welcome</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#aaa"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Reanimated.View style={[styles.button, animatedButtonStyle]}>
          <TouchableOpacity onPress={handleLogin}>
            <View style={styles.buttonGradient}>
              <Text style={styles.buttonText}>Login</Text>
            </View>
          </TouchableOpacity>
        </Reanimated.View>
      </View>
    </View>
  );
};

// Job Card Component (Moved from renderJobItem)
const JobCard = ({ item, navigation }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Reanimated.View style={[styles.jobCard, animatedStyle]}>
      <TouchableOpacity
        onPressIn={() => (scale.value = withTiming(0.98, { duration: 100 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 100 }))}
        onPress={() => navigation.navigate('JobDetails', { job: item })}
      >
        <View style={styles.jobGradient}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.jobSubtitle}>{item.company}</Text>
          <Text style={styles.jobLocation}>{item.location}</Text>
          <View style={styles.walkingLine} />
        </View>
      </TouchableOpacity>
    </Reanimated.View>
  );
};

// Job Listings Screen
const JobListingsScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const storedJobs = await AsyncStorage.getItem('jobs');
      if (storedJobs) {
        setJobs(JSON.parse(storedJobs));
        setLoading(false);
      }
      const response = await axios.get(`${API_URL}/jobs`);
      setJobs(response.data);
      await AsyncStorage.setItem('jobs', JSON.stringify(response.data));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.listContainer}>
      <Text style={styles.listTitle}>Job Listings</Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={jobs}
          renderItem={({ item }) => <JobCard item={item} navigation={navigation} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

// Job Details Screen
const JobDetailsScreen = ({ route }) => {
  const { job } = route.params;
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 1000 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <View style={styles.detailsContainer}>
      <ScrollView>
        <Reanimated.View style={[styles.detailsHeader, animatedStyle]}>
          <Text style={styles.detailsTitle}>{job.title}</Text>
          <Text style={styles.detailsSubtitle}>{job.company} - {job.location}</Text>
        </Reanimated.View>
        <View style={styles.detailsContent}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.detailsText}>{job.description}</Text>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <Text style={styles.detailsText}>{job.requirements.join('\n')}</Text>
          <Text style={styles.sectionTitle}>Apply</Text>
          <Text style={styles.detailsLink}>{job.applicationLink}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="JobListings" component={JobListingsScreen} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#4c669f',
    justifyContent: 'center',
  },
  loginTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  inputContainer: {
    alignItems: 'center',
  },
  input: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  button: {
    width: '70%',
  },
  buttonGradient: {
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: '#00d4ff',
    shadowColor: '#090979',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e0eafc',
  },
  listTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  jobCard: {
    marginVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  jobGradient: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  jobSubtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  jobLocation: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  walkingLine: {
    height: 3,
    backgroundColor: '#00d4ff',
    marginTop: 10,
    borderRadius: 2,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  loadingText: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f9fc',
  },
  detailsHeader: {
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  detailsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsSubtitle: {
    fontSize: 20,
    color: '#666',
    marginTop: 5,
  },
  detailsContent: {
    paddingVertical: 25,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailsText: {
    fontSize: 18,
    color: '#444',
    lineHeight: 26,
  },
  detailsLink: {
    fontSize: 18,
    color: '#00d4ff',
    textDecorationLine: 'underline',
  },
});