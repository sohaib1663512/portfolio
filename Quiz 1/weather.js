import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Picker, ImageBackground } from 'react-native';
import { Svg, Line, Circle, Text as SvgText } from 'react-native-svg';

const WeatherApp = () => {
  const [selectedArea, setSelectedArea] = useState('Islamabad');
  const [weatherCondition, setWeatherCondition] = useState('sunny'); // Default condition

  // Dummy weather data
  const dummyWeather = {
    condition: weatherCondition,
    temperature: 25,
    precipitation: 10,
    humidity: 60,
    windSpeed: 5,
    hourly: [22, 24, 26, 28, 27, 25, 23, 21, 20, 19, 18, 17],
    forecast: [
      { day: 'Mon', condition: 'sunny', high: 28, low: 18 },
      { day: 'Tue', condition: 'cloudy', high: 26, low: 17 },
      { day: 'Wed', condition: 'rainy', high: 24, low: 16 },
      { day: 'Thu', condition: 'sunny', high: 27, low: 19 },
      { day: 'Fri', condition: 'cloudy', high: 25, low: 17 },
      { day: 'Sat', condition: 'rainy', high: 23, low: 15 },
      { day: 'Sun', condition: 'sunny', high: 26, low: 18 },
    ],
  };

  // Render hourly temperature chart
  const renderHourlyChart = () => {
    const chartWidth = 300;
    const chartHeight = 150;
    const padding = 20;
    const xInterval = chartWidth / (dummyWeather.hourly.length - 1);
    const minTemp = Math.min(...dummyWeather.hourly);
    const maxTemp = Math.max(...dummyWeather.hourly);
    const yScale = (temp) => chartHeight - ((temp - minTemp) / (maxTemp - minTemp)) * (chartHeight - padding);

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {dummyWeather.hourly.map((temp, index) => (
          <React.Fragment key={index}>
            <Circle
              cx={index * xInterval}
              cy={yScale(temp)}
              r={4}
              fill="#007AFF"
            />
            <SvgText
              x={index * xInterval}
              y={chartHeight - 5}
              fontSize={10}
              textAnchor="middle"
              fill="#FFF"
            >
              {index * 2}:00
            </SvgText>
            {index > 0 && (
              <Line
                x1={(index - 1) * xInterval}
                y1={yScale(dummyWeather.hourly[index - 1])}
                x2={index * xInterval}
                y2={yScale(temp)}
                stroke="#007AFF"
                strokeWidth={2}
              />
            )}
          </React.Fragment>
        ))}
      </Svg>
    );
  };

  // Render 7-day forecast
  const renderForecast = () => {
    return dummyWeather.forecast.map((day, index) => (
      <View key={index} style={styles.forecastItem}>
        <Text style={styles.forecastDay}>{day.day}</Text>
        <Text style={styles.forecastTemp}>
          {day.high}° / {day.low}°
        </Text>
        <Text style={styles.forecastCondition}>{day.condition}</Text>
      </View>
    ));
  };

  return (
    <ImageBackground
      source={{ uri: 'https://www.tovima.com/wp-content/uploads/2024/10/24/KON1385-scaled.jpg' }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Picker
            selectedValue={selectedArea}
            style={styles.picker}
            onValueChange={(itemValue) => {
              setSelectedArea(itemValue);
              setWeatherCondition(itemValue === 'Islamabad' ? 'sunny' : itemValue === 'Rawalpindi' ? 'cloudy' : 'rainy');
            }}
          >
            <Picker.Item label="Islamabad" value="Islamabad" />
            <Picker.Item label="Rawalpindi" value="Rawalpindi" />
            <Picker.Item label="Lahore" value="Lahore" />
          </Picker>
        </View>

        <View style={styles.currentWeather}>
          <Text style={styles.condition}>{dummyWeather.condition}</Text>
          <Text style={styles.temperature}>{dummyWeather.temperature}°C</Text>
          <Text style={styles.details}>
            Precipitation: {dummyWeather.precipitation}% | Humidity: {dummyWeather.humidity}% | Wind: {dummyWeather.windSpeed} m/s
          </Text>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Hourly Forecast</Text>
          {renderHourlyChart()}
        </View>

        <View style={styles.forecastContainer}>
          <Text style={styles.sectionTitle}>7-Day Forecast</Text>
          {renderForecast()}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay for better readability
  },
  header: {
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
    borderRadius: 10,
  },
  currentWeather: {
    alignItems: 'center',
    marginBottom: 20,
  },
  condition: {
    fontSize: 24,
    color: '#FFF',
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  details: {
    fontSize: 16,
    color: '#FFF',
  },
  chartContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFF',
  },
  forecastContainer: {
    marginBottom: 20,
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  forecastDay: {
    fontSize: 16,
    color: '#FFF',
  },
  forecastTemp: {
    fontSize: 16,
    color: '#FFF',
  },
  forecastCondition: {
    fontSize: 16,
    color: '#FFF',
  },
});

export default WeatherApp;
