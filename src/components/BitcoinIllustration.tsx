import React from 'react';
import { View, StyleSheet, Image, Text, Button } from 'react-native';

export function BitcoinIllustration() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Tsunami</Text>
      <Image 
        source={require('../../assets/logo-debut.png')} 
        style={styles.image}
      />
      <Text style={styles.subtitle}>Accept Bitcoin in your shop</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  image: {
    width: 150,
    height: 150,
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  }
}); 