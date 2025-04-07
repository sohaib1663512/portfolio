
import React, { useState, useEffect } from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Card } from 'react-native-paper';
import axios from 'axios';
import * as Animatable from 'react-native-animatable'; // For animations

export default function App() {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login/signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Disney characters from API
  useEffect(() => {
    const fetchCharacters = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://api.disneyapi.dev/character');
        setCharacters(response.data.data); // API returns { info, data }
      } catch (error) {
        console.error('Error fetching Disney characters:', error);
      }
      setLoading(false);
    };
    fetchCharacters();
  }, []);

  // Simulate login/signup action
  const handleAuth = () => {
    console.log(${isLogin ? 'Logging in' : 'Signing up'} with, { email, password });
    // Add real auth logic here (e.g., Firebase)
  };

  // Render character card
  const renderCharacter = ({ item }) => (
    <Animatable.View animation="bounceIn" style={styles.cardContainer}>
      <Card>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text>{item.films.length > 0 ? Film: ${item.films[0]} : 'No films listed'}</Text>
      </Card>
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {characters.length === 0 ? (
        // Login/Signup Screen
        <Animatable.View animation="fadeInUp" style={styles.authContainer}>
          <Text style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      ) : (
        // Character List Screen
        <>
          <Text style={styles.paragraph}>Explore Disney Characters!</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#ff69b4" />
          ) : (
            <FlatList
              data={characters}
              renderItem={renderCharacter}
              keyExtractor={(item) => item._id.toString()}
              contentContainerStyle={styles.list}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#ff69b4',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#ff69b4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#ff69b4',
    textAlign: 'center',
    marginTop: 10,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  list: {
    paddingBottom: 20,
  },
  cardContainer: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 10,
  },
});
