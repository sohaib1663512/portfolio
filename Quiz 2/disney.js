import React, { useState, useEffect, useContext, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Switch,
  Platform,
  AccessibilityInfo,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Video } from 'expo-av';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

// Constants
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLORS = {
  primary: '#007BFF',
  background: '#1a1a2e',
  cardBackground: 'rgba(255, 255, 255, 0.15)',
  text: '#FFFFFF',
  grey: '#A9A9A9',
  accent: '#FFD700',
  gradient: ['#1a1a2e', '#2a2a4e'],
  highContrast: {
    background: '#000000',
    text: '#FFFFFF',
    primary: '#00BFFF',
    cardBackground: '#222222',
  },
  light: {
    background: '#FFFFFF',
    cardBackground: '#F0F0F0',
    text: '#000000',
    primary: '#007BFF',
    grey: '#666666',
    gradient: ['#FFFFFF', '#E0E0E0'],
  },
  fallbackBackground: '#1a1a2e', // Fallback if LinearGradient fails
};

const API_BASE_URL = 'https://api.disneyapi.dev';
const API_ENDPOINT = `${API_BASE_URL}/character`;

const TRAILER_MAP = {
  'Mickey Mouse': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Donald Duck': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Goofy': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

const TRANSLATIONS = {
  English: {
    welcome: 'Welcome to Disney Movies',
    search: 'Search Movies',
    watchlist: 'My Watchlist',
    profile: 'Profile',
    settings: 'Settings',
    continueWatching: 'Continue Watching',
    featured: 'Featured',
    trending: 'Trending',
    newReleases: 'New Releases',
    recommended: 'Recommended for You',
  },
  Spanish: {
    welcome: 'Bienvenido a Disney Movies',
    search: 'Buscar Películas',
    watchlist: 'Mi Lista',
    profile: 'Perfil',
    settings: 'Configuración',
    continueWatching: 'Continuar Viendo',
    featured: 'Destacado',
    trending: 'Tendencias',
    newReleases: 'Nuevos Lanzamientos',
    recommended: 'Recomendado para Ti',
  },
  French: {
    welcome: 'Bienvenue sur Disney Movies',
    search: 'Rechercher des Films',
    watchlist: 'Ma Liste',
    profile: 'Profil',
    settings: 'Paramètres',
    continueWatching: 'Continuer à Regarder',
    featured: 'En Vedette',
    trending: 'Tendances',
    newReleases: 'Nouvelles Sorties',
    recommended: 'Recommandé pour Vous',
  },
};

// Contexts
const AuthContext = createContext();
const WatchlistContext = createContext();
const SettingsContext = createContext();
const ProfileContext = createContext();

// Providers
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    if (email && password) {
      const userData = {
        email,
        name: email.split('@')[0],
        profiles: [{ id: '1', name: 'Default', avatar: 'https://via.placeholder.com/50' }],
      };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
      trackEvent('login', { email });
      return true;
    }
    return false;
  };

  const register = async (email, password, name) => {
    if (email && password && name) {
      const userData = {
        email,
        name,
        profiles: [{ id: '1', name: 'Default', avatar: 'https://via.placeholder.com/50' }],
      };
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setIsAuthenticated(true);
      setUser(userData);
      trackEvent('register', { email, name });
      return true;
    }
    return false;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    trackEvent('logout', {});
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([]);

  const addToWatchlist = (movie) => {
    setWatchlist((prev) => {
      if (!prev.find((item) => item.id === movie.id)) {
        trackEvent('add_to_watchlist', { movieId: movie.id, title: movie.title });
        return [...prev, movie];
      }
      return prev;
    });
  };

  const removeFromWatchlist = (movieId) => {
    setWatchlist((prev) => {
      trackEvent('remove_from_watchlist', { movieId });
      return prev.filter((item) => item.id !== movieId);
    });
  };

  const isInWatchlist = (movieId) => {
    return watchlist.some((item) => item.id === movieId);
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};

const SettingsProvider = ({ children }) => {
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [isParentalControl, setIsParentalControl] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [language, setLanguage] = useState('English');
  const [dataSaver, setDataSaver] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const onboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      if (onboarding) setHasSeenOnboarding(true);
    };
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        isKidsMode,
        setIsKidsMode,
        isParentalControl,
        setIsParentalControl,
        isHighContrast,
        setIsHighContrast,
        isLightTheme,
        setIsLightTheme,
        language,
        setLanguage,
        dataSaver,
        setDataSaver,
        hasSeenOnboarding,
        setHasSeenOnboarding,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

const ProfileProvider = ({ children }) => {
  const [activeProfile, setActiveProfile] = useState(null);
  const [continueWatching, setContinueWatching] = useState([]);
  const [history, setHistory] = useState([]);

  const addToContinueWatching = (movie, progress) => {
    setContinueWatching((prev) => {
      const existing = prev.find((item) => item.movie.id === movie.id);
      if (existing) {
        return prev.map((item) => (item.movie.id === movie.id ? { ...item, progress } : item));
      }
      trackEvent('continue_watching', { movieId: movie.id, progress });
      return [...prev, { movie, progress }];
    });
  };

  const addToHistory = (movie) => {
    setHistory((prev) => {
      if (!prev.find((item) => item.id === movie.id)) {
        trackEvent('view_movie', { movieId: movie.id, title: movie.title });
        return [...prev, movie];
      }
      return prev;
    });
  };

  return (
    <ProfileContext.Provider value={{ activeProfile, setActiveProfile, continueWatching, addToContinueWatching, history, addToHistory }}>
      {children}
    </ProfileContext.Provider>
  );
};

// Mock Analytics
const trackEvent = (event, properties) => {
  console.log(`Analytics: ${event}`, properties);
};

// Components
const MovieCard = ({ movie, onPress, isKidsMode, isHighContrast, isLightTheme, addToWatchlist, removeFromWatchlist, isInWatchlist }) => {
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const inWatchlist = isInWatchlist(movie.id);

  const swipeGesture = Gesture.Pan()
    .onEnd((e) => {
      if (e.translationX > 100) {
        if (!inWatchlist) {
          addToWatchlist(movie);
          alert(`${movie.title} added to watchlist`);
        }
      } else if (e.translationX < -100) {
        if (inWatchlist) {
          removeFromWatchlist(movie.id);
          alert(`${movie.title} removed from watchlist`);
        }
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View entering={ZoomIn} exiting={FadeOut}>
        <TouchableOpacity
          style={[styles.movieCard, isKidsMode && styles.kidsModeCard, isHighContrast && styles.highContrastCard, isLightTheme && styles.lightThemeCard]}
          onPress={() => {
            if (Haptics && Platform.OS !== 'web') {
              Haptics.selectionAsync().catch(() => {});
            }
            onPress();
          }}
        >
          <Image
            source={{ uri: movie.imageUrl || 'https://via.placeholder.com/150' }}
            style={styles.moviePoster}
            resizeMode="cover"
          />
          <Text style={[styles.movieTitle, isKidsMode && styles.kidsModeText, { color: theme.text }]}>
            {movie.title}
          </Text>
          {!isKidsMode && (
            <Text style={[styles.movieGenre, { color: theme.grey }]}>{movie.genre || 'Unknown'}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
};

const CategoryFilter = ({ categories, selectedCategory, onSelect, isHighContrast, isLightTheme }) => {
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryButton,
            selectedCategory === category && styles.categoryButtonSelected,
            isHighContrast && styles.highContrastButton,
            isLightTheme && styles.lightThemeButton,
            selectedCategory === category && isLightTheme && styles.lightThemeButtonSelected,
          ]}
          onPress={() => {
            trackEvent('select_category', { category });
            onSelect(category);
          }}
        >
          <Text style={[styles.categoryText, { color: theme.text }]}>{category}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const VideoPlayer = ({ uri, isFullscreen, setIsFullscreen, movie, addToContinueWatching, isAutoplay }) => {
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(isAutoplay);

  useEffect(() => {
    if (isAutoplay && progress > 0) {
      alert('Playing in background (mocked live activity)');
    }
  }, [progress, isAutoplay]);

  return (
    <View>
      <Video
        source={{ uri: uri || 'https://www.w3schools.com/html/mov_bbb.mp4' }}
        style={isFullscreen ? styles.fullscreenVideo : styles.videoPlayer}
        useNativeControls
        resizeMode="contain"
        isLooping
        shouldPlay={isAutoplay}
        isMuted={isMuted}
        onPlaybackStatusUpdate={(status) => {
          if (status.isPlaying && status.durationMillis) {
            const progressPercent = (status.positionMillis / status.durationMillis) * 100;
            setProgress(progressPercent);
            addToContinueWatching(movie, progressPercent);
            trackEvent('video_play', { movieId: movie.id, progress: progressPercent });
          }
        }}
      />
      <View style={styles.videoControls}>
        <TouchableOpacity style={styles.fullscreenButton} onPress={() => setIsFullscreen(!isFullscreen)}>
          <Text style={styles.fullscreenButtonText}>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</Text>
        </TouchableOpacity>
        {isAutoplay && (
          <TouchableOpacity style={styles.muteButton} onPress={() => setIsMuted(!isMuted)}>
            <Text style={styles.muteButtonText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const LoadingSpinner = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

const Footer = ({ isHighContrast, isLightTheme, toggleTheme, toggleContrast }) => {
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;

  return (
    <View style={[styles.footerContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.footerText, { color: theme.grey }]}>Disney Movies App v1.0.0</Text>
      <Text style={[styles.footerText, { color: theme.grey }]}>© 2025 Disney. All Rights Reserved.</Text>
      <View style={styles.footerLinks}>
        {['Terms', 'Privacy', 'Contact', 'FAQ', 'Support', 'Careers'].map((link) => (
          <TouchableOpacity key={link} onPress={() => trackEvent('footer_link', { link })}>
            <Text style={[styles.footerLink, { color: theme.accent || COLORS.accent }]}>{link}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.socialIcons}>
        {['logo-facebook', 'logo-twitter', 'logo-instagram', 'logo-youtube', 'logo-tiktok'].map((icon) => (
          <Ionicons
            key={icon}
            name={icon}
            size={20}
            color={theme.grey}
            style={styles.socialIcon}
            onPress={() => trackEvent('social_click', { platform: icon })}
          />
        ))}
      </View>
      <View style={styles.themeToggles}>
        <TouchableOpacity style={styles.themeToggle} onPress={() => { toggleTheme(); trackEvent('toggle_theme', { theme: isLightTheme ? 'dark' : 'light' }); }}>
          <Text style={[styles.footerText, { color: theme.grey }]}>
            {isLightTheme ? 'Dark Theme' : 'Light Theme'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.themeToggle} onPress={() => { toggleContrast(); trackEvent('toggle_contrast', { contrast: isHighContrast ? 'normal' : 'high' }); }}>
          <Text style={[styles.footerText, { color: theme.grey }]}>
            {isHighContrast ? 'Normal Contrast' : 'High Contrast'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const OnboardingScreen = ({ navigation, setHasSeenOnboarding, language }) => {
  const [step, setStep] = useState(0);
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const steps = [
    { title: t.welcome, description: 'Discover magical Disney movies.' },
    { title: 'Personalize', description: 'Create profiles for everyone.' },
    { title: 'Enjoy', description: 'Watch, save, and share your favorites.' },
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      trackEvent('onboarding_next', { step: step + 1 });
    } else {
      setHasSeenOnboarding(true);
      AsyncStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('Auth');
      trackEvent('onboarding_complete', {});
    }
  };

  return (
    <LinearGradient colors={COLORS.gradient} style={styles.screenContainer} locations={[0, 1]}>
      <Animated.View entering={FadeIn}>
        <Text style={styles.screenTitle}>{steps[step].title}</Text>
        <Text style={styles.onboardingText}>{steps[step].description}</Text>
        <View style={styles.stepIndicator}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.stepDot, i === step && styles.stepDotActive]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.authButton} onPress={nextStep}>
          <Text style={styles.authButtonText}>{step < steps.length - 1 ? 'Next' : 'Get Started'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

// Screens
const ProfileSelectScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { setActiveProfile } = useContext(ProfileContext);
  const { isHighContrast, isLightTheme, language } = useContext(SettingsContext);
  const [newProfileName, setNewProfileName] = useState('');
  const [avatarUri, setAvatarUri] = useState('https://via.placeholder.com/50');
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  const addProfile = async () => {
    if (newProfileName) {
      const newProfile = {
        id: Date.now().toString(),
        name: newProfileName,
        avatar: avatarUri,
      };
      const updatedUser = { ...user, profiles: [...user.profiles, newProfile] };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setActiveProfile(newProfile);
      trackEvent('add_profile', { profileName: newProfileName });
      navigation.replace('Main');
    }
  };

  const selectAvatar = () => {
    alert('Avatar selection opened (mocked)');
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>{t.profile}</Text>
      <FlatList
        data={user?.profiles || []}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.profileCard, isLightTheme && styles.lightThemeCard]}
            onPress={() => {
              setActiveProfile(item);
              trackEvent('select_profile', { profileId: item.id });
              navigation.replace('Main');
            }}
          >
            <Image source={{ uri: item.avatar }} style={styles.profileAvatar} />
            <Text style={[styles.profileName, { color: theme.text }]}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.profileList}
      />
      <TextInput
        style={[styles.input, isHighContrast && styles.highContrastInput, isLightTheme && styles.lightThemeInput]}
        placeholder="New Profile Name"
        placeholderTextColor={theme.grey}
        value={newProfileName}
        onChangeText={setNewProfileName}
      />
      <TouchableOpacity style={styles.avatarButton} onPress={selectAvatar}>
        <Text style={styles.avatarButtonText}>Choose Avatar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.authButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
        onPress={addProfile}
      >
        <Text style={styles.authButtonText}>Add Profile</Text>
      </TouchableOpacity>
      <Footer
        isHighContrast={isHighContrast}
        isLightTheme={isLightTheme}
        toggleTheme={() => {}}
        toggleContrast={() => {}}
      />
    </View>
  );
};

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const { login, register } = useContext(AuthContext);
  const { isHighContrast, isLightTheme, language } = useContext(SettingsContext);
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  const handleSubmit = async () => {
    if (isRegister) {
      if (await register(email, password, name)) {
        navigation.replace('ProfileSelect');
      } else {
        alert('Registration failed');
      }
    } else {
      if (await login(email, password)) {
        navigation.replace('ProfileSelect');
      } else {
        alert('Invalid credentials');
      }
    }
  };

  return (
    <View style={[styles.authContainer, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeIn}>
        <Text style={[styles.authTitle, { color: theme.text }]}>
          {isRegister ? 'Join Disney Movies' : t.welcome}
        </Text>
        {isRegister && (
          <TextInput
            style={[styles.input, isHighContrast && styles.highContrastInput, isLightTheme && styles.lightThemeInput]}
            placeholder="Name"
            placeholderTextColor={theme.grey}
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={[styles.input, isHighContrast && styles.highContrastInput, isLightTheme && styles.lightThemeInput]}
          placeholder="Email"
          placeholderTextColor={theme.grey}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, isHighContrast && styles.highContrastInput, isLightTheme && styles.lightThemeInput]}
          placeholder="Password"
          placeholderTextColor={theme.grey}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.authButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.authButtonText}>{isRegister ? 'Register' : 'Login'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
          <Text style={[styles.switchAuthText, { color: theme.accent || COLORS.accent }]}>
            {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <Footer
        isHighContrast={isHighContrast}
        isLightTheme={isLightTheme}
        toggleTheme={() => {}}
        toggleContrast={() => {}}
      />
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [movies, setMovies] = useState([]);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { watchlist, isInWatchlist, addToWatchlist, removeFromWatchlist } = useContext(WatchlistContext);
  const { isKidsMode, isHighContrast, isLightTheme, dataSaver, language } = useContext(SettingsContext);
  const { continueWatching, history } = useContext(ProfileContext);
  const categories = ['All', 'Animation', 'Adventure', 'Family'];
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const scrollY = new RNAnimated.Value(0);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const cacheKey = `movies_page_${page}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData && !dataSaver) {
          const movieData = JSON.parse(cachedData);
          setMovies((prev) => [...prev, ...movieData]);
          setFeaturedMovies(movieData.slice(0, 3));
          setTrendingMovies(movieData.slice(3, 6));
          setNewReleases(movieData.slice(6, 9));
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_ENDPOINT}?page=${page}`);
        const movieData = response.data.data.map((item) => ({
          id: item._id.toString(),
          title: item.name || 'Unknown',
          genre: item.films?.length > 0 ? item.films[0].split(' ')[0] : 'Unknown',
          rating: 'N/A',
          imageUrl: item.imageUrl || 'https://via.placeholder.com/150',
          synopsis: item.films?.join(', ') || 'No synopsis available.',
          trailer: TRAILER_MAP[item.name] || 'https://www.w3schools.com/html/mov_bbb.mp4',
          cast: ['Unknown'],
        }));
        setMovies((prev) => [...prev, ...movieData]);
        setFeaturedMovies(movieData.slice(0, 3));
        setTrendingMovies(movieData.slice(3, 6));
        setNewReleases(movieData.slice(6, 9));
        await AsyncStorage.setItem(cacheKey, JSON.stringify(movieData));
        setLoading(false);
        if (page === 1) {
          alert('New movies available! (Mocked notification)');
          trackEvent('new_movies_notification', { page });
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        setError('Failed to load movies. Please try again.');
        setLoading(false);
      }
    };

    fetchMovies();
  }, [page, dataSaver]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const getRecommendations = () => {
    const genres = [...new Set([...watchlist.map((m) => m.genre), ...history.map((m) => m.genre)])];
    return movies.filter((movie) => genres.includes(movie.genre) && !isInWatchlist(movie.id)).slice(0, 5);
  };

  const filteredMovies = selectedCategory === 'All' ? movies : movies.filter((movie) => movie.genre === selectedCategory);
  const recommendations = getRecommendations();

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -100],
    extrapolate: 'clamp',
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
        <RNAnimated.View
          style={[styles.parallaxHeader, { transform: [{ translateY: headerTranslateY }] }]}
        >
          <Image
            source={{ uri: featuredMovies[0]?.imageUrl || 'https://via.placeholder.com/400' }}
            style={styles.parallaxImage}
            resizeMode="cover"
          />
          <LinearGradient colors={['transparent', theme.background]} style={styles.parallaxOverlay} locations={[0, 1]}>
            <Text style={[styles.parallaxTitle, { color: theme.text }]}>{featuredMovies[0]?.title || t.featured}</Text>
          </LinearGradient>
        </RNAnimated.View>
        <RNAnimated.ScrollView
          onScroll={RNAnimated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.contentContainer}>
            <Text style={[styles.screenTitle, { color: theme.text }]}>{t.welcome}</Text>
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
              isHighContrast={isHighContrast}
              isLightTheme={isLightTheme}
            />
            {error && (
              <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            )}
            {loading && page === 1 ? (
              <LoadingSpinner />
            ) : (
              <>
                {continueWatching.length > 0 && !isKidsMode && (
                  <>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.continueWatching}</Text>
                    <FlatList
                      data={continueWatching}
                      renderItem={({ item }) => (
                        <MovieCard
                          movie={item.movie}
                          onPress={() => navigation.navigate('MovieDetail', { movie: item.movie })}
                          isKidsMode={isKidsMode}
                          isHighContrast={isHighContrast}
                          isLightTheme={isLightTheme}
                          addToWatchlist={addToWatchlist}
                          removeFromWatchlist={removeFromWatchlist}
                          isInWatchlist={isInWatchlist}
                        />
                      )}
                      keyExtractor={(item) => item.movie.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.featuredList}
                    />
                  </>
                )}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.featured}</Text>
                <FlatList
                  data={featuredMovies}
                  renderItem={({ item }) => (
                    <MovieCard
                      movie={item}
                      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
                      isKidsMode={isKidsMode}
                      isHighContrast={isHighContrast}
                      isLightTheme={isLightTheme}
                      addToWatchlist={addToWatchlist}
                      removeFromWatchlist={removeFromWatchlist}
                      isInWatchlist={isInWatchlist}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.featuredList}
                />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.trending}</Text>
                <FlatList
                  data={trendingMovies}
                  renderItem={({ item }) => (
                    <MovieCard
                      movie={item}
                      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
                      isKidsMode={isKidsMode}
                      isHighContrast={isHighContrast}
                      isLightTheme={isLightTheme}
                      addToWatchlist={addToWatchlist}
                      removeFromWatchlist={removeFromWatchlist}
                      isInWatchlist={isInWatchlist}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.featuredList}
                />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.newReleases}</Text>
                <FlatList
                  data={newReleases}
                  renderItem={({ item }) => (
                    <MovieCard
                      movie={item}
                      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
                      isKidsMode={isKidsMode}
                      isHighContrast={isHighContrast}
                      isLightTheme={isLightTheme}
                      addToWatchlist={addToWatchlist}
                      removeFromWatchlist={removeFromWatchlist}
                      isInWatchlist={isInWatchlist}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.featuredList}
                />
                {recommendations.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.recommended}</Text>
                    <FlatList
                      data={recommendations}
                      renderItem={({ item }) => (
                        <MovieCard
                          movie={item}
                          onPress={() => navigation.navigate('MovieDetail', { movie: item })}
                          isKidsMode={isKidsMode}
                          isHighContrast={isHighContrast}
                          isLightTheme={isLightTheme}
                          addToWatchlist={addToWatchlist}
                          removeFromWatchlist={removeFromWatchlist}
                          isInWatchlist={isInWatchlist}
                        />
                      )}
                      keyExtractor={(item) => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.featuredList}
                    />
                  </>
                )}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>All Movies</Text>
                <FlatList
                  data={filteredMovies}
                  renderItem={({ item }) => (
                    <MovieCard
                      movie={item}
                      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
                      isKidsMode={isKidsMode}
                      isHighContrast={isHighContrast}
                      isLightTheme={isLightTheme}
                      addToWatchlist={addToWatchlist}
                      removeFromWatchlist={removeFromWatchlist}
                      isInWatchlist={isInWatchlist}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  contentContainerStyle={styles.movieList}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.5}
                  ListFooterComponent={loading && page > 1 ? <ActivityIndicator color={theme.primary} /> : null}
                />
                <Footer
                  isHighContrast={isHighContrast}
                  isLightTheme={isLightTheme}
                  toggleTheme={() => setIsLightTheme(!isLightTheme)}
                  toggleContrast={() => setIsHighContrast(!isHighContrast)}
                />
              </>
            )}
          </View>
        </RNAnimated.ScrollView>
      </View>
    </GestureHandlerRootView>
  );
};

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [genreFilter, setGenreFilter] = useState('All');
  const { isKidsMode, isHighContrast, isLightTheme, language } = useContext(SettingsContext);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useContext(WatchlistContext);
  const genres = ['All', 'Animation', 'Adventure', 'Family'];
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  useEffect(() => {
    const fetchMovies = async () => {
      if (!searchQuery) {
        setFilteredMovies([]);
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const cacheKey = `search_${searchQuery}_${genreFilter}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          const data = JSON.parse(cachedData);
          setFilteredMovies(data.filtered);
          setSuggestions(data.suggestions);
          setLoading(false);
          return;
        }

        const response = await axios.get(API_ENDPOINT);
        const movieData = response.data.data.map((item) => ({
          id: item._id.toString(),
          title: item.name || 'Unknown',
          genre: item.films?.length > 0 ? item.films[0].split(' ')[0] : 'Unknown',
          rating: 'N/A',
          imageUrl: item.imageUrl || 'https://via.placeholder.com/150',
          synopsis: item.films?.join(', ') || 'No synopsis available.',
          trailer: TRAILER_MAP[item.name] || 'https://www.w3schools.com/html/mov_bbb.mp4',
        }));
        const filtered = movieData.filter((movie) =>
          movie.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (genreFilter === 'All' || movie.genre === genreFilter)
        );
        setFilteredMovies(filtered);
        setSuggestions(movieData.slice(0, 5).map((m) => m.title));
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ filtered, suggestions: movieData.slice(0, 5).map((m) => m.title) }));
        trackEvent('search', { query: searchQuery, genre: genreFilter });
      } catch (error) {
        console.error('Error searching movies:', error);
        setError('Failed to search movies.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [searchQuery, genreFilter]);

  const handleVoiceSearch = () => {
    alert('Voice search activated (mocked)');
    trackEvent('voice_search', {});
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>{t.search}</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, isHighContrast && styles.highContrastInput, isLightTheme && styles.lightThemeInput]}
            placeholder="Search for a movie..."
            placeholderTextColor={theme.grey}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.voiceButton} onPress={handleVoiceSearch}>
            <Ionicons name="mic" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <CategoryFilter
          categories={genres}
          selectedCategory={genreFilter}
          onSelect={setGenreFilter}
          isHighContrast={isHighContrast}
          isLightTheme={isLightTheme}
        />
        {error && (
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
        )}
        {searchQuery.length > 0 && suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setSearchQuery(item)}>
                <Text style={[styles.suggestionText, { color: theme.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
            style={[styles.suggestionList, isHighContrast && styles.highContrastCard, isLightTheme && styles.lightThemeCard]}
          />
        )}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <FlatList
            data={filteredMovies}
            renderItem={({ item }) => (
              <MovieCard
                movie={item}
                onPress={() => navigation.navigate('MovieDetail', { movie: item })}
                isKidsMode={isKidsMode}
                isHighContrast={isHighContrast}
                isLightTheme={isLightTheme}
                addToWatchlist={addToWatchlist}
                removeFromWatchlist={removeFromWatchlist}
                isInWatchlist={isInWatchlist}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.movieList}
            ListFooterComponent={
              <Footer
                isHighContrast={isHighContrast}
                isLightTheme={isLightTheme}
                toggleTheme={() => setIsLightTheme(!isLightTheme)}
                toggleContrast={() => setIsHighContrast(!isHighContrast)}
              />
            }
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const MovieDetailScreen = ({ route, navigation }) => {
  const { movie } = route.params;
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useContext(WatchlistContext);
  const { isKidsMode, isHighContrast, isLightTheme, language } = useContext(SettingsContext);
  const { addToContinueWatching, addToHistory } = useContext(ProfileContext);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const inWatchlist = isInWatchlist(movie.id);
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const relatedMovies = [
    { id: 'related1', title: 'Related Movie 1', genre: movie.genre, imageUrl: 'https://via.placeholder.com/150' },
    { id: 'related2', title: 'Related Movie 2', genre: movie.genre, imageUrl: 'https://via.placeholder.com/150' },
  ];

  useEffect(() => {
    addToHistory(movie);
  }, [movie]);

  const handleDownload = () => {
    alert('Downloading... 50% complete (mocked)');
    trackEvent('download', { movieId: movie.id });
  };

  const handleShare = () => {
    alert(`Shared ${movie.title} (mocked)`);
    trackEvent('share', { movieId: movie.id });
  };

  const handleWatchParty = () => {
    alert('Watch party started (mocked)');
    trackEvent('watch_party', { movieId: movie.id });
  };

  const handleBackgroundPlay = () => {
    alert('Background playback enabled (mocked)');
    trackEvent('background_play', { movieId: movie.id });
  };

  const submitReview = () => {
    alert(`Rated ${rating}/5: ${review} (mocked)`);
    trackEvent('submit_review', { movieId: movie.id, rating, review });
    setReview('');
    setRating(0);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
        <ScrollView>
          <Animated.View entering={FadeIn}>
            <Image source={{ uri: movie.imageUrl || 'https://via.placeholder.com/150' }} style={styles.detailPoster} />
            <Text style={[styles.detailTitle, { color: theme.text }]}>{movie.title}</Text>
            <Text style={[styles.detailGenre, { color: theme.grey }]}>{movie.genre} | Rating: {movie.rating}</Text>
            {!isKidsMode && (
              <>
                <VideoPlayer
                  uri={movie.trailer}
                  isFullscreen={isFullscreen}
                  setIsFullscreen={setIsFullscreen}
                  movie={movie}
                  addToContinueWatching={addToContinueWatching}
                  isAutoplay={true}
                />
                <Text style={[styles.detailSynopsis, { color: theme.text }]}>{movie.synopsis}</Text>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Cast</Text>
                <Text style={[styles.detailText, { color: theme.text }]}>{movie.cast?.join(', ') || 'Unknown'}</Text>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.watchlistButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
                    onPress={() => (inWatchlist ? removeFromWatchlist(movie.id) : addToWatchlist(movie))}
                  >
                    <Text style={styles.watchlistButtonText}>
                      {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.downloadButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
                    onPress={handleDownload}
                  >
                    <Text style={styles.downloadButtonText}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.shareButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
                    onPress={handleShare}
                  >
                    <Text style={styles.shareButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.shareButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
                    onPress={handleWatchParty}
                  >
                    <Text style={styles.shareButtonText}>Watch Party</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.shareButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
                    onPress={handleBackgroundPlay}
                  >
                    <Text style={styles.shareButtonText}>Background Play</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Rate & Review</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={24}
                        color={theme.accent || COLORS.accent}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, isHighContrast && styles.highContrastInput, isLightTheme && styles.lightThemeInput]}
                  placeholder="Write a review..."
                  placeholderTextColor={theme.grey}
                  value={review}
                  onChangeText={setReview}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.authButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
                  onPress={submitReview}
                >
                  <Text style={styles.authButtonText}>Submit Review</Text>
                </TouchableOpacity>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Related Movies</Text>
                <FlatList
                  data={relatedMovies}
                  renderItem={({ item }) => (
                    <MovieCard
                      movie={item}
                      onPress={() => navigation.navigate('MovieDetail', { movie: item })}
                      isKidsMode={isKidsMode}
                      isHighContrast={isHighContrast}
                      isLightTheme={isLightTheme}
                      addToWatchlist={addToWatchlist}
                      removeFromWatchlist={removeFromWatchlist}
                      isInWatchlist={isInWatchlist}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.featuredList}
                />
              </>
            )}
            <Footer
              isHighContrast={isHighContrast}
              isLightTheme={isLightTheme}
              toggleTheme={() => setIsLightTheme(!isLightTheme)}
              toggleContrast={() => setIsHighContrast(!isHighContrast)}
            />
          </Animated.View>
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
};

const WatchlistScreen = ({ navigation }) => {
  const { watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useContext(WatchlistContext);
  const { isKidsMode, isHighContrast, isLightTheme, language } = useContext(SettingsContext);
  const genres = ['All', ...new Set(watchlist.map((m) => m.genre))];
  const [selectedGenre, setSelectedGenre] = useState('All');
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  const filteredWatchlist = selectedGenre === 'All' ? watchlist : watchlist.filter((m) => m.genre === selectedGenre);

  const handleShare = () => {
    alert('Watchlist shared (mocked)');
    trackEvent('share_watchlist', {});
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>{t.watchlist}</Text>
        <CategoryFilter
          categories={genres}
          selectedCategory={selectedGenre}
          onSelect={setSelectedGenre}
          isHighContrast={isHighContrast}
          isLightTheme={isLightTheme}
        />
        <TouchableOpacity
          style={[styles.shareButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
          onPress={handleShare}
        >
          <Text style={styles.shareButtonText}>Share Watchlist</Text>
        </TouchableOpacity>
        <FlatList
          data={filteredWatchlist}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={() => navigation.navigate('MovieDetail', { movie: item })}
              isKidsMode={isKidsMode}
              isHighContrast={isHighContrast}
              isLightTheme={isLightTheme}
              addToWatchlist={addToWatchlist}
              removeFromWatchlist={removeFromWatchlist}
              isInWatchlist={isInWatchlist}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.movieList}
          ListFooterComponent={
            <Footer
              isHighContrast={isHighContrast}
              isLightTheme={isLightTheme}
              toggleTheme={() => setIsLightTheme(!isLightTheme)}
              toggleContrast={() => setIsHighContrast(!isHighContrast)}
            />
          }
        />
      </View>
    </GestureHandlerRootView>
  );
};

const SettingsScreen = () => {
  const {
    isKidsMode,
    setIsKidsMode,
    isParentalControl,
    setIsParentalControl,
    isHighContrast,
    setIsHighContrast,
    isLightTheme,
    setIsLightTheme,
    language,
    setLanguage,
    dataSaver,
    setDataSaver,
  } = useContext(SettingsContext);
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;
  const languages = ['English', 'Spanish', 'French'];

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>{t.settings}</Text>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
      <View style={styles.settingRow}>
        <Text style={[styles.profileText, { color: theme.text }]}>Light Theme</Text>
        <Switch value={isLightTheme} onValueChange={setIsLightTheme} />
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.profileText, { color: theme.text }]}>High Contrast Mode</Text>
        <Switch value={isHighContrast} onValueChange={setIsHighContrast} />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Content</Text>
      <View style={styles.settingRow}>
        <Text style={[styles.profileText, { color: theme.text }]}>Kids Mode</Text>
        <Switch value={isKidsMode} onValueChange={setIsKidsMode} />
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.profileText, { color: theme.text }]}>Parental Controls</Text>
        <Switch value={isParentalControl} onValueChange={setIsParentalControl} />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
      <View style={styles.settingRow}>
        <Text style={[styles.profileText, { color: theme.text }]}>Language</Text>
        <View style={styles.languagePicker}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageButton,
                language === lang && styles.languageButtonSelected,
                isLightTheme && styles.lightThemeButton,
                language === lang && isLightTheme && styles.lightThemeButtonSelected,
              ]}
              onPress={() => {
                setLanguage(lang);
                trackEvent('change_language', { language: lang });
              }}
            >
              <Text style={[styles.languageText, { color: theme.text }]}>{lang}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.settingRow}>
        <Text style={[styles.profileText, { color: theme.text }]}>Data Saver</Text>
        <Switch value={dataSaver} onValueChange={setDataSaver} />
      </View>
      <Footer
        isHighContrast={isHighContrast}
        isLightTheme={isLightTheme}
        toggleTheme={() => setIsLightTheme(!isLightTheme)}
        toggleContrast={() => setIsHighContrast(!isHighContrast)}
      />
    </View>
  );
};

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const { isHighContrast, isLightTheme, language } = useContext(SettingsContext);
  const { history } = useContext(ProfileContext);
  const [name, setName] = useState(user?.name || '');
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  const handleSave = async () => {
    const updatedUser = { ...user, name };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    alert('Profile updated');
    trackEvent('update_profile', { name });
  };

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>{t.profile}</Text>
      <TextInput
        style={[styles.input, isHighContrast && styles.highContrastInput, isLightTheme && styles.lightThemeInput]}
        placeholder="Name"
        placeholderTextColor={theme.grey}
        value={name}
        onChangeText={setName}
      />
      <Text style={[styles.profileText, { color: theme.text }]}>Email: {user?.email}</Text>
      <TouchableOpacity
        style={[styles.authButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
        onPress={handleSave}
      >
        <Text style={styles.authButtonText}>Save Profile</Text>
      </TouchableOpacity>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Viewing History</Text>
      {history.map((item, index) => (
        <Text key={index} style={[styles.profileText, { color: theme.text }]}>{item.title}</Text>
      ))}
      <TouchableOpacity
        style={[styles.authButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
        onPress={() => navigation.navigate('ProfileSelect')}
      >
        <Text style={styles.authButtonText}>Switch Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.authButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.authButtonText}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.logoutButton, isHighContrast && styles.highContrastButton, isLightTheme && styles.lightThemeButton]}
        onPress={logout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      <Footer
        isHighContrast={isHighContrast}
        isLightTheme={isLightTheme}
        toggleTheme={() => setIsLightTheme(!isLightTheme)}
        toggleContrast={() => setIsHighContrast(!isHighContrast)}
      />
    </View>
  );
};

// Navigation
const BottomTabNavigator = () => {
  const Tab = createBottomTabNavigator();
  const { watchlist } = useContext(WatchlistContext);
  const { isKidsMode, isHighContrast, isLightTheme, language } = useContext(SettingsContext);
  const theme = isHighContrast ? COLORS.highContrast : isLightTheme ? COLORS.light : COLORS;
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Watchlist') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return (
            <Animated.View entering={FadeIn}>
              <Ionicons name={iconName} size={size} color={color} />
              {route.name === 'Watchlist' && watchlist.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{watchlist.length}</Text>
                </View>
              )}
            </Animated.View>
          );
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.grey,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: 'transparent',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabel: ({ focused }) => {
          const labels = {
            Home: t.welcome,
            Search: t.search,
            Watchlist: t.watchlist,
            Profile: t.profile,
          };
          return (
            <Text style={{ color: focused ? theme.primary : theme.grey, fontSize: 12 }}>
              {labels[route.name]}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarVisible: !isKidsMode }} />
      <Tab.Screen name="Watchlist" component={WatchlistScreen} options={{ tabBarVisible: !isKidsMode }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const Stack = createStackNavigator();
  const { isAuthenticated } = useContext(AuthContext);
  const { activeProfile } = useContext(ProfileContext);
  const { hasSeenOnboarding, setHasSeenOnboarding, language } = useContext(SettingsContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          <Stack.Screen
            name="Onboarding"
            component={(props) => (
              <OnboardingScreen {...props} setHasSeenOnboarding={setHasSeenOnboarding} language={language} />
            )}
          />
        ) : isAuthenticated ? (
          activeProfile ? (
            <>
              <Stack.Screen name="Main" component={BottomTabNavigator} />
              <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
              <Stack.Screen name="ProfileSelect" component={ProfileSelectScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </>
          ) : (
            <Stack.Screen name="ProfileSelect" component={ProfileSelectScreen} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App
export default function App() {
  useEffect(() => {
    const checkAccessibility = async () => {
      if (AccessibilityInfo.isScreenReaderEnabled) {
        const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        if (isScreenReaderEnabled) {
          alert('Screen reader detected. High contrast mode recommended.');
        }
      }
    };
    checkAccessibility();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <WatchlistProvider>
          <SettingsProvider>
            <ProfileProvider>
              <AppNavigator />
            </ProfileProvider>
          </SettingsProvider>
        </WatchlistProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// Styles
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 10,
  },
  contentContainer: {
    paddingTop: 220,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
  movieCard: {
    flex: 1,
    margin: 5,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  kidsModeCard: {
    backgroundColor: COLORS.accent,
    padding: 15,
  },
  highContrastCard: {
    backgroundColor: COLORS.highContrast.cardBackground,
    borderColor: COLORS.highContrast.text,
    borderWidth: 1,
  },
  lightThemeCard: {
    backgroundColor: COLORS.light.cardBackground,
  },
  moviePoster: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  kidsModeText: {
    fontSize: 18,
    color: COLORS.background,
  },
  movieGenre: {
    fontSize: 14,
  },
  categoryContainer: {
    marginVertical: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  highContrastButton: {
    backgroundColor: COLORS.highContrast.cardBackground,
    borderColor: COLORS.highContrast.text,
    borderWidth: 1,
  },
  lightThemeButton: {
    backgroundColor: COLORS.light.cardBackground,
  },
  lightThemeButtonSelected: {
    backgroundColor: COLORS.light.primary,
  },
  categoryText: {
    fontSize: 14,
  },
  videoPlayer: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 10,
  },
  fullscreenVideo: {
    width: '100%',
    height: 400,
    marginVertical: 10,
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fullscreenButton: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  fullscreenButtonText: {
    color: COLORS.text,
    fontSize: 14,
  },
  muteButton: {
    backgroundColor: COLORS.grey,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  muteButtonText: {
    color: COLORS.text,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  highContrastInput: {
    backgroundColor: COLORS.highContrast.cardBackground,
    borderColor: COLORS.highContrast.text,
    borderWidth: 1,
  },
  lightThemeInput: {
    backgroundColor: COLORS.light.cardBackground,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  authButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchAuthText: {
    textAlign: 'center',
    marginTop: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  voiceButton: {
    padding: 10,
    marginLeft: 10,
  },
  suggestionList: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 10,
    maxHeight: 150,
  },
  suggestionText: {
    padding: 5,
  },
  movieList: {
    paddingBottom: 20,
  },
  featuredList: {
    marginVertical: 10,
  },
  detailPoster: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  detailGenre: {
    fontSize: 16,
    marginBottom: 10,
  },
  detailSynopsis: {
    fontSize: 14,
    marginVertical: 10,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  watchlistButton: {
    backgroundColor: COLORS.accent,
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  watchlistButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  downloadButton: {
    backgroundColor: COLORS.grey,
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  shareButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  profileCard: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileName: {
    fontSize: 16,
    marginTop: 10,
  },
  profileList: {
    paddingBottom: 20,
  },
  profileText: {
    fontSize: 16,
    marginVertical: 5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  languagePicker: {
    flexDirection: 'row',
  },
  languageButton: {
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
  },
  languageButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  languageText: {
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    marginVertical: 5,
  },
  footerLinks: {
    flexDirection: 'row',
    marginVertical: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerLink: {
    fontSize: 12,
    marginHorizontal: 10,
  },
  socialIcons: {
    flexDirection: 'row',
  },
  socialIcon: {
    marginHorizontal: 10,
  },
  themeToggles: {
    flexDirection: 'row',
    marginTop: 10,
  },
  themeToggle: {
    marginHorizontal: 10,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  onboardingText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginVertical: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.grey,
    marginHorizontal: 5,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  parallaxHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
  },
  parallaxImage: {
    width: '100%',
    height: '100%',
  },
  parallaxOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    padding: 10,
  },
  parallaxTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  avatarButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
