import React, { useState, useEffect } from 'react';
import { View, Text, Button, Image, FlatList, TouchableOpacity, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const DEFAULT_JOBS = [
  { id: '1', title: 'Software Engineer', description: 'Develop and maintain web applications.', company: 'TechCorp', location: 'New York, USA' },
  { id: '2', title: 'Frontend Developer', description: 'Design and implement UI components.', company: 'InnovateTech', location: 'Berlin, Germany' },
  { id: '3', title: 'Backend Developer', description: 'Build and maintain server-side applications.', company: 'CloudX', location: 'Toronto, Canada' },
  { id: '4', title: 'Mobile App Developer', description: 'Develop and optimize mobile applications.', company: 'AppFlow', location: 'San Francisco, USA' },
  { id: '5', title: 'DevOps Engineer', description: 'Manage CI/CD pipelines and cloud infrastructure.', company: 'CloudOps', location: 'London, UK' },
  { id: '6', title: 'QA Engineer', description: 'Ensure software quality through automated testing.', company: 'QualityFirst', location: 'Sydney, Australia' },
  { id: '7', title: 'Cyber Security Analyst', description: 'Monitor and secure IT infrastructure.', company: 'SecureNet', location: 'Amsterdam, Netherlands' },
  { id: '8', title: 'Database Administrator', description: 'Maintain and optimize databases.', company: 'DataTech', location: 'Tokyo, Japan' },
  { id: '9', title: 'AI/ML Engineer', description: 'Develop machine learning models for applications.', company: 'AI Innovations', location: 'Bangalore, India' },
  { id: '10', title: 'UX/UI Designer', description: 'Design user-friendly interfaces for applications.', company: 'DesignX', location: 'Paris, France' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '684907437642-jqq5nrn5g0b7eqg1qque18ks5nmu2rcl.apps.googleusercontent.com',
    androidClientId: '684907437642-fjv2fev19cbmkbbnrr8hkce47l7mcii0.apps.googleusercontent.com',
    redirectUri,
  });

  useEffect(() => {
    checkStoredUser(); // Load user from storage on app start
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      fetchUserInfo(response.authentication.accessToken);
    }
  }, [response]);

  async function fetchUserInfo(token) {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = await res.json();
      setUser(userInfo);
      await AsyncStorage.setItem('user', JSON.stringify(userInfo));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch user information.');
      console.error(error);
    }
  }

  async function checkStoredUser() {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
  }

  async function handleLogout() {
    setUser(null);
    setSelectedJob(null);
    await AsyncStorage.removeItem('user');
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {user ? (
        selectedJob ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{selectedJob.title}</Text>
            <Text>{selectedJob.company}</Text>
            <Text>{selectedJob.location}</Text>
            <Text style={{ marginTop: 10 }}>{selectedJob.description}</Text>
            <Button title="Back to Listings" onPress={() => setSelectedJob(null)} />
          </View>
        ) : (
          <View style={{ flex: 1, width: '100%' }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Image source={{ uri: user.picture }} style={{ width: 80, height: 80, borderRadius: 40 }} />
              <Text>Welcome, {user.name}!</Text>
              <Button title="Logout" onPress={handleLogout} />
            </View>

            <FlatList
              data={DEFAULT_JOBS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setSelectedJob(item)} style={{ padding: 15, borderBottomWidth: 1 }}>
                  <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
                  <Text>{item.company} - {item.location}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )
      ) : (
        <Button title="Sign in with Google" onPress={() => promptAsync()} disabled={!request} />
      )}
    </View>
  );
}
