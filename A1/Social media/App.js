import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Dummy data
const dummyPosts = [
  { id: '1', user: 'sohaib_doe', profilePic: 'https://picsum.photos/50', content: 'Hello world!', image: 'https://picsum.photos/200', likes: 5, comments: [], timestamp: '2h ago' },
  { id: '2', user: 'jane_smith', profilePic: 'https://picsum.photos/50', content: 'Beautiful day!', image: 'https://picsum.photos/200', likes: 8, comments: [], timestamp: '1h ago' },
];

// Home Feed Screen
function HomeScreen({ navigation }) {
  const [posts, setPosts] = useState(dummyPosts);

  const likePost = async (id) => {
    const newPosts = posts.map(post => 
      post.id === id ? { ...post, likes: post.likes + 1 } : post
    );
    setPosts(newPosts);
    await AsyncStorage.setItem('posts', JSON.stringify(newPosts));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const storedPosts = await AsyncStorage.getItem('posts');
    if (storedPosts) setPosts(JSON.parse(storedPosts));
  };

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
        <Text>{item.user}</Text>
      </View>
      {item.image && <Image source={{ uri: item.image }} style={styles.postImage} />}
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity onPress={() => likePost(item.id)}>
          <Ionicons name="heart-outline" size={24} /> 
          <Text>{item.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Comments', { postId: item.id })}>
          <Ionicons name="chatbubble-outline" size={24} />
        </TouchableOpacity>
        <TouchableOpacity><Ionicons name="bookmark-outline" size={24} /></TouchableOpacity>
      </View>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </View>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={item => item.id}
      style={styles.container}
    />
  );
}

// Create Post Screen
function CreatePostScreen({ navigation }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('Public');

  const submitPost = async () => {
    const newPost = {
      id: Date.now().toString(),
      user: 'current_user',
      profilePic: 'https://picsum.photos/50',
      content,
      image: 'https://picsum.photos/200',
      likes: 0,
      comments: [],
      timestamp: 'Just now'
    };
    const existingPosts = await AsyncStorage.getItem('posts');
    const posts = existingPosts ? JSON.parse(existingPosts) : dummyPosts;
    posts.unshift(newPost);
    await AsyncStorage.setItem('posts', JSON.stringify(posts));
    alert('Post created!');
    setContent('');
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <View style={styles.visibilityContainer}>
        <Text>Visibility: </Text>
        {['Public', 'Friends', 'Private'].map(option => (
          <TouchableOpacity 
            key={option} 
            style={[styles.visibilityOption, visibility === option && styles.selectedOption]}
            onPress={() => setVisibility(option)}
          >
            <Text>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.postButton} onPress={submitPost}>
        <Text style={styles.buttonText}>Post</Text>
      </TouchableOpacity>
    </View>
  );
}

// Explore Screen
function ExploreScreen() {
  const [search, setSearch] = useState('');
  const suggestions = ['user1', 'user2', 'user3'];

  return (
    <View style={styles.container}>
      <TextInput style={styles.searchBar} placeholder="Search..." value={search} onChangeText={setSearch} />
      <Text style={styles.title}>Suggestions</Text>
      {suggestions.map(user => (
        <View key={user} style={styles.suggestionItem}>
          <Text>{user}</Text>
          <TouchableOpacity style={styles.followButton}><Text>Follow</Text></TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// Notifications Screen
function NotificationsScreen() {
  const notifications = [
    { id: '1', text: 'John liked your post', time: '1h ago' },
    { id: '2', text: 'Jane followed you', time: '2h ago' },
  ];

  return (
    <FlatList
      data={notifications}
      renderItem={({ item }) => (
        <View style={styles.notificationItem}>
          <Text>{item.text}</Text>
          <Text>{item.time}</Text>
        </View>
      )}
      keyExtractor={item => item.id}
      style={styles.container}
    />
  );
}

// Messages Screen
function MessagesScreen() {
  const [messages, setMessages] = useState([
    { id: '1', user: 'friend1', text: 'Hey there!', time: '10:00' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (newMessage) {
      setMessages([...messages, { id: Date.now().toString(), user: 'me', text: newMessage, time: 'Now' }]);
      setNewMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={[styles.messageItem, item.user === 'me' && styles.myMessage]}>
            <Text>{item.text}</Text>
            <Text>{item.time}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
      />
      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={sendMessage}><Ionicons name="send" size={24} /></TouchableOpacity>
      </View>
    </View>
  );
}

// Profile Screen
function ProfileScreen() {
  const [profile, setProfile] = useState({ name: 'Sohaib satti', bio: 'AUIC!', email: 'sohaibmaqsood36@gmail.com' });
  const [isEditing, setIsEditing] = useState(false);
  const [posts] = useState(dummyPosts.filter(post => post.user === 'current_user'));

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
      <View style={styles.container}>
        <TextInput style={styles.input} value={profile.name} onChangeText={text => setProfile({ ...profile, name: text })} />
        <TextInput style={styles.input} value={profile.bio} onChangeText={text => setProfile({ ...profile, bio: text })} />
        <TextInput style={styles.input} value={profile.email} onChangeText={text => setProfile({ ...profile, email: text })} />
        <TouchableOpacity style={styles.postButton} onPress={saveProfile}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: 'https://picsum.photos/100' }} style={styles.profilePicLarge} />
      <Text style={styles.profileName}>{profile.name}</Text>
      <Text>{profile.bio}</Text>
      <Text>{profile.email}</Text>
      <Text>Posts: {posts.length}  Followers: 100  Following: 150</Text>
      <TouchableOpacity style={styles.postButton} onPress={() => setIsEditing(true)}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <Image source={{ uri: item.image }} style={styles.profilePostImage} />
        )}
        keyExtractor={item => item.id}
        numColumns={3}
      />
    </ScrollView>
  );
}

// Comments Screen (Nested Navigator)
function CommentsScreen({ route }) {
  const { postId } = route.params;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const addComment = async () => {
    if (newComment) {
      const updatedComments = [...comments, { id: Date.now().toString(), text: newComment, user: 'current_user' }];
      setComments(updatedComments);
      setNewComment('');
      const posts = JSON.parse(await AsyncStorage.getItem('posts') || JSON.stringify(dummyPosts));
      const updatedPosts = posts.map(post => 
        post.id === postId ? { ...post, comments: updatedComments } : post
      );
      await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <Text>{item.user}: {item.text}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
      />
      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
        />
        <TouchableOpacity onPress={addComment}><Ionicons name="send" size={24} /></TouchableOpacity>
      </View>
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
            else if (route.name === 'Explore') iconName = 'search';
            else if (route.name === 'Post') iconName = 'add-circle';
            else if (route.name === 'Messages') iconName = 'chatbubbles';
            else if (route.name === 'Profile') iconName = 'person';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Explore" component={ExploreScreen} />
        <Tab.Screen name="Post" component={CreatePostScreen} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="Comments" component={CommentsScreen} options={{ tabBarButton: () => null }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profilePicLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  profilePostImage: {
    width: 100,
    height: 100,
    margin: 5,
  },
  postContent: {
    marginBottom: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  visibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  visibilityOption: {
    padding: 8,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#007bff',
    color: '#fff',
  },
  postButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  followButton: {
    backgroundColor: '#007bff',
    padding: 5,
    borderRadius: 5,
  },
  notificationItem: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  messageItem: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  myMessage: {
    backgroundColor: '#007bff',
    color: '#fff',
    alignSelf: 'flex-end',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
  commentItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});